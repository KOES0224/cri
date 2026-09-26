"use server";
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { admissionState } from '@/lib/program-policy';
import { canApply } from '@/lib/applicant';
import { APPLICATION_CHARGE, APPLICATION_FEE_ENABLED } from '@/lib/application-fee';
import { applicationSchema } from '@/lib/application-validation';
import { allowRequest } from '@/lib/request-limit';
import { confirmTossPayment, findConfirmedTossPayment } from '@/lib/toss';
import { revalidatePath } from 'next/cache';
import { notifyApplicationReceived, sendApplicationConfirmation } from '@/lib/notify';
import { META_VALUES, applicantRegion, applicantTypeFromRole, programContent, type MetaCustomData } from '@/lib/meta/config';
import { captureMetaContext, safeEventId, sendMetaEvent, type MetaPerson } from '@/lib/meta/capi';
import type { ApplicationInput } from '@/lib/application-validation';

/** Browser-generated Meta event id; the pixel fires the same event with it so Meta keeps one copy. */
type TrackingInput = { eventId?: string } | undefined;
const PROGRAM_CONTENT = { select: { id: true, title: true, category: true, subCategory: true, professors: { take: 1, select: { name: true, university: true, relatedMajor: true, potentialTopics: true } } } } as const;
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

// `error` stays English for existing callers; `code` names a key in t.apply.errors so the form can show the visitor's language.
export async function beginApplicationCheckout(programId: string, input: unknown, tracking?: TrackingInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canApply(session.user.role)) return { error: 'Sign in with a student or parent account before applying.', code: 'applySignIn' };
  if (!APPLICATION_FEE_ENABLED) return { error: 'No application fee is required. Submit the application without payment.', code: 'feeDisabled' };
  if (!process.env.TOSS_SECRET_KEY || !process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY) return { error: 'Online payment is unavailable. Contact admissions before paying.', code: 'paymentUnavailable' };
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) { const field = parsed.error.issues[0]?.path.join('.') || 'application'; return { error: `Check the application fields and word limits: ${field}.`, code: `invalidFields:${field}` }; }
  try {
    if (!await allowRequest('checkout', session.user.id, 5, 600)) return { error: 'Please wait before starting another checkout.', code: 'checkoutRateLimit' };
    const [program, document, existing] = await Promise.all([
      prisma.program.findUnique({ where: { id: programId }, include: { professors: PROGRAM_CONTENT.select.professors } }),
      prisma.applicationDocument.findFirst({ where: { id: parsed.data.resumeUrl.split('/').pop(), userId: session.user.id }, select: { id: true } }),
      prisma.application.findUnique({ where: { userId_programId: { userId: session.user.id, programId } } }),
    ]);
    if (!program || admissionState(program) !== 'OPEN') return { error: 'This program is no longer accepting applications. Please choose an available program.', code: 'programClosed' };
    if (!document) return { error: 'Please upload your CV again using this account.', code: 'resumeMissing' };
    if (existing) return { error: 'You have already applied to this program. Check your dashboard.', code: 'alreadyApplied' };
    const order = await prisma.$transaction(async tx => {
      // Only one active checkout per student/program can reach the provider.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${session.user.id + ':' + programId}))`;
      const pending = await tx.applicationCheckout.findUnique({ where: { userId_programId: { userId: session.user.id, programId } } });
      if (pending?.status === 'COMPLETED') throw new Error('Already completed');
      if (pending) {
        if (pending.expiresAt <= new Date()) throw new Error('CHECKOUT_REVIEW');
        if (JSON.stringify(applicationSchema.parse(pending.formData)) !== JSON.stringify(parsed.data)) throw new Error('CHECKOUT_CHANGED');
        return pending;
      }

      return tx.applicationCheckout.create({ data: {
      id: `CRI_${randomUUID()}`, userId: session.user.id, programId, formData: parsed.data,
      amount: APPLICATION_CHARGE.amount, currency: APPLICATION_CHARGE.currency,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    } });
    });
    const { data: meta } = await sendMetaEvent({ name: 'InitiateCheckout', eventId: safeEventId(tracking?.eventId), person: applicantPerson(session.user, parsed.data), data: applicationData(program, session.user.role, parsed.data.residenceCountry, { value: order.amount, currency: APPLICATION_CHARGE.currency }) });
    return { orderId: order.id, amount: order.amount, currency: APPLICATION_CHARGE.currency, orderName: `${program.title.slice(0, 75)} — application fee`, tracking: meta };
  } catch (error) {
    if (error instanceof Error && error.message === 'CHECKOUT_CHANGED') return {error: 'An earlier checkout is pending. Reload to resume your saved application. Contact admissions to revise it before paying.', code: 'checkoutChanged'};
    if (error instanceof Error && error.message === 'CHECKOUT_REVIEW') return {error: 'Your earlier checkout needs review. Contact admissions before paying again so we can check its payment status.', code: 'checkoutReview'};
    return { error: 'Unable to prepare checkout. Your payment has not been started. Please try again.', code: 'checkoutFailed' };
  }
}

