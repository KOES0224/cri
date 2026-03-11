import Link from "next/link";
import { Users, BookOpen, Settings, LayoutTemplate } from "lucide-react";

export default function AdminDashboard({ name }: { name: string }) {
  return (
    <>
      <div className="mb-8 flex md:flex-row flex-col justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Admin Portal
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage users, applications, and public website content.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Administrator
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Link href="/dashboard/users" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 w-fit mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Manage Users</h3>
          <p className="text-sm text-gray-500 mt-1">View and edit student and parent accounts.</p>
        </Link>
        
        <Link href="/dashboard/programs" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
          <div className="p-3 rounded-xl bg-green-50 text-green-600 w-fit mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Programs</h3>
          <p className="text-sm text-gray-500 mt-1">Create or update research programs.</p>
        </Link>

        <Link href="/dashboard/cms" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 w-fit mb-4">
            <LayoutTemplate className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">CMS</h3>
          <p className="text-sm text-gray-500 mt-1">Edit public website pages and articles.</p>
        </Link>

        <Link href="/dashboard/settings" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
          <div className="p-3 rounded-xl bg-gray-100 text-gray-600 w-fit mb-4">
            <Settings className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Settings</h3>
          <p className="text-sm text-gray-500 mt-1">Configure global portal settings.</p>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
           <h3 className="text-lg font-medium tracking-tight">Recent Activity Log</h3>
        </div>
        <div className="p-8 text-center text-gray-500">
           <p>No recent administrative activity.</p>
        </div>
      </div>
    </>
  );
}
