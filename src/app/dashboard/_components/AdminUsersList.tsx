"use client";

import { useState } from "react";
import { Trash2, UserCog, Mail, Briefcase } from "lucide-react";
import { updateUserRole, deleteUser, updateUserAgency } from "@/app/actions/users";
import { useRouter } from "next/navigation";
import Link from "next/link";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  studentCode: string | null;
  isAgency: boolean;
  agencyName: string | null;
  createdAt: Date;
};

export default function AdminUsersList({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Admin" | "Student" | "Parent" | "Agency">("Student");
  
  // Agency Modal State
  const [agencyModalUser, setAgencyModalUser] = useState<User | null>(null);
  const [agencyNameInput, setAgencyNameInput] = useState("");

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(userId);
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
    setLoading(null);
  };

  const handleDelete = async (userId: string) => {
    if (confirm("Are you sure you want to permanently delete this user? This action cannot be undone and will delete all their applications and messages.")) {
      setLoading(userId);
      const result = await deleteUser(userId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
      setLoading(null);
    }
  };

  const saveAgencyStatus = async (isAgency: boolean) => {
    if (!agencyModalUser) return;
    setLoading(agencyModalUser.id);
    const result = await updateUserAgency(agencyModalUser.id, isAgency, isAgency ? agencyNameInput : null);
    if (result.success) {
      setAgencyModalUser(null);
      setAgencyNameInput("");
      
      // If we remove someone from being an agency while on the Agency tab, stay on the tab, let UI reactive update
      router.refresh();
    } else {
      alert(result.error);
    }
    setLoading(null);
  };

  const getUserTab = (user: User) => {
    const isMock = user.email.match(/^(student|parent)[1-5]@criglobal\.org$/);
    if (user.role === "ADMIN" || isMock) return "Admin";
    if (user.role === "STUDENT") return "Student";
    if (user.role === "PARENT") {
      return user.isAgency ? "Agency" : "Parent";
    }
    return "Student"; // Fallback
  };

  const filteredUsers = initialUsers.filter((user) => getUserTab(user) === activeTab);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] relative">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
           <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
             <UserCog className="h-5 w-5 mr-2 text-blue-600" />
             User Database ({initialUsers.length})
           </h3>
           <p className="text-sm text-gray-500 mt-1">Manage accounts and segment users gracefully.</p>
         </div>
         
         <div className="flex bg-gray-100 p-1 rounded-xl">
           {["Admin", "Student", "Parent", "Agency"].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                 activeTab === tab
                   ? "bg-white text-gray-900 shadow"
                   : "text-gray-500 hover:text-gray-700"
               }`}
             >
               {tab}
             </button>
           ))}
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              {activeTab === "Agency" && <th className="px-6 py-4 font-medium">Agency Profile</th>}
              <th className="px-6 py-4 font-medium hidden md:table-cell">{activeTab === "Student" ? "Student Code" : "Action/Status"}</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Joined</th>
              <th className="px-6 py-4 font-medium text-right">Settings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No {activeTab.toLowerCase()} accounts found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${loading === user.id ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold mr-3 text-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </div>
                      {user.name || "Anonymous"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={loading === user.id}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                        user.role === 'PARENT' ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="PARENT">Parent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  
                  {activeTab === "Agency" && (
                     <td className="px-6 py-4 font-bold text-blue-600">
                       {user.agencyName || "Unknown Agency"}
                     </td>
                  )}

                  <td className="px-6 py-4 hidden md:table-cell">
                    {user.role === "STUDENT" ? (
                      user.studentCode ? (
                        <span className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{user.studentCode}</span>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )
                    ) : user.role === "PARENT" ? (
                      <button 
                        onClick={() => {
                          setAgencyModalUser(user);
                          setAgencyNameInput(user.agencyName || "");
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-lg bg-white shadow-sm transition-all"
                      >
                         {user.isAgency ? "Edit Profile" : "Mark as Agency"}
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {user.leads && user.leads.length > 0 && (
                      <Link
                        href={`/dashboard/leads/${user.leads[0].id}`}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-2 hover:bg-blue-50 rounded-lg flex items-center"
                        title="View CRM Lead Profile"
                      >
                        <UserCog className="w-5 h-5 mr-1" />
                        <span className="text-xs font-bold">CRM</span>
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={loading === user.id}
                      className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 p-2 hover:bg-red-50 rounded-lg"
                      title="Delete User"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Agency Edit Modal */}
      {agencyModalUser && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-2 border-b border-gray-100 pb-4">
              {agencyModalUser.isAgency ? "Edit Agency Profile" : "Convert to Agency"}
            </h3>
            <p className="text-gray-500 text-sm mb-6 mt-4 leading-relaxed">
              You are modifying <span className="font-bold text-gray-700">{agencyModalUser.email}</span>. By marking this parent account as an agency, they will simply be organized under the robust Agency database tab.
            </p>
            
            <label className="block text-sm font-bold text-gray-700 mb-2">Internal Agency Name</label>
            <input 
              type="text" 
              value={agencyNameInput} 
              onChange={(e) => setAgencyNameInput(e.target.value)} 
              placeholder="e.g. Apex Admissions"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all mb-8" 
            />
            
            <div className="flex gap-3 justify-end items-center">
              <button 
                onClick={() => setAgencyModalUser(null)} 
                className="px-5 py-2.5 font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              {agencyModalUser.isAgency && (
                <button 
                  onClick={() => saveAgencyStatus(false)} 
                  className="px-5 py-2.5 font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-sm"
                >
                  Remove Agency
                </button>
              )}
              <button 
                onClick={() => saveAgencyStatus(true)} 
                disabled={!agencyNameInput.trim()}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all text-sm disabled:opacity-50 hover:scale-105"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
