import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLeads } from "@/app/actions/crm";
import AdminLayout from "../_components/AdminLayout";
import Link from "next/link";
import { format } from "date-fns";
import { PhoneCall, Search, MoreHorizontal, User } from "lucide-react";

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const leads = await getLeads();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-blue-100 text-blue-800 border-blue-200";
      case "CONTACTED": return "bg-purple-100 text-purple-800 border-purple-200";
      case "MET": return "bg-amber-100 text-amber-800 border-amber-200";
      case "ENROLLED": return "bg-green-100 text-green-800 border-green-200";
      case "WAITLISTED": return "bg-gray-100 text-gray-800 border-gray-200";
      case "REJECTED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <PhoneCall className="h-8 w-8 text-rose-600 p-1.5 bg-rose-50 rounded-lg" />
            Sales CRM
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Track potential customers, manage inquiries, and view interaction history.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prospect</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {leads.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap border-l-4 border-transparent hover:border-blue-500">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {lead.user?.image ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={lead.user.image} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{lead.name}</div>
                        {lead.userId ? (
                          <div className="text-xs text-blue-600 flex items-center mt-0.5 font-medium">
                            <User className="w-3 h-3 mr-1" /> Registered User
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 mt-0.5">Manual Entry</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.email || "-"}</div>
                    <div className="text-xs text-gray-500 mt-1">{lead.phone || "No phone provided"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/dashboard/leads/${lead.id}`} className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm">
                      View full details
                    </Link>
                  </td>
                </tr>
              ))}
              
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No leads found. When users submit the Contact form, they will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
