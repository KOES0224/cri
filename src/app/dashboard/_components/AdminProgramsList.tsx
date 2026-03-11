"use client";

import { useState } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import ProgramForm from "./ProgramForm";
import { deleteProgram } from "@/app/actions/programs";
import { useRouter } from "next/navigation";

type Program = {
  id: string;
  title: string;
  description: string;
  category: string;
  subCategory: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
};

export default function AdminProgramsList({ initialPrograms }: { initialPrograms: Program[] }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this program?")) {
      const result = await deleteProgram(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    }
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingProgram(null);
  };

  if (isCreating || editingProgram) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {isCreating ? "Create New Program" : "Edit Program"}
        </h3>
        <ProgramForm 
          initialData={editingProgram || undefined} 
          onSuccess={closeForm} 
          onCancel={closeForm} 
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Manage Programs</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          New Program
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">Category</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Start Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialPrograms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No programs found. Create your first one!
                </td>
              </tr>
            ) : (
              initialPrograms.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{program.title}</td>
                  <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{program.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      program.status === 'OPEN' ? 'bg-green-100 text-green-800' : 
                      program.status === 'CLOSED' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {program.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                    {program.startDate ? new Date(program.startDate).toLocaleDateString() : 'TBD'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => setEditingProgram(program)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(program.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
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
