import { absoluteResumeUrl } from './resume-links';
import { COMPANY } from '@/lib/company';
import { Resend } from 'resend';
import { createHash } from 'node:crypto';
import { KAKAO_CHANNEL_ADD_URL, KAKAO_CHANNEL_CHAT_URL } from './webinar';

/**
 * Transactional email for admissions. Every call is best effort: when RESEND_API_KEY or
 * AUTH_EMAIL_FROM is missing, or the provider fails, we log and return { sent: false } so a
 * saved lead or paid application is never rolled back because a notification could not go out.
 */
const ADMISSIONS_INBOX = process.env.ADMISSIONS_NOTIFY_EMAIL || 'support@cri.kr';
const SITE_URL = (process.env.NEXTAUTH_URL || 'https://criglobal.org').replace(/\/$/, '');

type Mail = { to: string | string[]; subject: string; text: string; replyTo?: string; /** Resend drops a repeat with the same key within 24 h. */ idempotencyKey?: string };

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
    }, mail.idempotencyKey ? { idempotencyKey: mail.idempotencyKey } : undefined);
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
export async function notifyPaymentNeedsReview(input: { orderId: string; accountEmail?: string | null; programTitle?: string | null; situation: string }) {
  const text = [
    `An application-fee payment could not be settled automatically and may need a manual check.`,
    ``,
    `Order number: ${input.orderId}`,
    input.accountEmail ? `Account email: ${input.accountEmail}` : null,
    input.programTitle ? `Program: ${input.programTitle}` : null,
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
    `- If it cannot be fixed quickly, remove NEXT_PUBLIC_APPLICATION_FEE_ENABLED in Vercel and redeploy: applications are then free again.`,
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

const WEBINAR_TOPIC = { ko: 'AI 시대, 논문은 통할까', en: 'Does a research paper still count in the AI era?' };
const WEBINAR_WHEN = { ko: '12월 5일(토) 오전 10시 (한국 시간)', en: 'Saturday 5 December, 10:00 AM (Korea time)' };

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
export async function sendWebinarConfirmation(input: {
  to: string; locale: string;
  /** "ask": no Korean mobile yet (phoneLink adds one); "channel": a number was given, add the channel; null: past the cutoff. */
  kakaoNotices?: 'ask' | 'channel' | null;
  phoneLink?: string | null;
}) {
  // Fixed wording only: nothing a visitor typed is relayed to an address they chose.
  const ko = input.locale === 'ko';
  // The add link adds the channel in one step (the channel home needs a second tap).
  const channel = KAKAO_CHANNEL_ADD_URL;
  const kakaoKo = input.kakaoNotices === 'ask' && input.phoneLink
    ? [``, `카카오톡 알림 받기: 전날 저녁과 당일 아침에 참여 링크를 카톡으로 보내드려요. 한국 휴대폰 번호를 남겨 주세요(알림에만 사용): ${input.phoneLink}`, `알림을 받으시려면 CRI 카카오톡 채널도 추가해 두셔야 해요: ${channel}`]
    : input.kakaoNotices === 'channel'
      ? [``, `전날 저녁과 당일 아침에 남겨 주신 번호로 카카오톡 알림을 보내드려요. CRI 카카오톡 채널을 추가해 두셔야 받으실 수 있어요: ${channel}`]
      : [];
  const kakaoEn = input.kakaoNotices === 'ask' && input.phoneLink
    ? [``, `KakaoTalk reminders: add a Korean mobile number to get the join link on KakaoTalk the evening before and on the morning (used for reminders only): ${input.phoneLink}`]
    : input.kakaoNotices === 'channel'
      ? [``, `We also send a KakaoTalk reminder to your number the evening before and on the morning. Add CRI's KakaoTalk channel to receive it: ${channel}`]
      : [];
  const text = ko
    ? [`안녕하세요, CRI 무료 온라인 세미나 신청이 접수되었습니다.`, ``, `주제: ${WEBINAR_TOPIC.ko}`, `일시: ${WEBINAR_WHEN.ko}`, `방식: 온라인(Zoom). 참여 링크는 시작 전에 이 이메일로 보내드립니다.`, ...kakaoKo, ``, `참여 링크를 지금 바로 받으시려면 CRI 카카오톡 채널에 ‘세미나 신청’이라고 보내 주세요: ${KAKAO_CHANNEL_CHAT_URL}`, `프로그램 소개: ${SITE_URL}/ko/research`, `문의: support@cri.kr`].join('\n')
    : [`Hello, your seat for the free CRI online seminar is confirmed.`, ``, `Topic: ${WEBINAR_TOPIC.en}`, `When: ${WEBINAR_WHEN.en}`, `Where: online (Zoom), in Korean. The join link is emailed to you before the session starts.`, ...kakaoEn, ``, `Programs: ${SITE_URL}/research`, `Questions: support@cri.kr`].join('\n');
  return send({ to: input.to, subject: ko ? `CRI 세미나 신청 확인 · ${WEBINAR_WHEN.ko}` : `Your CRI seminar seat · ${WEBINAR_WHEN.en}`, text, replyTo: ADMISSIONS_INBOX });
}

/** Once, to someone who left an email but no phone: add a number to get the KakaoTalk notices. */
export async function sendWebinarPhoneAsk(input: { to: string; locale: string; phoneLink: string; registrationId: string; webinarKey: string }) {
  const ko = input.locale === 'ko';
  const text = ko
    ? [`안녕하세요, CRI입니다. ${WEBINAR_WHEN.ko} 무료 세미나 「${WEBINAR_TOPIC.ko}」를 신청해 주셔서 감사합니다.`, ``, `전날 저녁과 당일 아침에 참여 링크를 카카오톡으로 보내드리려고 해요. 받으시려면 아래에서 한국 휴대폰 번호(010)를 남겨 주세요(알림에만 사용합니다). 해외 번호로는 카카오톡 알림을 보낼 수 없어 이메일로 보내드려요.`, input.phoneLink, ``, `CRI 카카오톡 채널도 추가해 두셔야 받으실 수 있어요: ${KAKAO_CHANNEL_ADD_URL}`, `번호를 남기지 않으셔도 참여 링크는 이메일로 보내드립니다.`, ``, `문의: support@cri.kr`].join('\n')
    : [`Hello from CRI. Thank you for signing up for the free seminar on ${WEBINAR_WHEN.en}.`, ``, `We can send the join link on KakaoTalk the evening before and on the morning. Add a Korean mobile number (010…) here to get it (used for reminders only):`, input.phoneLink, ``, `Then add CRI's KakaoTalk channel: ${KAKAO_CHANNEL_ADD_URL}`, `Without a Korean mobile number you still get the link by email.`, ``, `Questions: support@cri.kr`].join('\n');
  return send({ to: input.to, subject: ko ? `[CRI] 세미나 알림을 카카오톡으로 받으시겠어요?` : `[CRI] Get the seminar reminder on KakaoTalk?`, text, replyTo: ADMISSIONS_INBOX, idempotencyKey: `webinar-${input.webinarKey}-phone-ask-${input.registrationId}` });
}

/**
 * The join link: the evening before ("dayBefore") and on the morning ("soon", 30 minutes before; also any later sign-up).
 * The text names the day and the clock time, never "in 30 minutes", so a late send reads right; within one kind it is
 * the same for the cron run and a late send, so the shared idempotency key (per email address) drops the repeat.
 */
export async function sendWebinarReminder(input: { kind: 'dayBefore' | 'soon'; to: string; locale: string; join: { url: string; passcode: string | null }; webinarKey: string; /** true when sent on the seminar day itself */ sameDay: boolean }) {
  const ko = input.locale === 'ko';
  const to = input.to.trim().toLowerCase();
  const dayKo = input.sameDay ? '오늘' : '내일';
  const dayEn = input.sameDay ? 'Today' : 'Tomorrow';
  const passKo = input.join.passcode ? `암호: ${input.join.passcode}` : null;
  const passEn = input.join.passcode ? `Passcode: ${input.join.passcode}` : null;
  const text = ko
    ? [`${dayKo} ${WEBINAR_WHEN.ko}, CRI 무료 세미나 「${WEBINAR_TOPIC.ko}」가 열립니다.`, ``, `참여 링크: ${input.join.url}`, passKo, ``, `시작 5분 전에 들어와 주세요. 마이크는 꺼 두시고, 질문은 채팅창에 남겨 주세요.`, `문의: support@cri.kr`].filter((l): l is string => l !== null).join('\n')
    : [`${dayEn}, ${WEBINAR_WHEN.en}: the free CRI seminar "${WEBINAR_TOPIC.en}" (in Korean).`, ``, `Join: ${input.join.url}`, passEn, ``, `Please join five minutes early, keep your microphone off and ask questions in the chat.`, `Questions: support@cri.kr`].filter((l): l is string => l !== null).join('\n');
  const subject = ko ? `[CRI] ${dayKo} 오전 10시 세미나 참여 링크` : `[CRI] ${dayEn}'s seminar: your join link`;
  const key = createHash('sha256').update(to).digest('hex').slice(0, 24);
  return send({ to, subject, text, replyTo: ADMISSIONS_INBOX, idempotencyKey: `webinar-${input.webinarKey}-${input.kind}-${key}` });
}

/** KakaoTalk chatbot did not answer a turn itself and pointed the customer to the office phone: the recent turns, so admissions knows what a caller is about. */
export async function notifyKakaoHandoff(input: { userKey: string; reason: string; turns: Array<{ role: string; text: string; at: Date }> }) {
  const lines = [
    `The KakaoTalk channel bot did not answer this one itself (${input.reason}).`,
    `Nobody can reply in the KakaoTalk chat (the channel's 1:1 chat is off): the bot points customers to ${COMPANY.phoneDomestic} when a person is needed, so this is what the caller may be calling about.`,
    ``,
    ...input.turns.flatMap(t => [`[${t.at.toISOString().slice(0, 16).replace('T', ' ')} UTC] ${t.role === 'user' ? 'Customer' : 'Bot'}:`, t.text, ``]),
    `Kakao user key: ${input.userKey}`,
    `Bot conversations: ${SITE_URL}/dashboard/kakao`,
  ];
  return send({ to: process.env.KAKAO_HANDOFF_EMAIL || ADMISSIONS_INBOX, subject: `[CRI KakaoTalk] ${input.reason}`, text: lines.join('\n') });
}

/** A payment link was paid: admissions gets the student, amount and order number (rules in src/lib/payment-links.ts). */
export async function notifyPaymentLinkPaid(input: { studentName: string; amount: number; orderId: string; method?: string | null; receiptUrl?: string | null }) {
  const text = [
    `A payment link has been paid.`,
    ``,
    `Student: ${input.studentName}`,
    `Amount: ${input.amount.toLocaleString('ko-KR')} KRW`,
    input.method ? `Method: ${input.method}` : null,
    `Order number: ${input.orderId}`,
    input.receiptUrl ? `Receipt: ${input.receiptUrl}` : null,
    ``,
    `All links: ${SITE_URL}/dashboard/payment-links`,
  ].filter((line): line is string => line !== null).join('\n');
  return send({ to: ADMISSIONS_INBOX, subject: `[CRI payment link] ${input.studentName} · ${input.amount.toLocaleString('ko-KR')} KRW paid`, text });
}

/** A payment-link payment could not be settled automatically: the link stays locked until someone checks Toss. */
export async function notifyPaymentLinkCheck(input: { studentName: string; orderId: string; situation: string }) {
  const text = [
    `A payment-link payment could not be settled automatically and needs a manual check.`,
    ``,
    `Student: ${input.studentName}`,
    `Order number: ${input.orderId}`,
    `What happened: ${input.situation}`,
    ``,
    `What to do: look the order number up in the Toss Payments admin (결제조회).`,
    `- Approved there: open the payment link once; it records the payment by itself.`,
    `- Failed or expired there: the link unlocks by itself the next time it is opened.`,
    ``,
    `All links: ${SITE_URL}/dashboard/payment-links`,
  ].join('\n');
  return send({ to: ADMISSIONS_INBOX, subject: `[CRI payment check] ${input.orderId}`, text });
}
