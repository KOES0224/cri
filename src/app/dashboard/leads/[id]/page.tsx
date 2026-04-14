import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getLeadDetails } from "@/app/actions/crm";
import AdminLayout from "../../_components/AdminLayout";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import LeadTimelineClient from "./LeadTimelineClient";
import LeadDetailsClient from "./LeadDetailsClient";

import LeadHeaderActions from "./LeadHeaderActions";

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
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/leads" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to CRM Pipeline
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            Lead Record: {lead.name}
          </h1>
        </div>
        
        <LeadHeaderActions 
          leadId={lead.id} 
          linkedUser={lead.user} 
          createdBy={lead.createdBy} 
        />
      </div>

      {lead.user && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-blue-900 font-bold flex items-center text-lg">
              <User className="w-5 h-5 mr-2" /> 
              Registered Student Profile
            </h3>
            <p className="text-sm text-blue-700 mt-1.5 max-w-2xl leading-relaxed">
              This lead has registered a user account. To add new timeline notes, view applications, and manage steps, please visit their full Master User Profile. Fragmented logging here is disabled.
            </p>
          </div>
          <Link href={`/dashboard/users/${lead.user.id}`} className="shrink-0 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm">
            View Master Profile
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Original Message */}
        <div className="lg:col-span-1 space-y-6">
          <LeadDetailsClient initialLead={lead} />

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
          <LeadTimelineClient lead={lead} hideInput={!!lead.user} />
        </div>

      </div>
    </AdminLayout>
  );
}
