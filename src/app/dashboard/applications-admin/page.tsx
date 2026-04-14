import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayout from "../_components/AdminLayout";
import { getAdminApplications } from "@/app/actions/adminApplications";
import ApplicationsTable from "./ApplicationsTable";
import { ClipboardCheck } from "lucide-react";

export default async function AdminApplicationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch up to 100 recent applications for the admin view
  const applications = await getAdminApplications(100);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-orange-600 p-1.5 bg-orange-50 rounded-lg" />
          Application Management
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Review student applications, manage progression steps, and document activities.
        </p>
      </div>

      <ApplicationsTable initialApplications={applications} />
    </AdminLayout>
  );
}
