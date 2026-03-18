import ParentLayout from "../_components/ParentLayout";
import { GraduationCap, Link2, UserPlus } from "lucide-react";

export default function LinkedStudentsPage() {
  return (
    <ParentLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <div>
             <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
               <GraduationCap className="h-5 w-5 mr-2 text-purple-600" />
               Linked Students
             </h3>
             <p className="text-sm text-gray-500 mt-1">Manage accounts for your children.</p>
           </div>
           
           <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              <Link2 className="h-4 w-4 mr-1.5" />
              Link Account
           </button>
        </div>
        
        <div className="p-8">
           <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
              <UserPlus className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-900 font-medium">No Linked Students</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mb-6">Ask your student for their unique 8-digit Student Code found in their profile settings to link their account here.</p>
           </div>
        </div>
      </div>
    </ParentLayout>
  );
}
