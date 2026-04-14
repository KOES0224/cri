"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  MessageSquare, 
  Map, 
  User, 
  ChevronDown, 
  CheckCircle2, 
  XSquare, 
  Send
} from "lucide-react";
import { 
  updateApplicationStepStatus, 
  updateApplicationStatus, 
  addUserComment 
} from "@/app/actions/adminApplications";
import { sendMessage } from "@/app/actions/messages";
import { useRouter } from "next/navigation";

export default function ApplicationsTable({ initialApplications }: { initialApplications: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Modals state
  const [activeCommentApp, setActiveCommentApp] = useState<any>(null);
  const [commentText, setCommentText] = useState("");

  const [activeStepsApp, setActiveStepsApp] = useState<any>(null);
  
  const [activeNotifyApp, setActiveNotifyApp] = useState<any>(null);
  const [notifyText, setNotifyText] = useState("");

  const handleStatusChange = async (appId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this application as ${newStatus}?`)) return;
    setLoading(true);
    await updateApplicationStatus(appId, newStatus);
    setLoading(false);
    router.refresh();
  };

  const handleStepChange = async (stepId: string, newStatus: string) => {
    setLoading(true);
    await updateApplicationStepStatus(stepId, newStatus);
    setLoading(false);
    
    // Optimistic local update for the modal
    if (activeStepsApp) {
      const updatedApp = {
        ...activeStepsApp,
        steps: activeStepsApp.steps.map((s: any) => s.id === stepId ? { ...s, status: newStatus } : s)
      };
      setActiveStepsApp(updatedApp);
    }
    router.refresh();
  };

  const submitComment = async () => {
    if (!commentText.trim() || !activeCommentApp) return;
    setLoading(true);
    const result = await addUserComment(activeCommentApp.user.id, commentText);
    setLoading(false);
    
    if (result.success) {
      setActiveCommentApp(null);
      setCommentText("");
      alert("Comment successfully added to User Profile.");
    } else {
      alert(result.error);
    }
  };

  const submitNotification = async () => {
    if (!notifyText.trim() || !activeNotifyApp) return;
    setLoading(true);
    const result = await sendMessage(activeNotifyApp.user.id, notifyText);
    setLoading(false);
    
    if (result.success) {
      setActiveNotifyApp(null);
      setNotifyText("");
      alert("Message sent to student's inbox.");
    } else {
      alert("Failed to send message.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[600px]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
            <tr>
              <th className="px-6 py-4">Applicant</th>
              <th className="px-6 py-4">Program</th>
              <th className="px-6 py-4">Submitted Date</th>
              <th className="px-6 py-4">Application Status</th>
              <th className="px-6 py-4">Timeline Steps</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialApplications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No applications found.
                </td>
              </tr>
            ) : (
              initialApplications.map(app => {
                const currentStepIndex = app.steps?.findIndex((s: any) => s.status === 'IN_PROGRESS' || s.status === 'UPCOMING');
                const currentStep = currentStepIndex !== -1 && app.steps ? app.steps[currentStepIndex] : null;

                return (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center">
                        {app.user.image ? (
                          <img src={app.user.image} className="w-8 h-8 rounded-full mr-3" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 text-xs">
                            {app.user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <Link href={`/dashboard/users/${app.user.id}`} className="hover:text-blue-600 transition-colors">
                          <div className="font-bold">{app.user.name}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{app.user.studentCode || 'No Code'}</div>
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="max-w-[200px] truncate" title={app.program.title}>
                        {app.program.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(app.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        disabled={loading}
                        className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-md border border-transparent hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          app.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 
                          app.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                          'bg-orange-100 text-orange-800'
                        }`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {currentStep ? (
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-blue-600 uppercase">Wait: {currentStep.title}</span>
                          <span className="text-xs text-gray-400">{currentStepIndex + 1} of {app.steps.length} steps</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-green-600 uppercase">All Steps Complete</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                       <button
                         onClick={() => setActiveCommentApp(app)}
                         className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                         title="Add Comment to User Profile"
                       >
                         <MessageSquare className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => setActiveStepsApp(app)}
                         className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100"
                         title="Manage Application Steps"
                       >
                         <Map className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => setActiveNotifyApp(app)}
                         className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                         title="Notify Student"
                       >
                         <Send className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Comment Modal */}
      {activeCommentApp && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-lg w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Add Profile Note
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              This comment will be saved securely to <span className="font-bold text-gray-800">{activeCommentApp.user.name}'s</span> master CRM profile.
            </p>
            
            <textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="e.g. Excellent interview, high potential for research..."
              rows={4}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all mb-6"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setActiveCommentApp(null); setCommentText(""); }}
                className="px-5 py-2.5 font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={submitComment}
                disabled={!commentText.trim() || loading}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all text-sm disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Steps Modal */}
      {activeStepsApp && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-0 max-w-lg w-full animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center sticky top-0">
               <div>
                 <h3 className="text-xl font-bold text-gray-900 flex items-center">
                   <Map className="w-5 h-5 mr-2 text-purple-600" />
                   Timeline Steps
                 </h3>
                 <p className="text-xs text-gray-500 mt-1">Manage processing steps for {activeStepsApp.user.name}.</p>
               </div>
               <button onClick={() => setActiveStepsApp(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full">
                  <XSquare className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
               <div className="space-y-4">
                  {activeStepsApp.steps?.map((step: any, idx: number) => (
                    <div key={step.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 shadow-sm rounded-xl hover:border-purple-200 transition-colors">
                       <div>
                         <h5 className="font-bold text-gray-900 text-sm">{step.title}</h5>
                         <div className="text-xs text-gray-400 mt-1">Step {idx + 1}</div>
                       </div>
                       <select
                          value={step.status}
                          onChange={(e) => handleStepChange(step.id, e.target.value)}
                          disabled={loading}
                          className={`text-xs font-bold uppercase tracking-wider rounded border-0 px-2 py-1 outline-none ring-1 ring-inset ${
                            step.status === 'COMPLETED' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                            step.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                            step.status === 'WAIVED' ? 'bg-gray-100 text-gray-600 ring-gray-500/20' :
                            'bg-gray-50 text-gray-500 ring-gray-400/20'
                          }`}
                       >
                         <option value="UPCOMING">Upcoming</option>
                         <option value="IN_PROGRESS">In Progress</option>
                         <option value="COMPLETED">Completed</option>
                         <option value="WAIVED">Waived</option>
                       </select>
                    </div>
                  ))}
                  
                  {(!activeStepsApp.steps || activeStepsApp.steps.length === 0) && (
                     <div className="text-center py-6 text-gray-500 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                        No steps initialized for this application.
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Notify Student Modal */}
      {activeNotifyApp && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-lg w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
              <Send className="w-5 h-5 mr-2 text-green-600" />
              Notify Student
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Send a direct message to <span className="font-bold text-gray-800">{activeNotifyApp.user.name}'s</span> dashboard inbox.
            </p>
            
            <textarea 
              value={notifyText}
              onChange={(e) => setNotifyText(e.target.value)}
              placeholder="e.g. Please submit your academic transcript via email..."
              rows={4}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all mb-6"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setActiveNotifyApp(null); setNotifyText(""); }}
                className="px-5 py-2.5 font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={submitNotification}
                disabled={!notifyText.trim() || loading}
                className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 shadow-md shadow-green-600/20 transition-all text-sm disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
