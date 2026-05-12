import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLeads } from "@/app/actions/crm";
import AdminLayout from "../_components/AdminLayout";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { PhoneCall, Search, User, MessageSquare, Tag } from "lucide-react";
import CreateLeadModal from "./CreateLeadModal";

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const leads = await getLeads();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":       return "bg-blue-100 text-blue-800 border-blue-200";
      case "CONTACTED": return "bg-purple-100 text-purple-800 border-purple-200";
      case "MET":       return "bg-amber-100 text-amber-800 border-amber-200";
      case "ENROLLED":  return "bg-green-100 text-green-800 border-green-200";
      case "WAITLISTED":return "bg-gray-100 text-gray-800 border-gray-200";
      case "REJECTED":  return "bg-red-100 text-red-800 border-red-200";
      default:          return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "NEW":        return "bg-blue-500";
      case "CONTACTED":  return "bg-purple-500";
      case "MET":        return "bg-amber-500";
      case "ENROLLED":   return "bg-green-500";
      case "WAITLISTED": return "bg-gray-400";
      case "REJECTED":   return "bg-red-500";
      default:           return "bg-gray-400";
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <PhoneCall className="h-8 w-8 text-rose-600 p-1.5 bg-rose-50 rounded-lg" />
            Sales CRM
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} total · Track inquiries and interaction history.
          </p>
        </div>
        <CreateLeadModal />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="ml-auto text-xs text-gray-400 font-medium pr-2">
            Sorted by newest first
          </div>
        </div>

        {/* Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-8 border-r border-gray-100">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[160px] border-r border-gray-100">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[80px] border-r border-gray-100">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[150px] border-r border-gray-100">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[120px] border-r border-gray-100">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[80px] border-r border-gray-100">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[120px] border-r border-gray-100">Institution</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px] border-r border-gray-100">Latest Log</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[90px] border-r border-gray-100">Created</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead: any, index: number) => {
                const latestActivity = lead.activities?.[0] ?? null;
                return (
                  <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors group">
                    {/* Row # */}
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono border-r border-gray-100">
                      {leads.length - index}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 border-r border-gray-100">
                      <div className="flex items-center gap-2.5">
                        {lead.user?.image ? (
                          <img className="h-7 w-7 rounded-full object-cover flex-shrink-0" src={lead.user.image} alt="" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{lead.name}</div>
                          {lead.userId ? (
                            <div className="text-xs text-blue-500 flex items-center gap-0.5 font-medium">
                              <User className="w-2.5 h-2.5" /> Registered
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">Manual</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 border-r border-gray-100">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(lead.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(lead.status)}`} />
                        {lead.status}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 border-r border-gray-100">
                      <span className="text-sm text-gray-700 truncate block max-w-[150px]">{lead.email || <span className="text-gray-300">—</span>}</span>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 border-r border-gray-100">
                      <div className="space-y-0.5">
                        <div className="text-sm text-gray-700">{lead.phone || <span className="text-gray-300">—</span>}</div>
                        {lead.parentPhone && (
                          <div className="text-xs text-gray-400">Parent: {lead.parentPhone}</div>
                        )}
                      </div>
                    </td>

                    {/* Grade */}
                    <td className="px-4 py-3 border-r border-gray-100">
                      <span className="text-sm text-gray-700">{lead.grade || <span className="text-gray-300">—</span>}</span>
                    </td>

                    {/* Institution */}
                    <td className="px-4 py-3 border-r border-gray-100">
                      <span className="text-sm text-gray-700 truncate block max-w-[120px]">{lead.institution || <span className="text-gray-300">—</span>}</span>
                    </td>

                    {/* Latest Log */}
                    <td className="px-4 py-3 border-r border-gray-100">
                      {latestActivity ? (
                        <div className="flex items-start gap-2 min-w-0">
                          <span className={`mt-0.5 flex-shrink-0 ${latestActivity.action === "STATUS_CHANGE" ? "text-purple-400" : "text-blue-400"}`}>
                            {latestActivity.action === "STATUS_CHANGE"
                              ? <Tag className="w-3.5 h-3.5" />
                              : <MessageSquare className="w-3.5 h-3.5" />
                            }
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-700 font-medium truncate max-w-[180px]" title={latestActivity.content ?? ""}>
                              {latestActivity.content || "—"}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDistanceToNow(new Date(latestActivity.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">No activity yet</span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 border-r border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">{format(new Date(lead.createdAt), 'MMM d, yy')}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group-hover:shadow"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {leads.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-gray-400 text-sm">
                    No leads found. Create one with the button above, or they will appear when users submit the Contact form.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-400 font-medium">
          {leads.length} row{leads.length !== 1 ? "s" : ""}
        </div>
      </div>
    </AdminLayout>
  );
}
