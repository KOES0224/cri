"use server";
import { randomUUID } from 'node:crypto';
import { syncContactFromApplicationBestEffort } from '@/lib/contact-sync';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { admissionState } from '@/lib/program-policy';
import { canApply } from '@/lib/applicant';
import { APPLICATION_CHARGE } from '@/lib/application-fee';
import { applicationFeeFor, isPaymentReviewer } from '@/lib/payment-review';
import { applicationSchema } from '@/lib/application-validation';
import { allowRequest } from '@/lib/request-limit';
import { confirmTossPayment, findConfirmedTossPayment, tossPaymentState } from '@/lib/toss';
import { SETTLE_GRACE_MS, checkoutLocksFormNow, confirmRefusalIsFinal, confirmSaysNoPayment, nextCheckoutStep } from '@/lib/checkout-policy';
import type { PaidOrderResult, PaymentResult } from '@/lib/payment-result';
import { feeCodeProblem, feeWithCode, normalizeFeeCode } from '@/lib/fee-code';
import { revalidatePath } from 'next/cache';
import { notifyApplicationReceived, notifyPaymentFormProblem, notifyPaymentNeedsReview, sendApplicationConfirmation } from '@/lib/notify';
import { META_VALUES, applicantRegion, applicantTypeFromRole, programContent, type MetaCustomData } from '@/lib/meta/config';
import { captureMetaContext, sendMetaEvent, type MetaPerson } from '@/lib/meta/capi';
import type { ApplicationInput } from '@/lib/application-validation';

const PROGRAM_CONTENT = { select: { id: true, title: true, category: true, subCategory: true, professors: { select: { name: true, university: true, relatedMajor: true, potentialTopics: true } } } } as const;
type ProgramForContent = { id: string; title: string; category: string; subCategory: string | null; professors: { name: string; university: string | null; relatedMajor: string | null; potentialTopics: string | null }[] };

/** The person on the browser: the guardian when a parent account applies, otherwise the student. */
function applicantPerson(user: { id: string; email?: string | null; role?: string | null }, form: Pick<ApplicationInput, 'studentFirstName' | 'studentLastName' | 'studentPhone' | 'parentFirstName' | 'parentLastName' | 'parentPhone' | 'residenceCountry'>): MetaPerson {
  const parent = user.role === 'PARENT' && form.parentPhone;
  return {
    email: user.email, externalId: user.id, country: form.residenceCountry,
    phone: parent ? form.parentPhone : form.studentPhone,
    firstName: parent ? form.parentFirstName : form.studentFirstName, lastName: parent ? form.parentLastName : form.studentLastName,
  };
}
function applicationData(program: ProgramForContent, role: string | null | undefined, country: string | undefined, money?: { value: number; currency: string }): MetaCustomData {
  return { ...programContent(program), applicant_type: applicantTypeFromRole(role), applicant_region: applicantRegion(country), ...(money || {}) };
}

/**
 * The order of a paid application that admissions deleted (src/app/actions/adminApplications.ts keeps the row as the
 * site's record of that payment). It is never confirmed, recovered or settled again.
 */
const REMOVED_ORDER = 'REMOVED';
const REMOVED_ORDER_TEXT = 'This application was removed by admissions. If you were charged for it and have not heard from us, contact support@cri.kr with your order reference.';

