import { absoluteResumeUrl } from './resume-links';
import { COMPANY } from '@/lib/company';
import { Resend } from 'resend';

/**
 * Transactional email for admissions. Every call is best effort: when RESEND_API_KEY or
 * AUTH_EMAIL_FROM is missing, or the provider fails, we log and return { sent: false } so a
 * saved lead or paid application is never rolled back because a notification could not go out.
 */
const ADMISSIONS_INBOX = process.env.ADMISSIONS_NOTIFY_EMAIL || 'support@cri.kr';
const SITE_URL = (process.env.NEXTAUTH_URL || 'https://criglobal.org').replace(/\/$/, '');

type Mail = { to: string | string[]; subject: string; text: string; replyTo?: string };

function configured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM);
}

function validEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

async function send(mail: Mail): Promise<{ sent: boolean; error?: string }> {
  const recipients = (Array.isArray(mail.to) ? mail.to : [mail.to]).filter(validEmail);
  if (recipients.length === 0) return { sent: false, error: 'no valid recipient' };
  if (!configured()) {
    console.warn(`[notify] email not configured; skipped "${mail.subject}" to ${recipients.join(', ')}`);
    return { sent: false, error: 'not configured' };
  }
  try {
    const response = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.AUTH_EMAIL_FROM!,
      to: recipients,
      subject: mail.subject,
      text: mail.text,
      replyTo: validEmail(mail.replyTo) ? mail.replyTo : undefined,
    });
    if (response.error) { console.error('[notify] provider error:', response.error.message); return { sent: false, error: response.error.message }; }
    return { sent: true };
  } catch (error) {
    console.error('[notify] send failed:', error instanceof Error ? error.message : error);
    return { sent: false, error: 'send failed' };
  }
}

/** New inquiry from the public contact form → admissions inbox, reply-to the sender. */
export async function notifyContactInquiry(input: { name: string; email: string; message: string; topic?: string; programTitle?: string | null; leadId: string }) {
  const lines = [
    `New inquiry from the website contact form.`,
    ``,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    input.topic ? `Topic: ${input.topic}` : null,
    input.programTitle ? `Program: ${input.programTitle}` : null,
    ``,
    `Message:`,
    input.message,
    ``,
    `Reply directly to this email to answer. Lead record: ${SITE_URL}/dashboard/leads/${input.leadId}`,
  ].filter((line): line is string => line !== null);
  return send({ to: ADMISSIONS_INBOX, subject: `[CRI inquiry] ${input.name}${input.programTitle ? ` · ${input.programTitle}` : ''}`, text: lines.join('\n'), replyTo: input.email });
}

type PaidApplication = {
  applicationId: string;
  programTitle: string;
  accountEmail?: string | null;
  form: Record<string, unknown>;
  payment: { orderId: string; amount: number; currency: string; receiptUrl?: string | null; method?: string | null; approvedAt?: string | null } | null;
  /** Referral code the fee was waived or reduced with, if any. */
  feeCode?: string | null;
  /** Submitted by the payment-gateway review account: subjects are labelled so nobody processes it. */
  test?: boolean;
};

const TEST_PREFIX = '[TEST · payment review] ';

function str(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }

