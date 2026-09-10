import { z } from 'zod';
const required = z.string().trim().min(1).max(200);
const essay = (words: number) => z.string().trim().min(1).max(words * 30).refine(value => value.split(/\s+/u).length <= words, `Use at most ${words} words.`);
export const applicationSchema = z.object({
  studentFirstName: required, studentLastName: required,
  studentEmail: z.string().email().max(254), studentPhone: required,
  parentFirstName: required, parentLastName: required, parentEmail: z.string().email().max(254), parentPhone: required,
  school: required, gradYear: required, gender: required, tShirtSize: required, photoConsent: required,
  resumeUrl: z.string().regex(/^\/api\/documents\/[a-z0-9]+$/),
  initialTopicIdeas: z.string().trim().min(1).max(5000), areaOfInterest: required,
  essay: essay(500), shortAnswer: essay(150), firstChoiceProfessor: required,
  secondChoiceProfessor: z.string().max(200), thirdChoiceProfessor: z.string().max(200),
  previousResearch: z.string().max(5000), howLearned: z.string().max(1000),
});