// `error` stays English for existing callers; `code` names a key in t.apply.errors so the form can show the visitor's language.
export async function beginApplicationCheckout(programId: string, input: unknown, partnerCode?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canApply(session.user.role)) return { error: 'Sign in with a student or parent account before applying.', code: 'applySignIn' };
  const { feeEnabled, reviewer } = await applicationFeeFor(session.user.id);
  if (!feeEnabled) return { error: 'No application fee is required. Submit the application without payment.', code: 'feeDisabled' };
  if (!process.env.TOSS_SECRET_KEY || !process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY) return { error: 'Online payment is unavailable. Contact admissions before paying.', code: 'paymentUnavailable' };
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) { const field = parsed.error.issues[0]?.path.join('.') || 'application'; return { error: `Check the application fields and word limits: ${field}.`, code: `invalidFields:${field}` }; }
  try {
    // Roomy enough for a few declined cards in a row; still stops a script from minting orders.
    if (!await allowRequest('checkout', session.user.id, 12, 600)) return { error: 'Please wait before starting another checkout.', code: 'checkoutRateLimit' };
    const [program, document, existing] = await Promise.all([
      prisma.program.findUnique({ where: { id: programId }, include: { professors: PROGRAM_CONTENT.select.professors } }),
      prisma.applicationDocument.findFirst({ where: { id: parsed.data.resumeUrl.split('/').pop(), userId: session.user.id }, select: { id: true } }),
      prisma.application.findUnique({ where: { userId_programId: { userId: session.user.id, programId } } }),
    ]);
    if (!program || admissionState(program) !== 'OPEN') return { error: 'This program is no longer accepting applications. Please choose an available program.', code: 'programClosed' };
    if (!document) return { error: 'Please upload your CV again using this account.', code: 'resumeMissing' };
    if (existing) return { error: 'You have already applied to this program. Check your dashboard.', code: 'alreadyApplied' };
    // A referral code prices the order. It is looked up again here, whatever the form showed; the use is counted when
    // the application is recorded.
    let due: number = APPLICATION_CHARGE.amount, feeCode: string | null = null;
    if (partnerCode) {
      const normalized = normalizeFeeCode(partnerCode);
      const row = normalized ? await prisma.feeCode.findUnique({ where: { code: normalized } }) : null;
      const problem = feeCodeProblem(row);
      if (problem || !row) return { error: 'This referral code cannot be used. Remove it or check it with the organization that gave it to you.', code: problem === 'expired' ? 'feeCodeExpired' : problem === 'usedUp' ? 'feeCodeUsedUp' : 'feeCodeInvalid' };
      due = feeWithCode(row, APPLICATION_CHARGE.amount);
      feeCode = row.code;
      // Nothing to charge: the form sends a waived application through the no-payment path instead.
      if (due === 0) return { error: 'This referral code waives the application fee. Submit the application without payment.', code: 'feeCodeWaives' };
    }
    // An earlier attempt that reached the provider is judged by the provider's record of that payment. It is read
    // before the transaction so the lock below is never held across a network call (rules: src/lib/checkout-policy.ts).
    const earlier = await prisma.applicationCheckout.findUnique({ where: { userId_programId: { userId: session.user.id, programId } }, select: { id: true, status: true, paymentKey: true, amount: true, currency: true } });
    const keyState = earlier?.status === 'PENDING' && earlier.paymentKey ? { id: earlier.id, paymentKey: earlier.paymentKey, state: await tossPaymentState(earlier.paymentKey, earlier.id, earlier.amount, earlier.currency) } : null;
    if (keyState?.state === 'paid') {
      // The earlier payment went through but was never recorded: record it now instead of charging again.
      const recovered = await finalizePaidApplication({ paymentKey: keyState.paymentKey, orderId: keyState.id, amount: earlier!.amount });
      if (recovered.success) return { alreadyPaid: true as const, applicationId: recovered.applicationId };
      return { error: 'Your earlier checkout needs review. Contact admissions before paying again so we can check its payment status.', code: 'checkoutReview' };
    }
    const order = await prisma.$transaction(async tx => {
      // Only one active checkout per student/program can reach the provider.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${session.user.id + ':' + programId}))`;
      const pending = await tx.applicationCheckout.findUnique({ where: { userId_programId: { userId: session.user.id, programId } } });
      // A pending checkout saved under an older form shape (e.g. before residenceCountry existed) counts as changed.
      const previous = pending ? applicationSchema.safeParse(pending.formData) : null;
      const step = nextCheckoutStep(pending, { unchanged: Boolean(previous?.success && JSON.stringify(previous.data) === JSON.stringify(parsed.data)), charge: { amount: due, currency: APPLICATION_CHARGE.currency }, now: new Date(), keyState });
      if (step === 'completed') throw new Error('Already completed');
      if (step === 'reuse') return pending!;
      if (step === 'review' || step === 'recover') throw new Error('CHECKOUT_REVIEW');
      if (step === 'replace') {
        // Conditional on the exact state that was judged: if a confirm started in between, the row is left alone.
        const removed = await tx.applicationCheckout.deleteMany({ where: { id: pending!.id, status: 'PENDING', paymentKey: pending!.paymentKey } });
        if (removed.count !== 1) throw new Error('CHECKOUT_REVIEW');
      }
      return tx.applicationCheckout.create({ data: {
        id: `CRI_${randomUUID()}`, userId: session.user.id, programId, formData: parsed.data,
        amount: due, currency: APPLICATION_CHARGE.currency, keyTracked: true, feeCode,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      } });
    });
    // Every attempt gets a new order id, so the event id is the applicant and program instead: repeated attempts, and
    // the browser's pixel call, deduplicate to one InitiateCheckout. The payment-review account is not a prospect: no
    // ad-measurement events.
    const checkoutEventId = `checkout_${session.user.id}_${programId}`;
    const meta = reviewer ? undefined : (await sendMetaEvent({ name: 'InitiateCheckout', eventId: checkoutEventId, person: applicantPerson(session.user, parsed.data), data: applicationData(program, session.user.role, parsed.data.residenceCountry, { value: order.amount, currency: APPLICATION_CHARGE.currency }) })).data;
    return { orderId: order.id, amount: order.amount, currency: order.currency, orderName: `${program.title.slice(0, 75)} — application fee`, tracking: meta, eventId: checkoutEventId };
  } catch (error) {
    if (error instanceof Error && error.message === 'CHECKOUT_REVIEW') return {error: 'Your earlier checkout needs review. Contact admissions before paying again so we can check its payment status.', code: 'checkoutReview'};
    return { error: 'Unable to prepare checkout. Your payment has not been started. Please try again.', code: 'checkoutFailed' };
  }
}

