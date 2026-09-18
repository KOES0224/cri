import { z } from 'zod';
const required = z.string().trim().min(1, 'This field is required.').max(200, 'Use at most 200 characters.');
const optional = z.string().trim().max(200).default('');
const email = z.string().trim().email('Enter a valid email address.').max(254);
const essay = (words: number) => z.string().trim().min(1, 'This response is required.').max(words * 30).refine(value => value.split(/\s+/u).length <= words, `Use at most ${words} words.`);
export const applicationFields = z.object({
  studentFirstName: required, studentLastName: required, studentEmail: email, studentPhone: required,
  studentLevel: z.enum(['SCHOOL', 'UNIVERSITY']).default('SCHOOL'),
  parentFirstName: optional, parentLastName: optional, parentEmail: z.string().trim().max(254).default(''), parentPhone: optional,
  school: required, gradYear: required, gender: optional, tShirtSize: optional,
  photoConsent: z.enum(['Yes', 'No'], { message: 'Choose whether to allow photos and videos.' }),
  resumeUrl: z.string().regex(/^\/api\/documents\/[a-z0-9]+$/, 'Upload a PDF resume.'),
  initialTopicIdeas: z.string().trim().min(1, 'Describe your research interests.').max(5000), areaOfInterest: required,
  essay: essay(500), shortAnswer: essay(150), firstChoiceProfessor: required,
  secondChoiceProfessor: optional, thirdChoiceProfessor: optional,
  previousResearch: z.string().max(5000).default(''), howLearned: z.string().max(1000).default(''),
});
export const applicationSchema = applicationFields.superRefine((data, ctx) => {
  if (data.studentLevel !== 'UNIVERSITY') {
    for (const key of ['parentFirstName', 'parentLastName', 'parentPhone'] as const) {
      if (!data[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'Required for school students.' });
    }
    if (!email.safeParse(data.parentEmail).success) ctx.addIssue({ code: 'custom', path: ['parentEmail'], message: 'Enter a valid parent or guardian email.' });
  } else if (data.parentEmail && !email.safeParse(data.parentEmail).success) {
    ctx.addIssue({ code: 'custom', path: ['parentEmail'], message: 'Enter a valid email address or leave it blank.' });
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
// Drafts may be incomplete; unknown fields and unbounded payloads are rejected.
export const applicationDraftSchema = z.object(Object.fromEntries(Object.keys(applicationFields.shape).map(key => [key, z.string().max(['essay','shortAnswer','initialTopicIdeas','previousResearch'].includes(key) ? 20000 : 1000).optional()]))).strict();
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
