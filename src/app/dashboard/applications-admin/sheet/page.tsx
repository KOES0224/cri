import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminApplicationsExportData } from "@/app/actions/adminApplications";
import SpreadsheetClient from "./SpreadsheetClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SpreadsheetPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const res = await getAdminApplicationsExportData();

  if (!res.success || !res.data) {
    return <div className="p-8 text-center text-red-500 font-bold">Failed to load data.</div>;
  }

  return (
    <div className="bg-gray-50 flex flex-col">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between ">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/applications-admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Applications spreadsheet</h1>
            <p className="text-xs font-medium text-gray-500">Interactive Spreadsheet View</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
         <SpreadsheetClient initialData={res.data} />
      </div>
    </div>
  );
}
