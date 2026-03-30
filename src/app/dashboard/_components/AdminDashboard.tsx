import Link from "next/link";
import { Users, BookOpen, Settings, LayoutTemplate, PhoneCall, Bell, MessageSquare, Tag, CheckCircle2, ArrowRight } from "lucide-react";
import { getActiveNotifications, getRecentLeadActivities } from "@/app/actions/crm";
import { format } from "date-fns";

export default async function AdminDashboard({ name }: { name: string }) {
  const activeAlarms = await getActiveNotifications();
  const recentLogs = await getRecentLeadActivities(10);

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
          <h3 className="text-lg font-bold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-500 mt-1">View and edit student and parent accounts.</p>
        </Link>
        
        <Link href="/dashboard/programs" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
          <div className="p-3 rounded-xl bg-green-50 text-green-600 w-fit mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Program Management</h3>
          <p className="text-sm text-gray-500 mt-1">Create or update research programs.</p>
        </Link>

        <Link href="/dashboard/cms" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 w-fit mb-4">
            <LayoutTemplate className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Content Management</h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* Left Column: Recent Activity Log */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[600px]">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center sticky top-0 z-10">
             <h3 className="text-lg font-bold tracking-tight text-gray-900 flex items-center">
               <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
               Recent CRM Activity
             </h3>
             <Link href="/dashboard/leads" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center bg-blue-50 px-3 py-1.5 rounded-lg">
                View All Leads <ArrowRight className="w-3.5 h-3.5 ml-1" />
             </Link>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
             {recentLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-10 text-sm">No recent activity found.</div>
             ) : (
                <div className="space-y-6">
                  {recentLogs.map((log: any) => (
                    <div key={log.id} className="relative pl-6 border-l-2 border-gray-100">
                      <span className={`absolute -left-[9px] top-0 bg-white p-1 rounded-full border shadow-sm ${log.action === "STATUS_CHANGE" ? 'border-purple-200' : 'border-blue-200'}`}>
                        {log.action === "STATUS_CHANGE" ? (
                          <Tag className="w-3 h-3 text-purple-500" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        )}
                      </span>
                      <div className="flex flex-col">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-900">{log.adminName}</span>
                              <span className="text-xs text-gray-400">on</span>
                              <Link href={`/dashboard/leads/${log.leadId}`} className="text-xs font-bold text-blue-600 hover:underline">
                                {log.lead.name}
                              </Link>
                           </div>
                           <span className="text-xs font-medium text-gray-400">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
                        </div>
                        <p className={`mt-1.5 text-sm ${log.action === 'STATUS_CHANGE' ? 'font-bold text-purple-700' : 'text-gray-600'} leading-relaxed`}>
                           {log.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </div>

        {/* Right Column: Scheduled Alarms */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[600px]">
          <div className="px-6 py-5 border-b border-rose-100 bg-rose-50/50 flex justify-between items-center sticky top-0 z-10">
             <h3 className="text-lg font-bold tracking-tight text-rose-900 flex items-center">
               <Bell className="w-5 h-5 mr-2 text-rose-600" />
               Scheduled Alarms
             </h3>
             <span className="text-xs font-black bg-rose-200 text-rose-800 px-2.5 py-1 rounded-full shadow-sm">
                {activeAlarms.length} Active
             </span>
          </div>
          <div className="p-6 overflow-y-auto flex-1 bg-rose-50/10">
             {activeAlarms.length === 0 ? (
                <div className="text-center text-gray-500 py-10 text-sm">You have no upcoming alarms.</div>
             ) : (
                <div className="space-y-4">
                  {activeAlarms.map((alarm: any) => (
                    <Link href={`/dashboard/leads/${alarm.leadId}`} key={alarm.id} className="block group">
                      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-rose-300 transition-all">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-sm font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
                             {alarm.lead.name}
                           </span>
                           <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 flex items-center">
                             Due {format(new Date(alarm.dueDate), 'MMM d')}
                           </span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-3">{alarm.message}</p>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                           <span>Set by {alarm.adminName}</span>
                           <span className="text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                             View Lead →
                           </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
             )}
          </div>
        </div>

      </div>
    </>
  );
}
