import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLayout from "../_components/AdminLayout";
import { getAdminApplications } from "@/app/actions/adminApplications";
import ApplicationsTable from "./ApplicationsTable";
import { ClipboardCheck, Table } from "lucide-react";

export default async function AdminApplicationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch up to 100 recent applications for the admin view
  const applications = await getAdminApplications(100);

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-orange-600 p-1.5 bg-orange-50 rounded-lg" />
            Application Management
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Review student applications, manage progression steps, and document activities.
          </p>
        </div>
        <div>
          <Link 
            href="/dashboard/applications-admin/sheet"
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-green-600/20"
          >
            <Table className="w-4 h-4 mr-2" />
            Open Spreadsheet View
          </Link>
        </div>
      </div>

      <ApplicationsTable initialApplications={applications} />
    </AdminLayout>
  );
}
