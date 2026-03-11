import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getPrograms } from "@/app/actions/programs";
import AdminProgramsList from "../_components/AdminProgramsList";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminProgramsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const initialPrograms: any = await getPrograms();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10">
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Program Management
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Create, edit, and manage all academic offerings and summer camps.
        </p>
      </div>

      <AdminProgramsList initialPrograms={initialPrograms} />
    </div>
  );
}
