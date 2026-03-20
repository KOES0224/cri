import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getLeadDetails } from "@/app/actions/crm";
import AdminLayout from "../../_components/AdminLayout";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import LeadTimelineClient from "./LeadTimelineClient";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Next.js 15 requires awaiting params
  const { id } = await params;
  const lead = await getLeadDetails(id);

  if (!lead) {
    notFound();
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <Link href="/dashboard/leads" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to CRM Pipeline
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          Lead Record: {lead.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Original Message */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-rose-500" />
              Contact Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</div>
                <div className="font-medium text-gray-900">{lead.name}</div>
              </div>
              
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</div>
                <div className="font-medium text-gray-900 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                  ) : "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</div>
                <div className="font-medium text-gray-900 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {lead.phone || "No phone provided"}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Link</div>
                {lead.user ? (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                    <User className="w-4 h-4 mr-1.5" /> Registered User
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm italic">Guest / Manual Entry</span>
                )}
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <FileText className="w-24 h-24" />
              </div>
              <h3 className="text-lg font-bold text-orange-900 mb-3 relative z-10 flex items-center">
                Original Inquiry
              </h3>
              <p className="text-orange-800 text-sm leading-relaxed whitespace-pre-wrap relative z-10">
                "{lead.notes}"
              </p>
              <div className="mt-4 pt-4 border-t border-orange-200/50 flex items-center text-xs font-medium text-orange-700/70 relative z-10">
                <Calendar className="w-4 h-4 mr-1.5" />
                Submitted on {format(new Date(lead.createdAt), 'PPP')}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Timeline Client */}
        <div className="lg:col-span-2">
          <LeadTimelineClient lead={lead} />
        </div>

      </div>
    </AdminLayout>
  );
}
