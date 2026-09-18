'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applicationDraftSchema } from '@/lib/application-validation';
import { admissionState } from '@/lib/program-policy';
export async function saveApplicationDraft(programId: string, input: unknown, step: number, expectedVersion: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'STUDENT') return { success: false as const, error: 'Sign in with your student account to save.' };
  const parsed = applicationDraftSchema.safeParse(input);
  if (!parsed.success || !Number.isInteger(step) || step < 1 || step > 3 || !Number.isInteger(expectedVersion) || expectedVersion < 0) return { success: false as const, error: 'The draft could not be saved. Check your entries.' };
  try {
    const userId = session.user.id;
    const [program, submitted, checkout] = await Promise.all([
      prisma.program.findUnique({ where: { id: programId } }),
      prisma.application.findUnique({ where: { userId_programId: { userId, programId } }, select: { id: true } }),
      prisma.applicationCheckout.findUnique({ where: { userId_programId: { userId, programId } }, select: { id: true } }),
    ]);
    if (!program || admissionState(program) !== 'OPEN' || submitted || checkout) return { success: false as const, error: 'This application is closed, submitted or already in checkout. Reload to see its current state.' };
    if (parsed.data.resumeUrl) {
      if (!/^\/api\/documents\/[a-z0-9]+$/.test(parsed.data.resumeUrl)) return { success: false as const, error: 'Upload a PDF using this application form.' };
      const document = await prisma.applicationDocument.findFirst({ where: { id: parsed.data.resumeUrl.split('/').pop(), userId }, select: { id: true } });
      if (!document) return { success: false as const, error: 'Upload the resume using this student account.' };
    }
    const version = expectedVersion + 1;
    if (expectedVersion === 0) {
      const savedAt = new Date();
      const result = await prisma.applicationDraft.createMany({ data: [{ userId, programId, formData: parsed.data, step, updatedAt: savedAt }], skipDuplicates: true });
      if (result.count !== 1) return { success: false as const, conflict: true, error: 'Another tab created a draft. Copy your recent edits, then reload.' };
      return { success: true as const, version: 1, savedAt: savedAt.toISOString() };
    }
    const savedAt = new Date();
    const result = await prisma.applicationDraft.updateMany({ where: { userId, programId, version: expectedVersion }, data: { formData: parsed.data, step, version, updatedAt: savedAt } });
    if (result.count !== 1) return { success: false as const, conflict: true, error: 'Another tab changed this draft. Copy your recent edits, then reload to continue.' };
    return { success: true as const, version, savedAt: savedAt.toISOString() };
  } catch (error) {
    const conflict = (error as { code?: string }).code === 'P2002';
    return { success: false as const, conflict, error: conflict ? 'Another tab created a draft. Copy your recent edits, then reload.' : 'Draft not saved. Check your connection and retry before leaving.' };
  }
}
