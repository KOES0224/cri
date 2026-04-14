"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MessageSquare, Tag, CheckCircle2, User as UserIcon } from "lucide-react";
import { addUserComment } from "@/app/actions/adminApplications";
import { useRouter } from "next/navigation";

export default function UserActivityTimeline({ userId, activities }: { userId: string, activities: any[] }) {
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setLoading(true);
    const result = await addUserComment(userId, commentText);
    setLoading(false);

    if (result.success) {
      setCommentText("");
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 bg-gray-50/30">
        <form onSubmit={handleAddComment}>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Add Master Note
          </label>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Record a call, meeting, or decision..."
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={!commentText.trim() || loading}
              className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Post Note
            </button>
          </div>
        </form>
      </div>

      <div className="p-6 overflow-y-auto max-h-[500px]">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-10 text-sm">No recorded activities inside master profile.</div>
        ) : (
          <div className="space-y-6">
            {activities.map((log: any) => (
              <div key={log.id} className="relative pl-6 border-l-2 border-gray-100 group">
                <span className={`absolute -left-[9px] top-0 bg-white p-1 rounded-full border shadow-sm ${
                  log.source === 'lead' ? 'border-purple-200 text-purple-500' :
                  log.action === 'STATUS_CHANGE' ? 'border-orange-200 text-orange-500' : 
                  'border-blue-200 text-blue-500'
                }`}>
                  {log.source === 'lead' ? (
                    <UserIcon className="w-3 h-3" />
                  ) : log.action === "STATUS_CHANGE" ? (
                    <Tag className="w-3 h-3" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                </span>
                <div className="flex flex-col">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900">{log.adminName || 'Admin'}</span>
                        {log.source === 'lead' && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                            From Lead Profile
                          </span>
                        )}
                     </div>
                     <span className="text-xs font-medium text-gray-400">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                     {log.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
