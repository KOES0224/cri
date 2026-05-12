"use client";

import { useState } from "react";
import { formatKST } from "@/lib/formatKST";
import { CheckCircle2, MessageSquare, Tag, Send, Bell, CalendarRange, User as UserIcon } from "lucide-react";
import { addUserComment, scheduleUserNotification, scheduleUserGoogleMeeting } from "@/app/actions/adminApplications";
import { useRouter } from "next/navigation";

export default function UserActivityTimeline({ user, activities }: { user: any, activities: any[] }) {
  const router = useRouter();
  
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
  const [meetingTitle, setMeetingTitle] = useState(`Meeting with ${user.name}`);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setSubmittingNote(true);
    
    const res = await addUserComment(user.id, noteContent);
    if (res.success) {
      setNoteContent("");
      router.refresh();
    } else {
      alert(res.error);
    }
    
    setSubmittingNote(false);
  };
  
  const handleSetAlarm = async () => {
    if (!alarmMessage.trim() || !alarmDate) return;
    setSubmittingAlarm(true);
    
    // Convert YYYY-MM-DD to a standard local Date
    const parsedDate = new Date(alarmDate);
    const localDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
    
    const res = await scheduleUserNotification(user.id, alarmMessage, localDate);
    if (res.success) {
      setAlarmMessage("");
      setAlarmDate("");
      setActiveTab("note");
      router.refresh();
    } else {
      alert(`Error creating alarm: ${res.error}`);
    }
    
    setSubmittingAlarm(false);
  };

  const handleScheduleMeeting = async () => {
    if (!meetingTitle.trim() || !meetingDate || !meetingTime) return;
    setSubmittingMeeting(true);

    const startDateTime = new Date(`${meetingDate}T${meetingTime}`);
    const duration = parseInt(meetingDuration, 10);

    const res = await scheduleUserGoogleMeeting(user.id, meetingTitle, startDateTime, duration);
    
    if (res.success) {
      alert("Meeting scheduled successfully!");
      setActiveTab("note");
      router.refresh();
    } else {
      alert(`Error creating meeting: ${res.error}`);
    }
    setSubmittingMeeting(false);
  };

  return (
    <div className="flex flex-col h-[700px] justify-between">
      
      {/* Timeline Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
        <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-8 pb-4">
          
          {/* Active Alarms Feed */}
          {user.notifications?.filter((n: any) => !n.isRead).length > 0 && (
             <div className="mb-6 space-y-3">
               {user.notifications.filter((n: any) => !n.isRead).map((alarm: any) => (
                 <div key={alarm.id} className="relative pl-8 animate-in fly-in">
                   <span className="absolute -left-[17px] bg-rose-50 p-1.5 rounded-full border border-rose-200 z-10 shadow-sm">
                     <Bell className="w-4 h-4 text-rose-600 animate-pulse" />
                   </span>
                   <div className="flex flex-col bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-sm">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-rose-900 flex items-center">
                         <Bell className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                         Scheduled Alarm: {formatKST(new Date(alarm.dueDate), 'PPP')}
                       </span>
                       <span className="text-xs font-bold text-rose-600 bg-white border border-rose-100 px-2.5 py-1 rounded-full shadow-sm">
                         Pending
                       </span>
                     </div>
                     <span className="text-rose-800 text-sm mt-3 font-medium bg-white/50 p-3 rounded-lg border border-rose-100/50">{alarm.message}</span>
                     <span className="text-xs text-rose-500 mt-3 font-semibold">Scheduled by {alarm.adminName}</span>
                   </div>
                 </div>
               ))}
             </div>
          )}

          {activities.length === 0 && (!user.notifications || user.notifications.length === 0) ? (
            <div className="text-center text-gray-400 py-10 font-medium text-sm">No recorded activities inside master profile.</div>
          ) : (
            activities.map((log: any) => (
              <div key={log.id} className="relative pl-8 group">
                <span className={`absolute -left-[17px] bg-white p-1.5 rounded-full border shadow-sm z-10 transition-transform group-hover:scale-110 ${
                  log.source === 'lead' ? 'border-purple-200 text-purple-500' :
                  log.action === 'STATUS_CHANGE' ? 'border-orange-200 text-orange-500' : 
                  'border-blue-200 text-blue-500'
                }`}>
                  {log.source === 'lead' ? (
                    <UserIcon className="w-4 h-4" />
                  ) : log.action === "STATUS_CHANGE" ? (
                    <Tag className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </span>
                
                <div className="flex flex-col bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group-hover:border-blue-100">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-gray-900">{log.adminName || 'Admin'}</span>
                       {log.source === 'lead' && (
                         <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                           From Lead
                         </span>
                       )}
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{formatKST(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {log.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Composer Footer */}
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
        
        <div className="p-4 bg-white relative z-10 transition-all rounded-b-2xl">
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
                       placeholder="e.g. Follow up on program deposit"
                       className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition-shadow"
                     />
                   </div>
                   <input
                     type="date"
                     value={alarmDate}
                     onChange={(e) => setAlarmDate(e.target.value)}
                     className="w-full md:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium text-gray-700"
                   />
                   <button
                     onClick={handleSetAlarm}
                     disabled={submittingAlarm || !alarmMessage.trim() || !alarmDate}
                     className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center shadow-lg shadow-rose-600/20"
                   >
                     {submittingAlarm ? 'Setting...' : <><Bell className="w-4 h-4 mr-2" /> Set Alarm</>}
                   </button>
                </div>
             </div>
          ) : activeTab === "meeting" ? (
             <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3">
                   <div className="flex-1">
                      <input
                        type="text"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder="Meeting Title"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                      />
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                     <input
                       type="date"
                       value={meetingDate}
                       onChange={(e) => setMeetingDate(e.target.value)}
                       className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-gray-700 w-full sm:w-auto"
                     />
                     <input
                       type="time"
                       value={meetingTime}
                       onChange={(e) => setMeetingTime(e.target.value)}
                       className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-gray-700 w-full sm:w-auto"
                     />
                   </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                   <div className="flex items-center gap-3">
                     <span className="text-sm font-bold text-gray-600">Duration:</span>
                     <select
                        value={meetingDuration}
                        onChange={(e) => setMeetingDuration(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
                     >
                       <option value="15">15 min</option>
                       <option value="30">30 min</option>
                       <option value="45">45 min</option>
                       <option value="60">1 hr</option>
                     </select>
                   </div>
                   <button
                     onClick={handleScheduleMeeting}
                     disabled={submittingMeeting || !meetingTitle.trim() || !meetingDate || !meetingTime}
                     className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center shadow-lg shadow-emerald-600/20"
                   >
                     {submittingMeeting ? 'Creating...' : <><CalendarRange className="w-4 h-4 mr-2" /> Schedule Meeting</>}
                   </button>
                </div>
              </div>
           ) : null}
        </div>
      </div>

    </div>
  );
}
