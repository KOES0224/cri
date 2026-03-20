"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, MessageSquare, Tag, Send } from "lucide-react";
import { updateLeadStatus, addLeadNote } from "@/app/actions/crm";

export default function LeadTimelineClient({ lead }: { lead: any }) {
  const [status, setStatus] = useState(lead.status);
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    setUpdatingStatus(true);
    const res = await updateLeadStatus(lead.id, newStatus);
    if (res.success) {
      setStatus(newStatus);
    }
    setUpdatingStatus(false);
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setSubmittingNote(true);
    
    const res = await addLeadNote(lead.id, noteContent);
    if (res.success) {
      setNoteContent("");
    }
    
    setSubmittingNote(false);
  };

  const STATUS_OPTIONS = ["NEW", "CONTACTED", "MET", "WAITLISTED", "ENROLLED", "REJECTED"];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[800px]">
      
      {/* Activity Header & Status Bar */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">CRM Timeline</h2>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm font-bold text-gray-500 ml-2">Pipeline Stage:</span>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className={`text-sm font-bold rounded-lg px-3 py-1.5 border-0 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer
                ${status === "NEW" ? "bg-blue-50 text-blue-700" : ""}
                ${status === "CONTACTED" ? "bg-purple-50 text-purple-700" : ""}
                ${status === "ENROLLED" ? "bg-green-50 text-green-700" : ""}
                ${status === "MET" ? "bg-amber-50 text-amber-700" : ""}
                ${status === "REJECTED" ? "bg-red-50 text-red-700" : ""}
              `}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt} className="bg-white text-gray-900">{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
        <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-8 pb-4">
          
          {/* Base Creation Entry */}
          <div className="relative pl-8">
            <span className="absolute -left-[17px] bg-white p-1 rounded-full border-2 border-gray-200">
              <CheckCircle2 className="w-5 h-5 text-gray-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">Lead Created</span>
              <span className="text-xs text-gray-500 mt-1">{format(new Date(lead.createdAt), 'PPpp')}</span>
              <span className="text-sm text-gray-600 mt-2 bg-gray-100 self-start px-3 py-1.5 rounded-lg border border-gray-200">
                Data recorded successfully.
              </span>
            </div>
          </div>

          {/* Dynamic Feed */}
          {lead.activities?.slice().reverse().map((activity: any) => (
            <div key={activity.id} className="relative pl-8 animate-in fade-in slide-in-from-bottom-2">
              <span className="absolute -left-[17px] bg-white p-1 rounded-full border-2 border-blue-200">
                {activity.action === "STATUS_CHANGE" ? (
                  <Tag className="w-5 h-5 text-blue-500" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-green-500" />
                )}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{activity.adminName}</span>
                  <span className="text-xs text-gray-500">• {format(new Date(activity.createdAt), 'PPpp')}</span>
                </div>
                
                {activity.action === "STATUS_CHANGE" ? (
                  <div className="mt-2 flex items-center text-sm font-medium text-blue-800 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 self-start">
                    {activity.content}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-700 bg-white p-4 rounded-xl shadow-sm border border-gray-200 leading-relaxed font-medium">
                    {activity.content}
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Input Composer Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <textarea
              rows={2}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Record a call summary, draft an email reply, or leave a note..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none whitespace-pre-wrap"
            />
          </div>
          <button
            onClick={handleAddNote}
            disabled={submittingNote || !noteContent.trim()}
            className="px-5 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center shadow-md"
          >
            <Send className="w-4 h-4 mr-2" />
            Post
          </button>
        </div>
      </div>

    </div>
  );
}
