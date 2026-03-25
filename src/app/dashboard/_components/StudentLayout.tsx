import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, MessageSquare, UserCircle, ArrowLeft, Send } from "lucide-react";
import { getGlobalUnreadCount } from "@/app/actions/messages";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const unreadCount = await getGlobalUnreadCount();

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
            <span className="font-medium text-sm">My Applications</span>
          </Link>
          
          <Link href="/dashboard/messages" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors group">
             <div className="flex items-center space-x-3">
               <div className="relative">
                 <MessageSquare className="h-5 w-5" />
                 {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                    </span>
                 )}
               </div>
               <span className="font-medium text-sm">Messages</span>
             </div>
             {unreadCount > 0 && (
               <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                 {unreadCount}
               </span>
             )}
          </Link>

          <Link href="/dashboard/profile" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors group">
            <UserCircle className="h-5 w-5" />
            <span className="font-medium text-sm">Profile</span>
          </Link>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link href="/research" className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors w-full">
              <Send className="h-4 w-4" />
              <span className="font-medium text-sm">Apply Now</span>
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
