"use client";

import { useState } from "react";
import { Trash2, UserCog, Mail } from "lucide-react";
import { updateUserRole, deleteUser } from "@/app/actions/users";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  studentCode: string | null;
  createdAt: Date;
};

export default function AdminUsersList({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
         <div>
           <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
             <UserCog className="h-5 w-5 mr-2 text-blue-600" />
             User Database ({initialUsers.length})
           </h3>
           <p className="text-sm text-gray-500 mt-1">View and edit student and parent accounts in the system.</p>
         </div>
         
         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
            <Mail className="w-4 h-4 mr-2" />
            Invite User
         </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">Student Code</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Joined</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No users found in the database.
                </td>
              </tr>
            ) : (
              initialUsers.map((user) => (
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
                  <td className="px-6 py-4 hidden md:table-cell">
                    {user.studentCode ? (
                      <span className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{user.studentCode}</span>
                    ) : (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
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
    </div>
  );
}
