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
    where: { id: programId }
  });

  if (!program) {
    redirect("/research");
  }
  
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

  return <ApplyClient program={program} user={session.user} />;
}
