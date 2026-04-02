"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitApplication } from "@/app/actions/application";
import { BookOpen, Send, User, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ApplyClient({ program, user }: { program: any, user: any }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError("");
     
     const res = await submitApplication(program.id, content);
     
     if (res.error) {
       setError(res.error);
       setLoading(false);
     } else {
       router.push("/dashboard/applications");
     }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
         <Link href={`/research/program/${program.id}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8">
           <ChevronLeft className="w-4 h-4 mr-1" />
           Back to Program Details
         </Link>
         
         <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-6 shadow-sm">
               <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Program Application</h1>
            <p className="text-gray-500 mb-8 font-medium">You are applying for <strong className="text-gray-900">{program.title}</strong></p>

            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center mb-6">
                 <User className="w-10 h-10 text-gray-400 bg-gray-200 rounded-full p-2 mr-4" />
                 <div>
                   <p className="font-bold text-gray-900">{user.name}</p>
                   <p className="text-sm text-gray-500">{user.email}</p>
                 </div>
               </div>

               <div>
                 <label htmlFor="content" className="block text-sm font-bold text-gray-700 mb-2">
                    Statement of Interest / Academic Background
                 </label>
                 <textarea
                   id="content"
                   rows={6}
                   className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-gray-900 bg-gray-50 focus:bg-white resize-none"
                   placeholder="Briefly describe your academic interests and why you want to join this program..."
                   value={content}
                   onChange={(e) => setContent(e.target.value)}
                   required
                 />
               </div>

               {error && (
                 <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
                   {error}
                 </div>
               )}

               <button
                 type="submit"
                 disabled={loading}
                 className="w-full h-14 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
               >
                 {loading ? (
                   "Submitting..."
                 ) : (
                   <>
                     Submit Application <Send className="w-5 h-5 ml-2" />
                   </>
                 )}
               </button>
               
               <p className="text-center text-xs text-gray-400 font-medium mt-4">
                 By submitting, you agree to our admissions terms.
               </p>
            </form>
         </div>
      </div>
    </div>
  );
}