export async function finalizePaidApplication({ paymentKey: receivedKey, orderId, amount }: { paymentKey: string; orderId: string; amount: number }): Promise<PaymentResult> {
  const session = await getServerSession(authOptions);
  // Read while the request is alive; the Purchase event is sent after the charge is recorded.
  const metaContext = await captureMetaContext();
  if (!session?.user?.id) return { error: 'Sign in with the account used for checkout.', code: 'checkoutSignIn' };
  if (typeof receivedKey !== 'string' || !receivedKey || receivedKey.length > 500 || typeof orderId !== 'string' || orderId.length > 100) return { error: 'Invalid payment reference.', code: 'paymentReference' };
  let paymentKey = receivedKey;
  try {
    const order = await prisma.applicationCheckout.findUnique({ where: { id: orderId } });
    // The order was replaced by a newer attempt (another tab, or Pay pressed again): this one is never confirmed, so nothing is charged for it.
    if (!order) return { error: 'This payment session is no longer active and you have not been charged. Go back to your application and pay again.', code: 'paymentSuperseded' };
    // The order row is the price: the normal fee, or less when it was made with a referral code. Never more, never zero.
    if (order.userId !== session.user.id || order.amount !== amount || order.amount <= 0 || order.amount > APPLICATION_CHARGE.amount || order.currency !== APPLICATION_CHARGE.currency) return { error: 'Payment details could not be verified. Contact support if you have a receipt.', code: 'paymentMismatch' };
    if (order.status === REMOVED_ORDER) return { error: REMOVED_ORDER_TEXT, code: 'applicationRemoved' };
    const reviewer = await isPaymentReviewer(session.user.id);
    if (order.status === 'COMPLETED' && order.applicationId) return completedOrder(order.id, order.applicationId, reviewer);
    const program = await prisma.program.findUnique({ where: { id: order.programId }, include: { professors: PROGRAM_CONTENT.select.professors } });
    // Recheck immediately before asking the payment provider to confirm the charge.
    // The row's expiry is not a gate here: this is still the current order for the applicant, and the provider's own
    // ten-minute confirm window bounds how late a payment can arrive.
    const canCharge = program && admissionState(program) === 'OPEN';
    const existing = await prisma.application.findUnique({ where: { userId_programId: { userId: session.user.id, programId: order.programId } } });
    if (existing) return { error: 'An application already exists. Check your dashboard before making another payment.', code: 'alreadyAppliedPaid' };
    // One order, one charge: an earlier attempt on this order that reached the provider is settled before a new one.
    let replacesKey: string | null = null;
    if (order.paymentKey && order.paymentKey !== paymentKey) {
      const earlierState = await tossPaymentState(order.paymentKey, orderId, order.amount, order.currency);
      if (earlierState === 'dead') replacesKey = order.paymentKey;
      if (earlierState === 'unknown' || earlierState === 'open') {
        if (!reviewer) await alertPaymentReview(orderId, session.user.email, order.programId, 'A new payment attempt arrived while an earlier attempt on the same order is still unsettled at the payment provider.');
        return { error: 'Your earlier checkout needs review. Contact admissions before paying again so we can check its payment status.', code: 'checkoutReview' };
      }
      // The earlier payment went through: record that one. The new authorisation is never confirmed and lapses unused.
      if (earlierState === 'paid') paymentKey = order.paymentKey;
    }
    // A successful prior charge may be reconciled even after admissions close.
    const recovered = await findConfirmedTossPayment(paymentKey, orderId, order.amount);
    if (!recovered.success && !canCharge) return {error: 'This program is no longer accepting applications, so the payment was not taken. Contact admissions if you need help.', code: 'checkoutExpired'};
    let confirmed = recovered;
    if (!recovered.success) {
      // A reduced price holds while the order is fresh (30 minutes from pricing). On an older order the code must
      // still be usable: if it was switched off, expired or used up meanwhile, nothing is charged and the applicant
      // prices a new order from the form.
      if (order.feeCode && !order.paymentKey && order.expiresAt <= new Date() && feeCodeProblem(await prisma.feeCode.findUnique({ where: { code: order.feeCode } }))) {
        if (await releaseCheckout(order, null)) return { error: 'The referral code on this order can no longer be used, and you have not been charged. Go back to your application to continue.', code: 'feeCodeLapsed' };
        // Not released: another return for this order stored its payment key a moment ago and is being confirmed.
        return { error: 'Another payment for this application is being confirmed. Please do not pay again; reopen your application in a moment to see its status.', code: 'paymentPending' };
      }
      // The key is stored before the provider is asked to charge, so a row without one provably has no charge. The
      // update is conditional: if the order was replaced in another tab meanwhile, nothing is confirmed.
      // First key wins: the row accepts this key only while it holds none, this same one, or the one just judged dead.
      // Two returns racing with different keys cannot both be confirmed.
      const claimed = await prisma.applicationCheckout.updateMany({ where: { id: orderId, status: 'PENDING', OR: [{ paymentKey: null }, { paymentKey }, ...(replacesKey ? [{ paymentKey: replacesKey }] : [])] }, data: { paymentKey, paymentKeyAt: new Date() } });
      if (claimed.count !== 1) return { error: 'Another payment for this application is being confirmed. Please do not pay again; reopen your application in a moment to see its status.', code: 'paymentPending' };
      confirmed = await confirmTossPayment(paymentKey, orderId, order.amount);
    }
    if (!confirmed.success || !confirmed.paymentData) {
      // The provider's own reason is only shown to the payment-review account, whose job is to test this path.
      const providerReason = reviewer && confirmed.providerCode ? `${confirmed.providerCode}${confirmed.providerMessage ? ` · ${confirmed.providerMessage}` : ''}` : undefined;
      // A final refusal that the provider's record confirms (no charge stands) releases the order, so the applicant can
      // pay again with another card straight away. Anything unclear keeps the order for reconciliation.
      // The provider has no such payment (unknown key, or its ten-minute window passed): nothing was charged.
      if (confirmSaysNoPayment(confirmed.providerCode) && await releaseCheckout(order, paymentKey)) {
        return { error: 'This payment session expired and you have not been charged. Go back to your application and pay again.', code: 'paymentSuperseded', providerReason };
      }
      if (confirmRefusalIsFinal(confirmed.providerCode) && await tossPaymentState(paymentKey, orderId, order.amount, order.currency) === 'dead' && await releaseCheckout(order, paymentKey)) {
        return { error: 'Your payment was not approved and you have not been charged. Try again with another card or payment method.', code: 'paymentDeclined', providerReason };
      }
      if (!reviewer) await alertPaymentReview(orderId, session.user.email, order.programId, `The payment provider gave no clear answer when the charge was confirmed${confirmed.providerCode ? ` (${confirmed.providerCode})` : ' (timeout or network error)'}. The charge may or may not have gone through.`);
      return { error: confirmed.error || 'Payment could not be confirmed. Please try again or contact support.', code: 'paymentUnconfirmed', providerReason };
    }
    const payment = confirmed.paymentData;
    let created = false;
    const applicationId = await prisma.$transaction(async tx => {
      // Lock the order to make duplicate provider callbacks idempotent.
      await tx.$queryRaw`SELECT "id" FROM "ApplicationCheckout" WHERE "id" = ${orderId} FOR UPDATE`;
      const locked = await tx.applicationCheckout.findUniqueOrThrow({ where: { id: orderId } });
      if (locked.applicationId) return locked.applicationId;
      const app = await tx.application.create({ data: {
        userId: session.user.id, programId: order.programId, status: 'PENDING', stage: 'REVIEW', expectedWaitDays: 7,
        content: JSON.stringify({ ...(order.formData as Record<string, unknown>), payment: { feeStatus: 'PAID', amount: payment.totalAmount, currency: payment.currency, orderId, receiptUrl: payment.receiptUrl, approvedAt: payment.approvedAt, method: payment.method, ...(order.feeCode ? { code: order.feeCode, normalFee: APPLICATION_CHARGE.amount } : {}) } }),
        steps: { create: [
          { title: 'Application & Fee Submitted', status: 'COMPLETED', order: 1, date: new Date() },
          // Not "in progress" yet: the terms and the refund policy turn on when admissions actually starts examining
          // the application, so staff move this step when they open the file.
          { title: 'Admissions Review', status: 'UPCOMING', order: 2 },
          { title: 'Admissions Interview', status: 'UPCOMING', order: 3 },
          { title: 'Final Decision', status: 'UPCOMING', order: 4 },
        ] },
      } });
      await tx.applicationCheckout.update({ where: { id: orderId }, data: { status: 'COMPLETED', applicationId: app.id, formData: {} } });
      await tx.applicationDraft.deleteMany({where: {userId: session.user.id, programId: order.programId}});
      // The reduced fee is already paid, so the use is counted without re-checking the code's limit or expiry.
      if (order.feeCode) await tx.$executeRaw`UPDATE "FeeCode" SET "usedCount" = "usedCount" + 1, "updatedAt" = (now() AT TIME ZONE 'UTC') WHERE "code" = ${order.feeCode}`;
      created = true;
      return app.id;
    });
    // Notify admissions and confirm to the family once, on the callback that created the application.
    // Best effort: the application and charge are already committed.
    let emailed = false;
    if (created) try {
      const details = { applicationId, programTitle: program?.title || 'CRI program', accountEmail: session.user.email, form: order.formData as Record<string, unknown>, payment: { orderId, amount: payment.totalAmount, currency: payment.currency, receiptUrl: payment.receiptUrl, method: payment.method, approvedAt: payment.approvedAt }, feeCode: order.feeCode, test: reviewer };
      const [, confirmation] = await Promise.all([notifyApplicationReceived(details), sendApplicationConfirmation(details)]);
      emailed = Boolean(confirmation?.sent);
    } catch { console.error('Application saved; notification emails failed.'); }
    if (created) await syncContactFromApplicationBestEffort(applicationId, 'APPLIED');
    revalidatePath('/dashboard', 'layout');
    // Purchase is reported once per order: the event id is derived from the order, so retries and the browser copy deduplicate.
    let tracking: MetaCustomData | undefined;
    let submit: { tracking: MetaCustomData | undefined; eventId: string } | undefined;
    if (created && program && !reviewer) {
      const form = applicationSchema.safeParse(order.formData);
      const person = form.success ? applicantPerson(session.user, form.data) : { email: session.user.email, externalId: session.user.id };
      const country = form.success ? form.data.residenceCountry : undefined;
      const result = await sendMetaEvent({ name: 'Purchase', eventId: orderId, person, data: { ...applicationData(program, session.user.role, country), value: payment.totalAmount, currency: payment.currency, order_id: orderId } }, metaContext);
      tracking = result.data;
      // Campaigns that optimise for a submitted application keep their signal on the paid path: the same event the free
      // path sends, keyed by the application id (Purchase keeps the order id).
      const submitted = await sendMetaEvent({ name: 'SubmitApplication', eventId: applicationId, person, data: applicationData(program, session.user.role, country, META_VALUES.submitApplication ? { value: META_VALUES.submitApplication, currency: 'USD' } : undefined) }, metaContext);
      submit = { tracking: submitted.data, eventId: applicationId };
    }
    // `created` is true only on the call that recorded the application, so browser analytics count it once.
    return { success: true, applicationId, receiptUrl: payment.receiptUrl, tracking, eventId: orderId, review: reviewer, created, submit, programTitle: program?.title,
      receipt: { amount: payment.totalAmount, currency: payment.currency, method: payment.method, approvedAt: payment.approvedAt, email: emailed ? session.user.email ?? undefined : undefined } };
  } catch {
    await alertPaymentReview(orderId, session.user.email, null, 'The site failed while recording a paid application. If the charge was approved, the applicant has paid but has no application yet.');
    return { error: 'We could not finish recording your application. If a charge appears, do not pay again. Contact support@cri.kr with your order reference.', code: 'finalizeFailed' };
  }
}

