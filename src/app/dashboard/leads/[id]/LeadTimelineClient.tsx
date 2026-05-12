"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, MessageSquare, Tag, Send, Bell, CalendarRange } from "lucide-react";
import { updateLeadStatus, addLeadNote, scheduleNotification, scheduleGoogleMeeting, deleteNotification } from "@/app/actions/crm";

export default function LeadTimelineClient({ lead, hideInput }: { lead: any, hideInput?: boolean }) {
  const [status, setStatus] = useState(lead.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<"note" | "alarm" | "meeting">("note");
  
  // Note State
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  
  // Alarm State
  const [alarmMessage, setAlarmMessage] = useState("");
  const [alarmDate, setAlarmDate] = useState("");
  const [submittingAlarm, setSubmittingAlarm] = useState(false);

  // Meeting State
  const [meetingTitle, setMeetingTitle] = useState(`Meeting with ${lead.name}`);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

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
  
  const handleSetAlarm = async () => {
    if (!alarmMessage.trim() || !alarmDate) return;
    setSubmittingAlarm(true);
    
    // Convert YYYY-MM-DD to a standard local Date
    const parsedDate = new Date(alarmDate);
    const localDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
    
    const res = await scheduleNotification(lead.id, alarmMessage, localDate);
    if (res.success) {
      setAlarmMessage("");
      setAlarmDate("");
      setActiveTab("note"); // Swap back to note tab
    }
    
    setSubmittingAlarm(false);
  };

  const handleDeleteAlarm = async (id: string) => {
    if (confirm("Are you sure you want to delete this scheduled alarm?")) {
      const res = await deleteNotification(id);
      if (res.success) {
        // Assume UI will rehydrate since it uses server actions / server components wrapping it
        // Or we could rely on the parent page revalidation
      }
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingTitle.trim() || !meetingDate || !meetingTime) return;
    setSubmittingMeeting(true);

    // Combine date and time
    const startDateTime = new Date(`${meetingDate}T${meetingTime}`);
    const duration = parseInt(meetingDuration, 10);

    const res = await scheduleGoogleMeeting(lead.id, meetingTitle, startDateTime, duration, true);
    
    if (res.success) {
      alert("Meeting scheduled successfully!");
      setActiveTab("note");
    } else {
      alert(`Error creating meeting: ${res.error}`);
    }
    setSubmittingMeeting(false);
  };

  const STATUS_OPTIONS = ["NEW", "CONTACTED", "MET", "WAITLISTED", "ENROLLED", "REJECTED"];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[800px]">
      
      {/* Activity Header & Status Bar */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            CRM Timeline
          </h2>
          
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
          
          {/* Active Alarms Feed */}
          {(() => {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const activeAlarms = lead.notifications?.filter((n: any) => !n.isRead && new Date(n.dueDate) >= startOfToday) || [];
            
            if (activeAlarms.length === 0) return null;
            
            return (
             <div className="mb-6 space-y-3">
               {activeAlarms.map((alarm: any) => (
                 <div key={alarm.id} className="relative pl-8 animate-in fly-in">
                   <span className="absolute -left-[17px] bg-rose-50 p-1.5 rounded-full border border-rose-200 z-10 shadow-sm">
                     <Bell className="w-4 h-4 text-rose-600 animate-pulse" />
                   </span>
                   <div className="flex flex-col bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-sm">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-rose-900 flex items-center">
                         <Bell className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                         Scheduled Alarm: {format(new Date(alarm.dueDate), 'PPP')}
                       </span>
                       <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-rose-600 bg-white border border-rose-100 px-2.5 py-1 rounded-full shadow-sm">
                           Pending
                         </span>
                         <button onClick={() => handleDeleteAlarm(alarm.id)} className="text-gray-400 hover:text-red-600 transition-colors bg-white p-1 rounded-md border border-rose-100 shadow-sm" title="Delete Alarm">
                           ✕
                         </button>
                       </div>
                     </div>
                     <span className="text-rose-800 text-sm mt-3 font-medium bg-white/50 p-3 rounded-lg border border-rose-100/50">{alarm.message}</span>
                     <span className="text-xs text-rose-500 mt-3 font-semibold">Scheduled by {alarm.adminName}</span>
                   </div>
                 </div>
               ))}
             </div>
            );
          })()}
          
          {/* Dynamic Feed — newest first (DB returns desc, no reverse needed) */}
          {lead.activities?.map((activity: any) => (
            <div key={activity.id} className="relative pl-8 animate-in fade-in slide-in-from-bottom-2">
              <span className={`absolute -left-[17px] bg-white p-1.5 rounded-full border-2 shadow-sm ${activity.action === "STATUS_CHANGE" ? 'border-purple-200' : 'border-blue-200'}`}>
                {activity.action === "STATUS_CHANGE" ? (
                  <Tag className="w-4 h-4 text-purple-500" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                )}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{activity.adminName}</span>
                  <span className="text-xs font-semibold text-gray-400">• {format(new Date(activity.createdAt), 'PPpp')}</span>
                </div>
                
                {activity.action === "STATUS_CHANGE" ? (
                  <div className="mt-2 flex items-center text-sm font-bold text-purple-800 bg-purple-50 px-3 py-2 rounded-lg border border-purple-100 self-start shadow-sm">
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

          {/* Lead Genesis — always pinned at the very bottom as the origin entry */}
          <div className="relative pl-8">
            <span className="absolute -left-[17px] bg-white p-1 rounded-full border-2 border-gray-200 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">Lead Genesis</span>
              <span className="text-xs font-semibold text-gray-400 mt-1">{format(new Date(lead.createdAt), 'PPpp')}</span>
              <span className="text-sm font-bold text-gray-500 mt-2 bg-gray-100/80 self-start px-3 py-1.5 rounded-lg border border-gray-200">
                Initial data generated.
              </span>
            </div>
          </div>

        </div>
      </div>

      {!hideInput && (
        <div className="border-t border-gray-200 bg-gray-50/50">
          <div className="flex border-b border-gray-200 px-4 pt-2 gap-2">
           <button 
             onClick={() => setActiveTab("note")}
             className={`px-5 py-3 text-sm font-bold flex items-center transition-all rounded-t-xl ${activeTab === 'note' ? 'bg-white text-blue-600 border border-gray-200 border-b-white' : 'text-gray-500 hover:bg-gray-100 border border-transparent'}`}
             style={{ marginBottom: activeTab === 'note' ? '-1px' : '0' }}
           >
             <MessageSquare className="w-4 h-4 mr-2" /> Call Log / Note
           </button>
           <button 
             onClick={() => setActiveTab("alarm")}
             className={`px-5 py-3 text-sm font-bold flex items-center transition-all rounded-t-xl ${activeTab === 'alarm' ? 'bg-white text-rose-600 border border-gray-200 border-b-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 border border-transparent'}`}
             style={{ marginBottom: activeTab === 'alarm' ? '-1px' : '0' }}
           >
             <Bell className="w-4 h-4 mr-2" /> Notify Me
           </button>
           <button 
             onClick={() => setActiveTab("meeting")}
             className={`px-5 py-3 text-sm font-bold flex items-center transition-all rounded-t-xl ${activeTab === 'meeting' ? 'bg-white text-emerald-600 border border-gray-200 border-b-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 border border-transparent'}`}
             style={{ marginBottom: activeTab === 'meeting' ? '-1px' : '0' }}
           >
             <CalendarRange className="w-4 h-4 mr-2" /> Schedule Meeting
           </button>
        </div>
        
        <div className="p-4 bg-white relative z-10 transition-all">
          {activeTab === "note" ? (
             <div className="flex items-start gap-3">
               <div className="flex-1">
                 <textarea
                   rows={2}
                   value={noteContent}
                   onChange={(e) => setNoteContent(e.target.value)}
                   placeholder="Record a call summary, draft an email reply, or leave an internal note..."
                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium resize-none whitespace-pre-wrap transition-shadow"
                 />
               </div>
               <button
                 onClick={handleAddNote}
                 disabled={submittingNote || !noteContent.trim()}
                 className="px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center shadow-lg shadow-blue-600/20"
               >
                 <Send className="w-4 h-4 mr-2" />
                 Post
               </button>
             </div>
          ) : activeTab === "alarm" ? (
             <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row items-center gap-3">
                   <div className="w-full md:flex-1">
                     <input
                       type="text"
                       value={alarmMessage}
                       onChange={(e) => setAlarmMessage(e.target.value)}
                       placeholder="e.g. Call back regarding summer early decision program..."
                       className="w-full px-4 py-3 bg-rose-50/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition-shadow"
                     />
                   </div>
                   <input
                     type="date"
                     value={alarmDate}
                     min={new Date().toISOString().split('T')[0]}
                     onChange={(e) => setAlarmDate(e.target.value)}
                     className="w-full md:w-auto px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-bold text-gray-700 transition-shadow"
                   />
                </div>
                <div className="flex justify-between items-center mt-2">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                     This will post a log indicating the scheduled alarm
                   </span>
                   <button
                     onClick={handleSetAlarm}
                     disabled={submittingAlarm || !alarmMessage.trim() || !alarmDate}
                     className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center shadow-lg shadow-rose-600/20"
                   >
                     {submittingAlarm ? 'Scheduling...' : <><Bell className="w-4 h-4 mr-2 border border-rose-400/50 rounded bg-rose-500" /> Schedule Alarm</>}
                   </button>
                </div>
             </div>
          ) : (
             <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row items-center gap-3">
                   <div className="w-full md:flex-1">
                     <input
                       type="text"
                       value={meetingTitle}
                       onChange={(e) => setMeetingTitle(e.target.value)}
                       placeholder="Meeting Title"
                       className="w-full px-4 py-3 bg-emerald-50/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-shadow"
                     />
                   </div>
                   <input
                     type="date"
                     value={meetingDate}
                     min={new Date().toISOString().split('T')[0]}
                     onChange={(e) => setMeetingDate(e.target.value)}
                     className="w-full md:w-auto px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-gray-700 transition-shadow"
                   />
                   <input
                     type="time"
                     value={meetingTime}
                     onChange={(e) => setMeetingTime(e.target.value)}
                     className="w-full md:w-auto px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-gray-700 transition-shadow"
                   />
                   <select 
                      value={meetingDuration}
                      onChange={(e) => setMeetingDuration(e.target.value)}
                      className="w-full md:w-auto px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-gray-700 transition-shadow"
                   >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                   </select>
                </div>
                <div className="flex justify-between items-center mt-2">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                     This will add an event to Google Calendar automatically
                   </span>
                   <button
                     onClick={handleScheduleMeeting}
                     disabled={submittingMeeting || !meetingTitle.trim() || !meetingDate || !meetingTime}
                     className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center shadow-lg shadow-emerald-600/20"
                   >
                     {submittingMeeting ? 'Creating...' : <><CalendarRange className="w-4 h-4 mr-2" /> Schedule Meeting</>}
                   </button>
                </div>
             </div>
          )}
        </div>
      </div>
      )}

    </div>
  );
}
