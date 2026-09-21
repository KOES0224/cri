import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, ArrowLeft, GraduationCap, UserCircle, FileText, Send } from "lucide-react";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PARENT") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10 flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-2 sticky top-24">
          <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group mb-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back to Overview</span>
          </Link>

          <div className="h-px bg-gray-100 w-full mb-4"></div>

          <Link href="/dashboard/applications" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition-colors group">
            <FileText className="h-5 w-5" />
            <span className="font-medium text-sm">Applications</span>
          </Link>

          <Link href="/dashboard/linked" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors group">
            <GraduationCap className="h-5 w-5" />
            <span className="font-medium text-sm">Linked Students</span>
          </Link>

          <Link href="/dashboard/billing" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors group mb-4">
            <CreditCard className="h-5 w-5" />
            <span className="font-medium text-sm">Billing Integrations</span>
          </Link>

          <div className="h-px bg-gray-100 w-full mb-4"></div>

          <Link href="/dashboard/profile" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors group">
            <UserCircle className="h-5 w-5" />
            <span className="font-medium text-sm">My Profile</span>
          </Link>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link href="/research#open-programs" className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors w-full">
              <Send className="h-4 w-4" />
              <span className="font-medium text-sm">Apply for a student</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