/** A finished order, read back from the application so the success page shows the same receipt on every visit. */
async function completedOrder(orderId: string, applicationId: string, reviewer: boolean): Promise<PaidOrderResult> {
  const application = await prisma.application.findUnique({ where: { id: applicationId }, select: { content: true, program: { select: { title: true } } } });
  let payment: Record<string, unknown> = {};
  try { const content = JSON.parse(application?.content || '{}'); if (content?.payment && typeof content.payment === 'object') payment = content.payment as Record<string, unknown>; } catch {}
  const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined);
  const currency = text(payment.currency);
  return {
    success: true, applicationId, receiptUrl: text(payment.receiptUrl), eventId: orderId, review: reviewer, created: false, programTitle: application?.program?.title,
    receipt: typeof payment.amount === 'number' && currency ? { amount: payment.amount, currency, method: text(payment.method), approvedAt: text(payment.approvedAt) } : undefined,
  };
}

/** Tells admissions, at most once an hour per order, that a payment needs a manual look. Never throws. */
async function alertPaymentReview(orderId: string, accountEmail: string | null | undefined, programId: string | null, situation: string) {
  try {
    if (!await allowRequest('payment-review-mail', orderId, 1, 3600)) return;
    // What the Toss admin should show for this order: the order's own price, which is below the normal fee when a
    // referral code was applied. Best effort: the alert goes out without it when the order cannot be read.
    const order = await prisma.applicationCheckout.findUnique({ where: { id: orderId }, select: { programId: true, amount: true, currency: true, feeCode: true } }).catch(() => null);
    const title = programId ?? order?.programId;
    const program = title ? await prisma.program.findUnique({ where: { id: title }, select: { title: true } }).catch(() => null) : null;
    const expected = order ? `${order.amount.toFixed(2)} ${order.currency}${order.feeCode ? ` (referral code ${order.feeCode}; the normal fee is ${APPLICATION_CHARGE.amount.toFixed(2)} ${APPLICATION_CHARGE.currency})` : ''}` : null;
    await notifyPaymentNeedsReview({ orderId, accountEmail, programTitle: program?.title, situation, expected });
  } catch { console.error('Payment review alert failed.'); }
}

