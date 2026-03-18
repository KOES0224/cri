import { prisma } from "@/lib/prisma";
import ProfessorClientPage from "./ProfessorClientPage";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export default async function ProfessorsPage() {
  const professors = await prisma.professor.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <ProfessorClientPage professors={professors} />
  );
}
