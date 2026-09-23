import { z } from 'zod';
// Validation messages are stable codes (see applicationErrorMessages); the UI maps them to the visitor's language.
const text = z.string({ message: 'required' });
const required = text.trim().min(1, 'required').max(200, 'maxLength:200');
const optional = z.string().trim().max(200, 'maxLength:200').default('');
const email = text.trim().email('email').max(254, 'maxLength:254');
const essay = (words: number) => text.trim().min(1, 'required').max(words * 30, `words:${words}`).refine(value => value.split(/\s+/u).length <= words, `words:${words}`);
export const applicationFields = z.object({
  studentFirstName: required, studentLastName: required, studentEmail: email, studentPhone: required,
  studentLevel: z.enum(['SCHOOL', 'UNIVERSITY'], { message: 'required' }).default('SCHOOL'),
  parentFirstName: optional, parentLastName: optional, parentEmail: z.string().trim().max(254, 'maxLength:254').default(''), parentPhone: optional,
  school: required, gradYear: required, gender: optional, tShirtSize: optional,
  photoConsent: z.enum(['Yes', 'No'], { message: 'photoConsent' }),
  resumeUrl: z.string({ message: 'pdf' }).regex(/^\/api\/documents\/[a-z0-9]+$/, 'pdf'),
  initialTopicIdeas: z.string({ message: 'topicRequired' }).trim().min(1, 'topicRequired').max(5000, 'maxLength:5000'), areaOfInterest: required,
  essay: essay(500), shortAnswer: essay(150), firstChoiceProfessor: required,
  secondChoiceProfessor: optional, thirdChoiceProfessor: optional,
  previousResearch: z.string().max(5000, 'maxLength:5000').default(''), howLearned: z.string().max(1000, 'maxLength:1000').default(''),
});
export const applicationSchema = applicationFields.superRefine((data, ctx) => {
  if (data.studentLevel !== 'UNIVERSITY') {
    for (const key of ['parentFirstName', 'parentLastName', 'parentPhone'] as const) {
      if (!data[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'parentRequired' });
    }
    if (!email.safeParse(data.parentEmail).success) ctx.addIssue({ code: 'custom', path: ['parentEmail'], message: 'parentEmail' });
  } else if (data.parentEmail && !email.safeParse(data.parentEmail).success) {
    ctx.addIssue({ code: 'custom', path: ['parentEmail'], message: 'emailOrBlank' });
  }
});
export type ApplicationInput = z.input<typeof applicationFields>;
export const personalFields = ['studentFirstName','studentLastName','studentEmail','studentPhone','studentLevel','parentFirstName','parentLastName','parentEmail','parentPhone','school','gradYear','gender','tShirtSize','photoConsent'];
export const applicationLabels: Record<string, string> = {
  studentFirstName: 'First name', studentLastName: 'Last name', studentEmail: 'Student email', studentPhone: 'Student phone',
  studentLevel: 'Academic level', parentFirstName: 'Parent / guardian first name', parentLastName: 'Parent / guardian last name', parentEmail: 'Parent / guardian email', parentPhone: 'Parent / guardian phone',
  school: 'School / university', gradYear: 'Expected graduation year', gender: 'Gender (optional)', tShirtSize: 'T-shirt size (optional)', photoConsent: 'Photo / video permission',
  resumeUrl: 'Academic resume (PDF)', initialTopicIdeas: 'Research interests and topic ideas', areaOfInterest: 'Primary area of interest', essay: 'Why are you interested?', shortAnswer: 'Your research goals', firstChoiceProfessor: 'First-choice professor', secondChoiceProfessor: 'Second-choice professor', thirdChoiceProfessor: 'Third-choice professor', previousResearch: 'Past research experience', howLearned: 'How you heard about CRI',
};
/** English text for each validation code; `words:N` and `maxLength:N` carry their limit after the colon. */
export const applicationErrorMessages: Record<string, string | ((limit: number) => string)> = {
  required: 'This field is required.',
  maxLength: (limit: number) => `Use at most ${limit} characters.`,
  email: 'Enter a valid email address.',
  emailOrBlank: 'Enter a valid email address or leave it blank.',
  words: (limit: number) => `Use at most ${limit} words.`,
  parentRequired: 'Required for school students.',
  parentEmail: 'Enter a valid parent or guardian email.',
  pdf: 'Upload a PDF resume.',
  photoConsent: 'Choose whether to allow photos and videos.',
  topicRequired: 'Describe your research interests.',
};
/** Resolves a validation code to its English message; unknown codes are returned unchanged. */
export function applicationErrorMessage(code: string): string {
  const [name, argument] = code.split(':');
  const entry = applicationErrorMessages[name];
  if (typeof entry === 'function') return entry(Number(argument));
  return entry ?? code;
}
// Drafts may be incomplete; unknown fields and unbounded payloads are rejected.
export const applicationDraftSchema = z.object(Object.fromEntries(Object.keys(applicationFields.shape).map(key => [key, z.string().max(['essay','shortAnswer','initialTopicIdeas','previousResearch'].includes(key) ? 20000 : 1000).optional()]))).strict();
/** Returns one validation code per invalid field (see applicationErrorMessages for the English text). */
export function applicationErrors(input: unknown, step?: number): Record<string, string> {
  const parsed = applicationSchema.safeParse(input);
  if (parsed.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0]);
    if (step === 1 && !personalFields.includes(key)) continue;
    if (step === 2 && personalFields.includes(key)) continue;
    errors[key] ??= issue.message;
  }
  return errors;
}