/**
 * The payer is back on the success page without a payment reference in the address bar (a reload, or a return after
 * signing in again). A finished order shows its receipt; an unsettled one is settled from the provider's record.
 */
export async function settleReturnedOrder(orderId: string): Promise<PaymentResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Sign in with the account used for checkout.', code: 'checkoutSignIn' };
  if (typeof orderId !== 'string' || !orderId || orderId.length > 100) return { error: 'Invalid payment reference.', code: 'paymentReference' };
  try {
    const row = await prisma.applicationCheckout.findUnique({ where: { id: orderId } });
    // No such order any more: it was released after a refusal or replaced by a newer attempt. Nothing was charged for it.
    if (!row) return { error: 'This payment session is no longer active and you have not been charged. Go back to your application and pay again.', code: 'paymentSuperseded' };
    if (row.userId !== session.user.id) return { error: 'Payment details could not be verified. Contact support if you have a receipt.', code: 'paymentMismatch' };
    if (row.status === REMOVED_ORDER) return { error: REMOVED_ORDER_TEXT, code: 'applicationRemoved' };
    if (row.status === 'COMPLETED' && row.applicationId) return completedOrder(row.id, row.applicationId, await isPaymentReviewer(session.user.id));
    const settled = await resolvePendingCheckout(row.programId);
    if (settled.state === 'paid') {
      const done = await prisma.applicationCheckout.findUnique({ where: { id: orderId } });
      if (done?.status === 'COMPLETED' && done.applicationId) return completedOrder(done.id, done.applicationId, await isPaymentReviewer(session.user.id));
    }
    if (settled.state === 'wait') return { error: 'We are still confirming this payment. Please do not pay again.', code: 'paymentPending' };
    if (settled.state === 'released') return { error: 'Your payment was not approved and you have not been charged. Try again with another card or payment method.', code: 'paymentDeclined' };
    if (settled.state === 'none') return { error: 'No payment was found for this order. You have not been charged.', code: 'paymentNotStarted' };
    return { error: 'Your earlier checkout needs review. Contact admissions before paying again so we can check its payment status.', code: 'checkoutReview' };
  } catch {
    return { error: 'We could not check this payment. If a charge appears, do not pay again. Contact support@cri.kr with your order reference.', code: 'finalizeFailed' };
  }
}