/** Paid application → admissions inbox with the key facts and a link to the admin review page. */
export async function notifyApplicationReceived(app: PaidApplication) {
  const f = app.form;
  const student = `${str(f.studentFirstName)} ${str(f.studentLastName)}`.trim() || 'Unknown student';
  const parent = `${str(f.parentFirstName)} ${str(f.parentLastName)}`.trim();
  const lines = [
    app.payment ? `A new application has been submitted and the application fee was paid.` : `A new application has been submitted (no application fee).`,
    ``,
    `Program: ${app.programTitle}`,
    `Student: ${student}${str(f.school) ? ` · ${str(f.school)}` : ''}${str(f.gradYear) ? ` · class of ${str(f.gradYear)}` : ''}`,
    `Student email: ${str(f.studentEmail) || '-'}  phone: ${str(f.studentPhone) || '-'}`,
    parent ? `Parent / guardian: ${parent} · ${str(f.parentEmail) || '-'} · ${str(f.parentPhone) || '-'}` : null,
    app.accountEmail ? `Account email: ${app.accountEmail}` : null,
    str(f.residenceCountry) ? `Country of residence: ${str(f.residenceCountry)}` : null,
    str(f.resumeDriveUrl) ? `Resume (Drive): ${str(f.resumeDriveUrl)}` : null,
    str(f.resumeUrl) ? `Resume (site, admin login): ${absoluteResumeUrl(f.resumeUrl)}` : null,
    `Area of interest: ${str(f.areaOfInterest) || '-'}`,
    `First-choice professor: ${str(f.firstChoiceProfessor) || '-'}`,
    ``,
    app.payment ? `Fee: ${app.payment.amount.toLocaleString()} ${app.payment.currency} · order ${app.payment.orderId}${app.payment.receiptUrl ? ` · receipt ${app.payment.receiptUrl}` : ''}${app.feeCode ? ` · reduced with referral code ${app.feeCode}` : ''}` : app.feeCode ? `Fee: waived with referral code ${app.feeCode}` : `Fee: none (waived)`,
    ``,
    `Review: ${SITE_URL}/dashboard/applications-admin`,
  ].filter((line): line is string => line !== null);
  return send({ to: ADMISSIONS_INBOX, subject: `${app.test ? TEST_PREFIX : ''}[CRI application] ${student} · ${app.programTitle}`, text: lines.join('\n'), replyTo: str(f.studentEmail) || str(f.parentEmail) || undefined });
}

/** A checkout that could not be settled automatically: admissions gets the order number to look up in the Toss admin. */
export async function notifyPaymentNeedsReview(input: { orderId: string; accountEmail?: string | null; programTitle?: string | null; situation: string; expected?: string | null }) {
  const text = [
    `An application-fee payment could not be settled automatically and may need a manual check.`,
    ``,
    `Order number: ${input.orderId}`,
    input.accountEmail ? `Account email: ${input.accountEmail}` : null,
    input.programTitle ? `Program: ${input.programTitle}` : null,
    input.expected ? `Amount of this order: ${input.expected}` : null,
    `What happened: ${input.situation}`,
    ``,
    `What to do: look the order number up in the Toss Payments admin (결제조회).`,
    `- Approved there: ask the applicant to open the application form again. The site records the payment and submits the application by itself, without a second charge.`,
    `- Failed or expired there: nothing to do. The form unlocks by itself the next time the applicant opens it.`,
    `- Still unclear: reply to the applicant and contact Toss Payments with the order number.`,
  ].filter((line): line is string => line !== null).join('\n');
  return send({ to: ADMISSIONS_INBOX, subject: `[CRI payment check] ${input.orderId}`, text, replyTo: validEmail(input.accountEmail) ? input.accountEmail! : undefined });
}

/** The payment form or window did not work for an applicant: nobody can apply while this lasts, so admissions hears at once. */
export async function notifyPaymentFormProblem(input: { accountEmail?: string | null; programTitle?: string | null; where: string; code?: string | null; message?: string | null }) {
  const text = [
    `An applicant could not use the application-fee payment ${input.where === 'window' ? 'window' : 'form'}. While this lasts, applicants cannot pay and therefore cannot submit.`,
    ``,
    input.accountEmail ? `Account email: ${input.accountEmail}` : null,
    input.programTitle ? `Program: ${input.programTitle}` : null,
    `Reported by the payment SDK: ${input.code || 'no code'}${input.message ? ` · ${input.message}` : ''}`,
    ``,
    `What to check:`,
    `- Toss Payments admin: the payment UI named in NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY exists and is connected to the US-dollar merchant id, and that merchant id's contract is complete.`,
    `- If it cannot be fixed quickly, set NEXT_PUBLIC_APPLICATION_FEE_ENABLED to false in Vercel and redeploy: applications are then free again. A payment that already reached Toss keeps its applicant's form locked until it is settled, so nobody is charged and also submitted for free.`,
    `This alert is sent at most a few times an hour.`,
  ].filter((line): line is string => line !== null).join('\n');
  return send({ to: ADMISSIONS_INBOX, subject: `[CRI payment problem] applicants cannot reach payment`, text, replyTo: validEmail(input.accountEmail) ? input.accountEmail! : undefined });
}

