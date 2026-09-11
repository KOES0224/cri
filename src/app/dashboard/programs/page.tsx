import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProgramInventory } from "@/app/actions/programs";
import AdminProgramsList from "../_components/AdminProgramsList";
import AdminLayout from "../_components/AdminLayout";

export default async function AdminProgramsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const initialPrograms = await getProgramInventory();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          Programs
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage program details, recruitment status and website visibility.
        </p>
      </div>

      <AdminProgramsList initialPrograms={initialPrograms} />
    </AdminLayout>
  );
}
