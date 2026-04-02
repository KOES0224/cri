"use client";

import { useState, useRef } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import ProfessorForm from "./ProfessorForm";
import { deleteProfessor } from "@/app/actions/professors";
import { useRouter } from "next/navigation";

type Professor = {
  id: string;
  name: string;
  role: string;
  university: string | null;
  bio: string;
  acceptingMentees: boolean;
  publications: number;
  createdAt: Date;
  programs?: { id: string; title: string }[];
};

export default function AdminProfessorList({ 
  initialProfessors, 
  programs 
}: { 
  initialProfessors: Professor[], 
  programs: { id: string; title: string }[] 
}) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this profile from the directory?")) {
      const result = await deleteProfessor(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    }
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingProfessor(null);
  };

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsImporting(true);
    
    // Using dynamic import of the action to avoid circular deps if any
    const { importProfessors } = await import("@/app/actions/importProfessors");
    
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    const result = await importProfessors(formData);
    
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (result.success) {
      alert(result.message);
      router.refresh();
    } else {
      alert("Import failed: " + result.error);
    }
  };

  if (isCreating || editingProfessor) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {isCreating ? "Add Faculty Member" : "Edit Profile"}
        </h3>
        <ProfessorForm 
          initialData={editingProfessor || undefined} 
          programs={programs}
          onSuccess={closeForm} 
          onCancel={closeForm} 
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-4">
        <h2 className="text-xl font-bold text-gray-900">Manage Faculty</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleImport}
          />
          <button
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
          >
            {isImporting ? "Importing..." : "Bulk Import (Excel)"}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Professor
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">Role</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">University</th>
              <th className="px-6 py-4 font-medium">Accepting Mentees</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialProfessors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No professors in the directory yet. Add your first faculty member!
                </td>
              </tr>
            ) : (
              initialProfessors.map((prof) => (
                <tr key={prof.id} className="hover:bg-green-50/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{prof.name}</td>
                  <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{prof.role}</td>
                  <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">{prof.university || "-"}</td>
                  <td className="px-6 py-4">
                     {prof.acceptingMentees ? (
                       <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                         Yes
                       </span>
                     ) : (
                       <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                         No
                       </span>
                     )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => setEditingProfessor(prof)}
                      className="text-green-600 hover:text-green-900 transition-colors bg-green-50 p-2 rounded-md hover:bg-green-100"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(prof.id)}
                      className="text-red-600 hover:text-red-900 transition-colors bg-red-50 p-2 rounded-md hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 inline" />
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
