import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getUserDetails } from "@/app/actions/users";
import AdminLayout from "../../_components/AdminLayout";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, Calendar, ClipboardCheck, MessageSquare, History } from "lucide-react";
import { format } from "date-fns";
import UserActivityTimeline from "./UserActivityTimeline";
import UserApplicationsList from "./UserApplicationsList";

export default async function AdminUserProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const user = await getUserDetails(id);

  if (!user) {
    notFound();
  }

  // Combine UserActivity and LeadActivity for a unified timeline
  const combinedActivities = [
    ...(user.activities || []).map(a => ({ ...a, source: 'user' })),
    ...(user.leads?.flatMap(l => l.activities || []) || []).map(a => ({ ...a, source: 'lead' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/users" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User Management
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            User Profile: {user.name}
          </h1>
        </div>
        <div className="flex bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 items-center">
            <User className="h-4 w-4 mr-2 text-blue-600" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Registered Member</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Identity Details
              </h3>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-center">
                {user.image ? (
                  <img src={user.image} className="w-16 h-16 rounded-full mr-4" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mr-4 uppercase">
                    {user.name?.charAt(0) || user.email.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{user.name || "Anonymous"}</h4>
                  <p className="text-sm font-mono text-gray-500 mt-1 flex items-center">
                    {user.studentCode ? (
                      <span className="bg-gray-100 px-2 py-0.5 rounded mr-2">{user.studentCode}</span>
                    ) : (
                      "No Code "
                    )}
                    - {user.role}
                  </p>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-3">
                <div className="flex items-start">
                  <Mail className="w-4 h-4 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>
                    <p className="text-sm text-gray-900 font-medium">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</p>
                    <p className="text-sm text-gray-900 font-medium">{format(new Date(user.createdAt), 'PPP')}</p>
                  </div>
                </div>

                {user.leads && user.leads.length > 0 && (
                  <div className="pt-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Linked Leads</p>
                    <div className="space-y-2">
                       {user.leads.map(lead => (
                         <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="block border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                            <div className="flex justify-between items-center text-sm font-medium text-gray-700 group-hover:text-blue-700">
                               {lead.name}
                               <span className="text-[10px] bg-gray-100 group-hover:bg-blue-100 px-2 py-0.5 rounded-full">{lead.status}</span>
                            </div>
                         </Link>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Applications & Timeline */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 bg-orange-50/30 flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-900 flex items-center">
                 <ClipboardCheck className="w-5 h-5 mr-2 text-orange-600" />
                 Submitted Applications
               </h3>
             </div>
             <UserApplicationsList applications={user.applications} />
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-900 flex items-center">
                 <History className="w-5 h-5 mr-2 text-gray-500" />
                 Interactive Timeline
               </h3>
             </div>
             <UserActivityTimeline user={user} activities={combinedActivities} />
           </div>
        </div>

      </div>
    </AdminLayout>
  );
}
