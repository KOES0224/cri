import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { admissionState } from "@/lib/program-policy";
import { prisma } from "@/lib/prisma";
import { applicationSchema } from '@/lib/application-validation';
import ApplyClient from "./ApplyClient";

export const dynamic = "force-dynamic";

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ programId?: string }> }) {
  const resolvedParams = await searchParams;
  const programId = resolvedParams.programId;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/apply?programId=${programId || ""}`)}`);
  }

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

  if (!program || admissionState(program) !== "OPEN") {
    redirect("/research");
  }

  if (existing) {
    redirect("/dashboard/applications");
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

  const pending = await prisma.applicationCheckout.findUnique({where: {userId_programId: {userId: session.user.id, programId}}});
  const draft = pending?.status === 'PENDING' ? applicationSchema.safeParse(pending.formData) : null;
  return <ApplyClient program={programWithProfessors} user={session.user} savedDraft={draft?.success ? draft.data : undefined} />;
}
