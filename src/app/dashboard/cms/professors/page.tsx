import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProfessors } from "@/app/actions/professors";
import AdminLayout from "../../_components/AdminLayout";
import AdminProfessorList from "../../_components/AdminProfessorList";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminProfessorPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const initialProfessors = await getProfessors();

  return (
    <AdminLayout>
      <div className="mb-8">
        <Link href="/dashboard/cms" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to CMS Hub
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          Professor Directory
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage the public directory of mentors and faculty members.
        </p>
      </div>

      <AdminProfessorList initialProfessors={initialProfessors} />
    </AdminLayout>
  );
}