export async function finalizePaidApplication({ paymentKey, orderId, amount, eventId }: { paymentKey: string; orderId: string; amount: number; eventId?: string }) {
  const session = await getServerSession(authOptions);
  // Read while the request is alive; the Purchase event is sent after the charge is recorded.
  const metaContext = await captureMetaContext();
  if (!session?.user?.id) return { error: 'Sign in with the account used for checkout.', code: 'checkoutSignIn' };
  if (typeof paymentKey !== 'string' || paymentKey.length > 500 || typeof orderId !== 'string' || orderId.length > 100) return { error: 'Invalid payment reference.', code: 'paymentReference' };
  try {
    const order = await prisma.applicationCheckout.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== session.user.id || order.amount !== amount || amount !== APPLICATION_CHARGE.amount || order.currency !== APPLICATION_CHARGE.currency) return { error: 'Payment details could not be verified. Contact support if you have a receipt.', code: 'paymentMismatch' };
    if (order.status === 'COMPLETED' && order.applicationId) return { success: true, applicationId: order.applicationId, receiptUrl: undefined };
    const program = await prisma.program.findUnique({ where: { id: order.programId }, include: { professors: PROGRAM_CONTENT.select.professors } });
    // Recheck immediately before asking the payment provider to confirm the charge.
    const canCharge = program && admissionState(program) === 'OPEN' && order.expiresAt > new Date();
    const existing = await prisma.application.findUnique({ where: { userId_programId: { userId: session.user.id, programId: order.programId } } });
    if (existing) return { error: 'An application already exists. Check your dashboard before making another payment.', code: 'alreadyAppliedPaid' };
    // A successful prior charge may be reconciled even after admissions close.
    const recovered = await findConfirmedTossPayment(orderId, order.amount);
    if (!recovered.success && !canCharge) return {error: 'This checkout has expired or the program has closed. Contact support with your order reference before paying again.', code: 'checkoutExpired'};
    const confirmed = recovered.success ? recovered : await confirmTossPayment(paymentKey, orderId, order.amount);
    if (!confirmed.success || !confirmed.paymentData) return { error: confirmed.error || 'Payment could not be confirmed. Please try again or contact support.', code: 'paymentUnconfirmed' };
    const payment = confirmed.paymentData;
    let created = false;
    const applicationId = await prisma.$transaction(async tx => {
      // Lock the order to make duplicate provider callbacks idempotent.
      await tx.$queryRaw`SELECT "id" FROM "ApplicationCheckout" WHERE "id" = ${orderId} FOR UPDATE`;
      const locked = await tx.applicationCheckout.findUniqueOrThrow({ where: { id: orderId } });
      if (locked.applicationId) return locked.applicationId;
      const app = await tx.application.create({ data: {
        userId: session.user.id, programId: order.programId, status: 'PENDING', stage: 'REVIEW', expectedWaitDays: 7,
        content: JSON.stringify({ ...(order.formData as Record<string, unknown>), payment: { feeStatus: 'PAID', amount: payment.totalAmount, currency: payment.currency, orderId, receiptUrl: payment.receiptUrl, approvedAt: payment.approvedAt } }),
        steps: { create: [
          { title: 'Application & Fee Submitted', status: 'COMPLETED', order: 1, date: new Date() },
          { title: 'Admissions Review', status: 'IN_PROGRESS', order: 2 },
          { title: 'Admissions Interview', status: 'UPCOMING', order: 3 },
          { title: 'Final Decision', status: 'UPCOMING', order: 4 },
        ] },
      } });
      await tx.applicationCheckout.update({ where: { id: orderId }, data: { status: 'COMPLETED', applicationId: app.id, formData: {} } });
      await tx.applicationDraft.deleteMany({where: {userId: session.user.id, programId: order.programId}});
      created = true;
      return app.id;
    });
    // Only the completed application is exported; payment keys and card details are never included.
    try {
      const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, include: { program: true, user: true } });
      const { syncApplicationToGoogleSheet } = await import('@/lib/googleSheets');
      await syncApplicationToGoogleSheet({ application: app, user: session.user, program: app.program, formData: JSON.parse(app.content || '{}') });
    } catch { console.error('Application saved; spreadsheet sync requires retry.'); }
    // Notify admissions and confirm to the family once, on the callback that created the application.
    // Best effort: the application and charge are already committed.
    if (created) try {
      const details = { applicationId, programTitle: program?.title || 'CRI program', accountEmail: session.user.email, form: order.formData as Record<string, unknown>, payment: { orderId, amount: payment.totalAmount, currency: payment.currency, receiptUrl: payment.receiptUrl } };
      await Promise.all([notifyApplicationReceived(details), sendApplicationConfirmation(details)]);
    } catch { console.error('Application saved; notification emails failed.'); }
    revalidatePath('/dashboard', 'layout');
    // Purchase is reported once per order: the event id is derived from the order, so retries and the browser copy deduplicate.
    let tracking: MetaCustomData | undefined;
    if (created && program) {
      const form = applicationSchema.safeParse(order.formData);
      const result = await sendMetaEvent({ name: 'Purchase', eventId: safeEventId(eventId) || orderId, person: form.success ? applicantPerson(session.user, form.data) : { email: session.user.email, externalId: session.user.id }, data: { ...applicationData(program, session.user.role, form.success ? form.data.residenceCountry : undefined), value: payment.totalAmount, currency: payment.currency, order_id: orderId } }, metaContext);
      tracking = result.data;
    }
    return { success: true, applicationId, receiptUrl: payment.receiptUrl, tracking };
  } catch {
    return { error: 'We could not finish recording your application. If a charge appears, do not pay again. Contact support@cri.kr with your order reference.', code: 'finalizeFailed' };
  }
}