/** "$50.00 USD": cents and an explicit currency code, as a US receipt prints an amount. */
function receiptMoney(amount: number, currency: string) {
  try { return `${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)} ${currency}`; } catch { return `${amount} ${currency}`; }
}

function paymentReceiptLines(payment: NonNullable<PaidApplication['payment']>, programTitle: string, applicant: string): string[] {
  const paidAt = payment.approvedAt ? new Date(payment.approvedAt) : new Date();
  const date = Number.isNaN(paidAt.getTime()) ? null : `${paidAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })} (UTC)`;
  // Toss names the method in Korean ("카드", "해외간편결제").
  const method = !payment.method ? null : /카드|card/i.test(payment.method) ? 'Card' : /간편|paypal/i.test(payment.method) ? 'PayPal' : 'Online payment';
  return [
    `RECEIPT`,
    `Amount paid: ${receiptMoney(payment.amount, payment.currency)}`,
    date ? `Date paid: ${date}` : null,
    method ? `Paid with: ${method}` : null,
    `Order number: ${payment.orderId}`,
    `For: Application fee, ${programTitle}${applicant ? ` (applicant: ${applicant})` : ''}`,
    `Billed by: ${COMPANY.legalName} (${COMPANY.brand}), Seoul, Republic of Korea`,
    payment.receiptUrl ? `Card receipt from our payment processor, Toss Payments: ${payment.receiptUrl}` : null,
  ].filter((line): line is string => line !== null);
}

/** Confirmation to the family: account email plus the student / guardian addresses given in the form. */
export async function sendApplicationConfirmation(app: PaidApplication) {
  const f = app.form;
  const recipients = Array.from(new Set([app.accountEmail, str(f.studentEmail), str(f.parentEmail)].filter(validEmail)));
  const student = str(f.studentFirstName) || 'there';
  const applicant = `${str(f.studentFirstName)} ${str(f.studentLastName)}`.trim();
  // The paid version doubles as the receipt a US payer keeps: amount with currency, date, order number, what was
  // bought, who billed it and where the policies are. Plain text, no marketing.
  const paid = app.payment ? paymentReceiptLines(app.payment, app.programTitle, applicant) : null;
  const text = [
    `Hi ${student},`,
    ``,
    paid ? `Your payment was received and your application to "${app.programTitle}" has been submitted to CRI admissions.` : `Thank you. Your application to "${app.programTitle}" has been received.`,
    ...(paid ? [``, ...paid, ...(app.feeCode ? [`Referral code applied: ${app.feeCode}`] : [])] : []),
    ``,
    `What happens next:`,
    `1. Admissions reviews the application for research readiness and fit (usually within about a week).`,
    `2. We may invite you to a short admissions interview.`,
    `3. You receive a decision by email and in your CRI portal.`,
    ``,
    paid ? `Tuition is separate and is not included in this payment. It is due only after admission.` : app.feeCode ? `The application fee was waived with your referral code (${app.feeCode}). Program tuition is only due after admission.` : `There was no application fee. Program tuition is only due after admission.`,
    ``,
    `Track your application: ${SITE_URL}/dashboard/applications`,
    ...(paid ? [`Refunds follow our Refund Policy: ${SITE_URL}/refunds`, `Terms of Service: ${SITE_URL}/terms`, ``, `Don't recognize this charge, or have a question? Reply to this email and we'll help. Keep this email as your receipt.`] : [`Questions: reply to this email or write to support@cri.kr.`]),
    ``,
    `CRI Admissions`,
    ...(paid ? [`${COMPANY.legalName} · ${COMPANY.address.en} ${COMPANY.postalCode} · ${COMPANY.email} · ${COMPANY.phone}`] : []),
  ].join('\n');
  const subject = paid ? `Your CRI application and receipt: ${receiptMoney(app.payment!.amount, app.payment!.currency)} · ${app.programTitle}` : `We received your application · ${app.programTitle}`;
  return send({ to: recipients, subject: `${app.test ? TEST_PREFIX : ''}${subject}`, text, replyTo: ADMISSIONS_INBOX });
}