/**
 * Removes a checkout whose payment ended without a charge and makes sure the applicant's form survives as a draft, so
 * they return to an editable application. Conditional on the exact payment key that was judged (null: an order that
 * never reached the provider).
 */
async function releaseCheckout(order: { id: string; userId: string; programId: string; formData: unknown }, paymentKey: string | null): Promise<boolean> {
  return prisma.$transaction(async tx => {
    const removed = await tx.applicationCheckout.deleteMany({ where: { id: order.id, status: 'PENDING', paymentKey } });
    if (removed.count !== 1) return false;
    const form = applicationSchema.safeParse(order.formData);
    if (form.success) await tx.applicationDraft.upsert({ where: { userId_programId: { userId: order.userId, programId: order.programId } }, update: {}, create: { userId: order.userId, programId: order.programId, formData: form.data, step: 3 } });
    return true;
  });
}

/**
 * The browser could not load the payment form (`form`), the payment window failed in the form before any payment was
 * made (`window`), or the provider sent the payer back to the failure page with a code that is neither their own cancel
 * nor a card problem (`return`). Logged and mailed to admissions, a few times an hour at most, so a broken paid path is
 * noticed the moment an applicant hits it. Reports from the failure page have their own budget and wording: one of
 * them can be a one-off, and they must not use up the alarms for a form that does not load.
 */
export async function reportPaymentProblem(programId: string, where: 'form' | 'window' | 'return', code?: string, message?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;
  const place = where === 'window' || where === 'return' ? where : 'form';
  const safeCode = typeof code === 'string' ? code.replace(/[^A-Za-z0-9_]/g, '').slice(0, 60) : '';
  // The failure page takes its details from the address bar, which anyone can write: only the code is kept from it.
  const safeMessage = place !== 'return' && typeof message === 'string' ? message.replace(/\s+/g, ' ').slice(0, 200) : '';
  console.error('Payment form problem', place, safeCode || 'no-code', safeMessage);
  try {
    if (await isPaymentReviewer(session.user.id)) return;
    const [mine, all] = place === 'return' ? ['payment-return-report', 'payment-return-mail'] : ['payment-problem-report', 'payment-problem-mail'];
    if (!await allowRequest(mine, session.user.id, 3, 600) || !await allowRequest(all, 'all', 3, 3600)) return;
    const program = typeof programId === 'string' ? await prisma.program.findUnique({ where: { id: programId }, select: { title: true } }) : null;
    await notifyPaymentFormProblem({ accountEmail: session.user.email, programTitle: program?.title, where: place, code: safeCode, message: safeMessage });
  } catch { console.error('Payment problem alert failed.'); }
}

