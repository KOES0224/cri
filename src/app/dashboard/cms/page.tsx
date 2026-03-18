import AdminLayout from "../_components/AdminLayout";
import { LayoutTemplate, Edit3, Image as ImageIcon, FileText } from "lucide-react";
import Link from "next/link";

export default function AdminCMSPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          Content Management
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Edit public website pages, update professor profiles, and publish articles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Edit Landing Page */}
         <Link href="/" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors group">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 w-fit mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <LayoutTemplate className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Landing Page</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Update hero text, philosophy section, and banners.</p>
            <span className="text-sm font-medium text-blue-600 flex items-center">Edit Page <Edit3 className="w-3 h-3 ml-1" /></span>
         </Link>

         {/* Edit Blog / News */}
         <Link href="/dashboard/cms/blog" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-300 transition-colors group">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 w-fit mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">News & Articles</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Publish or edit CRI announcements and news.</p>
            <span className="text-sm font-medium text-purple-600 flex items-center">Manage Articles <Edit3 className="w-3 h-3 ml-1" /></span>
         </Link>

         {/* Edit Professors */}
         <Link href="/dashboard/cms/professors" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-green-300 transition-colors group">
            <div className="p-3 rounded-xl bg-green-50 text-green-600 w-fit mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Professor Directory</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Add or update researcher and mentor profiles.</p>
            <span className="text-sm font-medium text-green-600 flex items-center">Manage Directory <Edit3 className="w-3 h-3 ml-1" /></span>
         </Link>
      </div>
    </AdminLayout>
  );
}
