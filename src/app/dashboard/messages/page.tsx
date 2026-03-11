import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6 shrink-0">
        <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-4">Messages</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        
        {/* Contact List */}
        <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Connections</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-gray-50 bg-blue-50/30 cursor-pointer">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                  SC
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Dr. Sarah Chen</p>
                  <p className="text-xs text-blue-600">Research Mentor</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold mr-3">
                  A
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Admissions Office</p>
                  <p className="text-xs text-gray-500">Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-full md:w-2/3 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3 md:hidden">
                SC
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Dr. Sarah Chen</h3>
                <p className="text-xs text-gray-500">1-on-1 Advanced Research Mentor</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
            <div className="text-center">
              <span className="text-xs font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                Today
              </span>
            </div>
            
            <div className="flex items-start max-w-[85%]">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-700 font-bold text-xs mr-3 mt-1">
                SC
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700">
                <p>Welcome to the 1-on-1 Research Program! I've reviewed your initial application regarding cognitive psychology.</p>
                <p className="mt-2">Before our first meeting, please read the methodology guidelines I've uploaded to the portal.</p>
                <span className="text-[10px] text-gray-400 mt-2 block">10:45 AM</span>
              </div>
            </div>

            <div className="flex items-start justify-end max-w-[85%] ml-auto">
              <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm text-sm">
                <p>Thank you, Dr. Chen. I will review the documents tonight and prepare some initial questions.</p>
                <span className="text-[10px] text-blue-200 mt-2 block text-right">11:30 AM</span>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full pr-2 h-12">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="flex-1 bg-transparent px-6 text-sm focus:outline-none placeholder-gray-400"
              />
              <button className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shrink-0">
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
