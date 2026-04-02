"use client";

import { useState } from "react";
import { PlusCircle, Edit, Trash2, Briefcase } from "lucide-react";
import ProgramForm from "./ProgramForm";
import { deleteProgram, updateProgramOrder } from "@/app/actions/programs";
import { useRouter } from "next/navigation";

type Program = {
  id: string;
  title: string;
  description: string;
  category: string;
  subCategory: string | null;
  tuition: number | null;
  order: number;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  professors?: { id: string; name: string }[];
};

export default function AdminProgramsList({ initialPrograms, professors = [] }: { initialPrograms: Program[], professors?: { id: string; name: string }[] }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const TABS = ["Summer Camp", "Winter Online", "Projects", "Competitions", "Interns", "Archive & Mock"];

  const mockTitles = ["Advanced Cognitive Psychology Research", "Sustainable Urban Design Project", "Global FinTech Internship"];
  
  const getProgramTab = (program: Program) => {
    const title = program.title.toLowerCase();
    const cat = program.category.toLowerCase();
    const sub = program.subCategory?.toLowerCase() || "";

    if (title.includes("mock") || title.includes("test") || mockTitles.includes(program.title)) {
      return "Archive & Mock";
    }

    if (cat === 'summer camp' || cat === 'seoul' || cat === 'camp' || sub.includes('summer') || sub.includes('seoul')) return "Summer Camp";
    if (cat === 'winter online' || cat === 'winter' || sub.includes('winter')) return "Winter Online";
    if (cat.includes('project')) return "Projects";
    if (cat.includes('competition')) return "Competitions";
    if (cat.includes('intern')) return "Interns";
    
    return "Archive & Mock";
  };

  const [activeTab, setActiveTab] = useState<string>("Summer Camp");

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
          professors={professors}
          onSuccess={closeForm} 
          onCancel={closeForm} 
        />
      </div>
    );
  }

  const filteredPrograms = initialPrograms.filter((p) => getProgramTab(p) === activeTab);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] relative">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex-shrink-0">
           <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
             <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
             Programs ({filteredPrograms.length})
           </h3>
           <p className="text-sm text-gray-500 mt-1">Manage and segment available programs.</p>
         </div>
         
         <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto w-full md:w-auto md:max-w-md lg:max-w-2xl">
           {TABS.map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                 activeTab === tab
                   ? "bg-white text-gray-900 shadow"
                   : "text-gray-500 hover:text-gray-700"
               }`}
             >
               {tab}
             </button>
           ))}
         </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shrink-0"
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
              <th className="px-6 py-4 font-medium w-24">Order</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Start Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPrograms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No programs found in this tab.
                </td>
              </tr>
            ) : (
              filteredPrograms.map((program) => (
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
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      defaultValue={program.order} 
                      onBlur={async (e) => {
                        const newVal = parseInt(e.target.value);
                        if (newVal !== program.order && !isNaN(newVal)) {
                          const res = await updateProgramOrder(program.id, newVal);
                          if (res.success) router.refresh();
                        }
                      }}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    />
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
