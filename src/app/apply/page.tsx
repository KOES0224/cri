import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ApplyClient from "./ApplyClient";

export const dynamic = "force-dynamic";

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ programId?: string }> }) {
  const resolvedParams = await searchParams;
  const programId = resolvedParams.programId;

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/apply?programId=${programId || ""}`)}`);
  }

  if (!programId) {
    redirect("/research");
  }

  const program = await prisma.program.findUnique({
    where: { id: programId },
  });

  if (!program) {
    redirect("/research");
  }

  // Fetch all programs in the same category to get all professors within that group
  const relatedPrograms = await prisma.program.findMany({
    where: { category: program.category },
    include: {
      professors: {
        where: { acceptingMentees: true },
        select: { id: true, name: true, university: true, role: true }
      }
    }
  });

  const uniqueProfessorsMap = new Map();
  relatedPrograms.forEach(p => {
    p.professors.forEach(prof => {
      uniqueProfessorsMap.set(prof.id, prof);
    });
  });

  const programWithProfessors = {
    ...program,
    professors: Array.from(uniqueProfessorsMap.values())
  };
  
  // Check if they already applied to this specific program
  const existing = await prisma.application.findUnique({
    where: {
      userId_programId: {
         userId: session.user.id,
         programId
      }
    }
  });

  if (existing) {
    redirect("/dashboard/applications");
  }

  return <ApplyClient program={programWithProfessors} user={session.user} />;
}
