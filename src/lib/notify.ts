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
  payment: { orderId: string; amount: number; currency: string; receiptUrl?: string | null } | null;
};

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
    `Area of interest: ${str(f.areaOfInterest) || '-'}`,
    `First-choice professor: ${str(f.firstChoiceProfessor) || '-'}`,
    ``,
    app.payment ? `Fee: ${app.payment.amount.toLocaleString()} ${app.payment.currency} · order ${app.payment.orderId}${app.payment.receiptUrl ? ` · receipt ${app.payment.receiptUrl}` : ''}` : `Fee: none (waived)`,
    ``,
    `Review: ${SITE_URL}/dashboard/applications-admin`,
  ].filter((line): line is string => line !== null);
  return send({ to: ADMISSIONS_INBOX, subject: `[CRI application] ${student} · ${app.programTitle}`, text: lines.join('\n'), replyTo: str(f.studentEmail) || str(f.parentEmail) || undefined });
}

/** Confirmation to the family: account email plus the student / guardian addresses given in the form. */
export async function sendApplicationConfirmation(app: PaidApplication) {
  const f = app.form;
  const recipients = Array.from(new Set([app.accountEmail, str(f.studentEmail), str(f.parentEmail)].filter(validEmail)));
  const student = str(f.studentFirstName) || 'there';
  const text = [
    `Hi ${student},`,
    ``,
    app.payment ? `Thank you. Your application to "${app.programTitle}" has been received and the application fee has been confirmed.` : `Thank you. Your application to "${app.programTitle}" has been received.`,
    ``,
    `What happens next:`,
    `1. Admissions reviews the application for research readiness and fit (usually within about a week).`,
    `2. We may invite you to a short admissions interview.`,
    `3. You receive a decision by email and in your CRI portal.`,
    ``,
    app.payment ? `Payment: ${app.payment.amount.toLocaleString()} ${app.payment.currency} · order ${app.payment.orderId}${app.payment.receiptUrl ? `\nReceipt: ${app.payment.receiptUrl}` : ''}` : `There was no application fee.`,
    `Program tuition is only due after admission.`,
    ``,
    `Track your application: ${SITE_URL}/dashboard/applications`,
    `Questions: reply to this email or write to support@cri.kr.`,
    ``,
    `CRI Admissions`,
  ].join('\n');
  return send({ to: recipients, subject: `We received your application · ${app.programTitle}`, text, replyTo: ADMISSIONS_INBOX });
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