/**
 * Settles a checkout whose payment reached the provider but was never resolved here (a timeout, a closed tab): a
 * payment that went through becomes the application, one that ended without a charge is released, anything else
 * stays with admissions. Called when the applicant reopens the form.
 */
export async function resolvePendingCheckout(programId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || typeof programId !== 'string') return { state: 'none' as const };
  try {
    // Polled while a payment settles; running out of budget means "ask again later", not "contact admissions".
    if (!await allowRequest('checkout-resolve', session.user.id, 30, 600)) return { state: 'wait' as const };
    const row = await prisma.applicationCheckout.findUnique({ where: { userId_programId: { userId: session.user.id, programId } } });
    if (!row || row.status !== 'PENDING') return { state: 'none' as const };
    // A row from before payment keys were stored cannot be judged here; admissions clears it.
    if (!row.paymentKey) return { state: row.keyTracked ? 'none' as const : 'review' as const };
    const state = await tossPaymentState(row.paymentKey, row.id, row.amount, row.currency);
    if (state === 'paid') {
      const result = await finalizePaidApplication({ paymentKey: row.paymentKey, orderId: row.id, amount: row.amount });
      return result.success ? { state: 'paid' as const, applicationId: result.applicationId } : { state: 'review' as const };
    }
    if (state === 'dead' && await releaseCheckout(row, row.paymentKey)) return { state: 'released' as const };
    // Still in progress at the provider (it settles within seconds, or expires within 30 minutes), or it could not be
    // asked just now: wait. Only a payment that stays unsettled past the grace period goes to admissions.
    if (!row.paymentKeyAt || Date.now() - row.paymentKeyAt.getTime() < SETTLE_GRACE_MS) return { state: 'wait' as const };
    if (!await isPaymentReviewer(session.user.id)) await alertPaymentReview(row.id, session.user.email, row.programId, 'The payment provider still reports this payment as unsettled more than 40 minutes after it was confirmed. The application form stays locked until it is settled.');
    return { state: 'review' as const };
  } catch { return { state: 'wait' as const }; }
}

/**
 * Submission without a payment: while APPLICATION_FEE_ENABLED is off (except for the payment-review account), or,
 * with the fee on, for an applicant whose referral code waives it. Same validation and admission checks as the paid
 * checkout; the application is created directly with the fee marked as waived.
 */
