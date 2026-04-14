"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Link as LinkIcon, UserCheck } from "lucide-react";
import { deleteLead, manuallyLinkLeadToUser } from "@/app/actions/crm";
import Link from "next/link";

export default function LeadHeaderActions({ leadId, linkedUser, createdBy }: { leadId: string, linkedUser: any, createdBy: string | null }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Link User State
  const [isLinking, setIsLinking] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this lead? This string of history cannot be recovered.")) return;
    
    setIsDeleting(true);
    const res = await deleteLead(leadId);
    if (res.success) {
      router.push("/dashboard/leads");
    } else {
      alert("Failed to delete lead: " + res.error);
      setIsDeleting(false);
    }
  };

  const handleLinkUser = async () => {
    if (!linkInput.trim()) return;
    setIsSubmittingLink(true);
    setLinkError("");

    const res = await manuallyLinkLeadToUser(leadId, linkInput);
    if (res.success) {
      setIsLinking(false);
      setLinkInput("");
    } else {
      setLinkError(res.error || "Failed to link user.");
    }
    setIsSubmittingLink(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {createdBy && (
         <span className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full border border-gray-200">
           Created by Admin: {createdBy.slice(0, 8)}...
         </span>
      )}

      {linkedUser ? (
        <Link href={`/dashboard/users/${linkedUser.id}`} className="inline-flex items-center text-sm font-bold bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm">
          <UserCheck className="w-4 h-4 mr-2" />
          Registered Account Linked
        </Link>
      ) : (
        <div className="relative">
          <button 
            onClick={() => setIsLinking(!isLinking)}
            className="inline-flex items-center text-sm font-bold bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Link Registered Account
          </button>

          {isLinking && (
            <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
               <h4 className="text-sm font-bold text-gray-900 mb-2">Connect to Account</h4>
               <p className="text-xs text-gray-500 mb-3">Enter the user's registered Email or Student Code.</p>
               <input 
                 autoFocus
                 type="text" 
                 placeholder="Email or Code" 
                 value={linkInput}
                 onChange={e => setLinkInput(e.target.value)}
                 className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-2"
               />
               {linkError && <p className="text-xs text-red-600 font-bold mb-2">{linkError}</p>}
               <div className="flex gap-2">
                 <button 
                   onClick={() => setIsLinking(false)}
                   className="flex-1 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleLinkUser}
                   disabled={isSubmittingLink || !linkInput.trim()}
                   className="flex-1 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                 >
                   {isSubmittingLink ? 'Linking...' : 'Connect'}
                 </button>
               </div>
            </div>
          )}
        </div>
      )}

      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center text-sm font-bold bg-white text-rose-600 px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-sm disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {isDeleting ? 'Deleting...' : 'Delete Lead'}
      </button>
    </div>
  );
}