/** A student account was created (or linked) by admissions for an application submitted by a guardian. */
export async function sendStudentAccountWelcome(input: { to: string; studentName: string; programTitle?: string | null; guardianName?: string | null; created: boolean }) {
  const text = [
    `Hi ${input.studentName || 'there'},`,
    ``,
    input.created
      ? `CRI Admissions created a student account for you${input.programTitle ? ` for "${input.programTitle}"` : ''}${input.guardianName ? `, linked to ${input.guardianName}'s account` : ''}.`
      : `Your CRI student account has been linked to ${input.guardianName ? `${input.guardianName}'s` : 'a guardian'} account${input.programTitle ? ` for "${input.programTitle}"` : ''}.`,
    ``,
    input.created ? `To sign in for the first time, open ${SITE_URL}/auth/recovery, enter this email address and set your password. Then sign in at ${SITE_URL}/auth/login.` : `Sign in at ${SITE_URL}/auth/login to see your programs, assignments and feedback.`,
    ``,
    `Your guardian can follow your program progress from their own portal. Questions: reply to this email or write to support@cri.kr.`,
    ``,
    `CRI Admissions`,
  ].join('\n');
  return send({ to: input.to, subject: input.created ? 'Your CRI student account' : 'Your CRI account was linked to a guardian', text, replyTo: ADMISSIONS_INBOX });
}

const WEBINAR_WHEN = { ko: '10월 31일(토) 오전 10시 (한국 시간)', en: 'Saturday 31 October, 10:00 AM (Korea time)' };

/** Webinar sign-up → admissions inbox. */
export async function notifyWebinarRegistration(input: { id: string; name: string; role: string; phone?: string; email?: string; kakaoId?: string; question?: string; locale: string }) {
  const lines = [
    `New webinar sign-up (${WEBINAR_WHEN.en}).`,
    ``,
    `Name: ${input.name} · ${input.role.toLowerCase()}`,
    `Phone: ${input.phone || '-'}`,
    `Email: ${input.email || '-'}`,
    `KakaoTalk: ${input.kakaoId || '-'}`,
    input.question ? `Question: ${input.question}` : null,
    `Language: ${input.locale}`,
    ``,
    `All sign-ups: ${SITE_URL}/dashboard/webinar`,
  ].filter((line): line is string => line !== null);
  return send({ to: ADMISSIONS_INBOX, subject: `[CRI webinar] ${input.name}`, text: lines.join('\n'), replyTo: validEmail(input.email) ? input.email : undefined });
}

/** Confirmation to the registrant, in their language. The join link is sent separately the day before. */
export async function sendWebinarConfirmation(input: { to: string; locale: string }) {
  // Fixed wording only: nothing a visitor typed is relayed to an address they chose.
  const ko = input.locale === 'ko';
  const text = ko
    ? [`안녕하세요, CRI 온라인 설명회 신청이 접수되었습니다.`, ``, `일시: ${WEBINAR_WHEN.ko}`, `방식: 온라인(Zoom). 참여 링크는 전날 이메일과 카카오톡으로 보내드립니다.`, ``, `프로그램 소개: ${SITE_URL}/ko/research`, `문의: support@cri.kr`].join('\n')
    : [`Hello, your seat for the CRI online info session is confirmed.`, ``, `When: ${WEBINAR_WHEN.en}`, `Where: online (Zoom). The join link is sent to you the day before.`, ``, `Programs: ${SITE_URL}/research`, `Questions: support@cri.kr`].join('\n');
  return send({ to: input.to, subject: ko ? `CRI 온라인 설명회 신청 확인 · ${WEBINAR_WHEN.ko}` : `Your CRI info session seat · ${WEBINAR_WHEN.en}`, text, replyTo: ADMISSIONS_INBOX });
}
