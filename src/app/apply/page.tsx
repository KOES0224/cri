import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { admissionState } from "@/lib/program-policy";
import { prisma } from "@/lib/prisma";
import { applicationSchema, applicationDraftSchema } from '@/lib/application-validation';
import { canApply } from "@/lib/applicant";
import ApplyClient from "./ApplyClient";

export const dynamic = "force-dynamic";

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ programId?: string }> }) {
  const resolvedParams = await searchParams;
  const programId = resolvedParams.programId;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // Anonymous visitors see what the application involves and choose student / parent before creating an account.
    redirect(`/apply/start?programId=${encodeURIComponent(programId || "")}`);
  }

  // Students apply for themselves; parents and guardians apply on behalf of a student. Admins do not apply.
  if (!canApply(session.user.role)) redirect("/dashboard");

  if (!programId) {
    redirect("/research");
  }

  // Concurrently fetch program and check for existing application
  const [program, existing] = await Promise.all([
    prisma.program.findUnique({
      where: { id: programId },
      include: {
        professors: {
          where: { acceptingMentees: true },
          select: { id: true, name: true, university: true, role: true }
        }
      }
    }),
    prisma.application.findUnique({
      where: {
        userId_programId: {
          userId: session.user.id,
          programId
        }
      }
    })
  ]);

  if (existing) redirect("/dashboard/applications");

  if (!program || admissionState(program) !== "OPEN") {
    redirect("/research");
  }

  // Fetch all professors within that category group for mentee selection
  const relatedPrograms = await prisma.program.findMany({
    where: { category: program.category, isPublished: true },
    select: {
      professors: {
        where: { acceptingMentees: true },
        select: { id: true, name: true, university: true, role: true }
      }
    }
  });

  const uniqueProfessorsMap = new Map();
  (program.professors || []).forEach(prof => {
    uniqueProfessorsMap.set(prof.id, prof);
  });
  relatedPrograms.forEach(p => {
    p.professors.forEach(prof => {
      uniqueProfessorsMap.set(prof.id, prof);
    });
  });

  const programWithProfessors = {
    ...program,
    professors: Array.from(uniqueProfessorsMap.values())
  };

  const [pending, saved] = await Promise.all([
    prisma.applicationCheckout.findUnique({where: {userId_programId: {userId: session.user.id, programId}}}),
    prisma.applicationDraft.findUnique({where: {userId_programId: {userId: session.user.id, programId}}}),
  ]);
  const checkoutPending = pending?.status === 'PENDING';
  const parsed = checkoutPending ? applicationSchema.safeParse(pending.formData) : applicationDraftSchema.safeParse(saved?.formData);
  const savedDraft = parsed.success ? Object.fromEntries(Object.entries(parsed.data).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) : undefined;
  const document = savedDraft?.resumeUrl ? await prisma.applicationDocument.findFirst({where: {id: savedDraft.resumeUrl.split('/').pop(), userId: session.user.id}}) : null;
  return <ApplyClient program={programWithProfessors} user={session.user} applicantRole={session.user.role} savedDraft={savedDraft} draftVersion={saved?.version} draftStep={saved?.step} draftSavedAt={saved?.updatedAt.toISOString()} checkoutPending={checkoutPending} resumeFilename={document?.filename} paymentAvailable={Boolean(process.env.TOSS_SECRET_KEY && process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY)} />;
}
