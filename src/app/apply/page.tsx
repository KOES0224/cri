import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { admissionState } from "@/lib/program-policy";
import { prisma } from "@/lib/prisma";
import { applicationSchema, applicationDraftSchema } from '@/lib/application-validation';
import { canApply } from "@/lib/applicant";
import { applicationFeeFor } from "@/lib/payment-review";
import { REVIEW_DOCUMENT_FILENAME, paymentReviewDraft } from "@/lib/payment-review-draft";
import ApplyClient from "./ApplyClient";
import { programContent } from "@/lib/meta/config";

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
          select: { id: true, name: true, university: true, role: true, relatedMajor: true, potentialTopics: true, acceptingMentees: true }
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
  (program.professors || []).filter(prof => prof.acceptingMentees).forEach(prof => {
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
  // While the fee is switched off, an old unfinished checkout must not lock the form; the free path clears it on submit.
  // The payment-gateway review account sees the paid checkout even while the fee is off for everyone else.
  const { feeEnabled, reviewer } = await applicationFeeFor(session.user.id);
  const checkoutPending = feeEnabled && pending?.status === 'PENDING';
  const parsed = checkoutPending ? applicationSchema.safeParse(pending.formData) : applicationDraftSchema.safeParse(saved?.formData);
  let savedDraft = parsed.success ? Object.fromEntries(Object.entries(parsed.data).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) : undefined;
  let draftStep = saved?.step;
  if (reviewer && !savedDraft) {
    // Reviewers start on the final step with a complete sample application and the account's sample CV.
    const sample = await prisma.applicationDocument.findFirst({ where: { userId: session.user.id, filename: REVIEW_DOCUMENT_FILENAME }, select: { id: true }, orderBy: { createdAt: 'desc' } });
    savedDraft = paymentReviewDraft({ accountEmail: session.user.email || '', professors: programWithProfessors.professors, resumeUrl: sample ? `/api/documents/${sample.id}` : '' });
    draftStep = sample ? 3 : 2;
  }
  const document = savedDraft?.resumeUrl ? await prisma.applicationDocument.findFirst({where: {id: savedDraft.resumeUrl.split('/').pop(), userId: session.user.id}}) : null;
  return <ApplyClient program={programWithProfessors} content={programContent(program)} user={session.user} applicantRole={session.user.role} savedDraft={savedDraft} draftVersion={saved?.version} draftStep={draftStep} draftSavedAt={saved?.updatedAt.toISOString()} checkoutPending={checkoutPending} resumeFilename={document?.filename} paymentAvailable={Boolean(process.env.TOSS_SECRET_KEY && process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY)} feeEnabled={feeEnabled} reviewMode={reviewer} />;
}