/**
 * Free submission path, used while APPLICATION_FEE_ENABLED is off. Same validation and admission
 * checks as the paid checkout; the application is created directly with the fee marked as waived.
 */
export async function submitApplicationWithoutFee(programId: string, input: unknown, tracking?: TrackingInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canApply(session.user.role)) return { error: 'Sign in with a student or parent account before applying.', code: 'applySignIn' };
  if (APPLICATION_FEE_ENABLED) return { error: 'An application fee is required for this program. Please continue to payment.', code: 'feeRequired' };
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
    const applicationId = await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${session.user.id + ':' + programId}))`;
      const again = await tx.application.findUnique({ where: { userId_programId: { userId: session.user.id, programId } }, select: { id: true } });
      if (again) return again.id;
      const app = await tx.application.create({ data: {
        userId: session.user.id, programId, status: 'PENDING', stage: 'REVIEW', expectedWaitDays: 7,
        content: JSON.stringify({ ...parsed.data, payment: { feeStatus: 'WAIVED', amount: 0, currency: 'USD', submittedAt: submittedAt.toISOString() } }),
        steps: { create: [
          { title: 'Application Submitted', status: 'COMPLETED', order: 1, date: submittedAt },
          { title: 'Admissions Review', status: 'IN_PROGRESS', order: 2 },
          { title: 'Admissions Interview', status: 'UPCOMING', order: 3 },
          { title: 'Final Decision', status: 'UPCOMING', order: 4 },
        ] },
      } });
      await tx.applicationDraft.deleteMany({ where: { userId: session.user.id, programId } });
      await tx.applicationCheckout.deleteMany({ where: { userId: session.user.id, programId, status: 'PENDING' } });
      return app.id;
    });
    try {
      const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, include: { program: true, user: true } });
      const { syncApplicationToGoogleSheet } = await import('@/lib/googleSheets');
      await syncApplicationToGoogleSheet({ application: app, user: session.user, program: app.program, formData: JSON.parse(app.content || '{}') });
    } catch { console.error('Application saved; spreadsheet sync requires retry.'); }
    try {
      const details = { applicationId, programTitle: program.title, accountEmail: session.user.email, form: parsed.data as Record<string, unknown>, payment: null };
      await Promise.all([notifyApplicationReceived(details), sendApplicationConfirmation(details)]);
    } catch { console.error('Application saved; notification emails failed.'); }
    revalidatePath('/dashboard', 'layout');
    const { data: meta } = await sendMetaEvent({ name: 'SubmitApplication', eventId: safeEventId(tracking?.eventId), person: applicantPerson(session.user, parsed.data), data: applicationData(program, session.user.role, parsed.data.residenceCountry, META_VALUES.submitApplication ? { value: META_VALUES.submitApplication, currency: 'USD' } : undefined) });
    return { success: true, applicationId, tracking: meta };
  } catch {
    return { error: 'We could not submit your application. Your draft is saved; please try again or contact support@cri.kr.', code: 'submitFailed' };
  }
}