export async function submitApplicationWithoutFee(programId: string, input: unknown, partnerCode?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canApply(session.user.role)) return { error: 'Sign in with a student or parent account before applying.', code: 'applySignIn' };
  const { feeEnabled, reviewer } = await applicationFeeFor(session.user.id);
  // With the fee on, only a referral code that waives it opens this path. It is checked and counted in the transaction below.
  const waiverCode = feeEnabled ? normalizeFeeCode(partnerCode) : null;
  if (feeEnabled && !waiverCode) return { error: 'An application fee is required for this program. Please continue to payment.', code: 'feeRequired' };
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) { const field = parsed.error.issues[0]?.path.join('.') || 'application'; return { error: `Check the application fields and word limits: ${field}.`, code: `invalidFields:${field}` }; }
  try {
    if (!await allowRequest('submit', session.user.id, 5, 600)) return { error: 'Please wait a moment before submitting again.', code: 'submitRateLimit' };
    const [program, document, existing] = await Promise.all([
      prisma.program.findUnique({ where: { id: programId }, include: { professors: PROGRAM_CONTENT.select.professors } }),
      prisma.applicationDocument.findFirst({ where: { id: parsed.data.resumeUrl.split('/').pop(), userId: session.user.id }, select: { id: true } }),
      prisma.application.findUnique({ where: { userId_programId: { userId: session.user.id, programId } } }),
    ]);
    if (!program || admissionState(program) !== 'OPEN') return { error: 'This program is no longer accepting applications. Please choose an available program.', code: 'programClosed' };
    if (!document) return { error: 'Please upload your CV again using this account.', code: 'resumeMissing' };
    if (existing) return { success: true, applicationId: existing.id, duplicate: true };
    const submittedAt = new Date();
    const saved = await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${session.user.id + ':' + programId}))`;
      const again = await tx.application.findUnique({ where: { userId_programId: { userId: session.user.id, programId } }, select: { id: true } });
      if (again) return { id: again.id, created: false };
      // A payment that already reached the provider for this application is settled first, never submitted over:
      // with a waiving code, and also when the fee was switched off while that payment was still unsettled.
      const unsettled = await tx.applicationCheckout.findUnique({ where: { userId_programId: { userId: session.user.id, programId } }, select: { status: true, paymentKey: true, keyTracked: true } });
      if (checkoutLocksFormNow(unsettled, feeEnabled)) throw new Error('CHECKOUT_REVIEW');
      if (waiverCode) {
        // One statement checks the code and counts the use, so a limited code cannot be over-used by submissions that
        // arrive together. Only a code that waives the whole fee qualifies. The column holds UTC without a zone, so
        // the clock is read as UTC whatever the database session's time zone is.
        const used = await tx.$executeRaw`UPDATE "FeeCode" SET "usedCount" = "usedCount" + 1, "updatedAt" = (now() AT TIME ZONE 'UTC') WHERE "code" = ${waiverCode} AND "active" = true AND "feeAmount" = 0 AND ("expiresAt" IS NULL OR "expiresAt" > (now() AT TIME ZONE 'UTC')) AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`;
        if (used !== 1) {
          // Say why, the way the form's own check does: expired and used up are worth telling apart.
          const problem = feeCodeProblem(await tx.feeCode.findUnique({ where: { code: waiverCode } }));
          throw new Error(problem === 'expired' ? 'FEE_CODE:feeCodeExpired' : problem === 'usedUp' ? 'FEE_CODE:feeCodeUsedUp' : 'FEE_CODE:feeCodeInvalid');
        }
      }
      const app = await tx.application.create({ data: {
        userId: session.user.id, programId, status: 'PENDING', stage: 'REVIEW', expectedWaitDays: 7,
        content: JSON.stringify({ ...parsed.data, payment: { feeStatus: 'WAIVED', amount: 0, currency: 'USD', submittedAt: submittedAt.toISOString(), ...(waiverCode ? { code: waiverCode, normalFee: APPLICATION_CHARGE.amount } : {}) } }),
        steps: { create: [
          { title: 'Application Submitted', status: 'COMPLETED', order: 1, date: submittedAt },
          { title: 'Admissions Review', status: 'IN_PROGRESS', order: 2 },
          { title: 'Admissions Interview', status: 'UPCOMING', order: 3 },
          { title: 'Final Decision', status: 'UPCOMING', order: 4 },
        ] },
      } });
      await tx.applicationDraft.deleteMany({ where: { userId: session.user.id, programId } });
      // A leftover checkout is cleared only if its payment never reached the provider; a keyed one may be an unrecorded charge.
      await tx.applicationCheckout.deleteMany({ where: { userId: session.user.id, programId, status: 'PENDING', paymentKey: null } });
      // A return from the payment window in another tab may have stored its payment key since the check above: then
      // that payment is being confirmed, and this submission is undone rather than left next to a charge. (If the
      // delete above won instead, the other tab finds no order and nothing is charged.)
      const claimed = await tx.applicationCheckout.findUnique({ where: { userId_programId: { userId: session.user.id, programId } }, select: { status: true, paymentKey: true } });
      if (claimed?.status === 'PENDING' && claimed.paymentKey) throw new Error('CHECKOUT_REVIEW');
      return { id: app.id, created: true };
    });
    // A second tab or a double submit lost the race to the first one: answer like an existing application, without a
    // second spreadsheet row, admissions email or Meta event.
    if (!saved.created) return { success: true, applicationId: saved.id, duplicate: true };
    const applicationId = saved.id;
    try {
      const details = { applicationId, programTitle: program.title, accountEmail: session.user.email, form: parsed.data as Record<string, unknown>, payment: null, feeCode: waiverCode, test: reviewer };
      await Promise.all([notifyApplicationReceived(details), sendApplicationConfirmation(details)]);
    } catch { console.error('Application saved; notification emails failed.'); }
    await syncContactFromApplicationBestEffort(applicationId, 'APPLIED');
    revalidatePath('/dashboard', 'layout');
    // The payment-review account is not a prospect: no ad-measurement events.
    if (reviewer) return { success: true, applicationId };
    // The application id is the event id, shared with the browser's pixel call.
    const { data: meta } = await sendMetaEvent({ name: 'SubmitApplication', eventId: applicationId, person: applicantPerson(session.user, parsed.data), data: applicationData(program, session.user.role, parsed.data.residenceCountry, META_VALUES.submitApplication ? { value: META_VALUES.submitApplication, currency: 'USD' } : undefined) });
    return { success: true, applicationId, tracking: meta, eventId: applicationId };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('FEE_CODE:')) return { error: 'This referral code cannot be used. Remove it or check it with the organization that gave it to you.', code: error.message.slice('FEE_CODE:'.length) };
    if (error instanceof Error && error.message === 'CHECKOUT_REVIEW') return { error: 'Your earlier checkout needs review. Contact admissions before paying again so we can check its payment status.', code: 'checkoutReview' };
    return { error: 'We could not submit your application. Your draft is saved; please try again or contact support@cri.kr.', code: 'submitFailed' };
  }
}
