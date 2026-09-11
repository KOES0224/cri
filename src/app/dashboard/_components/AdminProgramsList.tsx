"use client";

import { useState, useDeferredValue } from "react";
import { PlusCircle, Edit, Trash2, Briefcase, Eye, EyeOff } from "lucide-react";
import dynamic from "next/dynamic";
import ClientPagination from "./ClientPagination";
const ProgramForm = dynamic(() => import("./ProgramForm"), { loading: () => <p role="status" className="p-6 text-sm text-slate-500">Loading program editor…</p> });
import { getAdminProgramForEdit, getAdminProgramProfessors, deleteProgram, updateProgramOrder, toggleProgramPublished } from "@/app/actions/programs";
import { admissionLabel, programKind } from "@/lib/program-policy";
import { useRouter } from "next/navigation";

type Program = {
  id: string;
  title: string;
  description?: string;
  category: string;
  subCategory: string | null;
  tuition: number | null;
  order: number;
  status: string;
  isPublished?: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  professors?: { id: string; name: string }[];
};

export default function AdminProgramsList({ initialPrograms }: { initialPrograms: Program[] }) {
  const router = useRouter();
  const [professors, setProfessors] = useState<Awaited<ReturnType<typeof getAdminProgramProfessors>>>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProgram, setEditingProgram] = useState<NonNullable<Awaited<ReturnType<typeof getAdminProgramForEdit>>> | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const TABS = ["All programs", "Summer programs", "Winter online", "1-on-1 research", "Projects", "Competitions", "Internships", "Other"];
  const getProgramTab = (program: Program) => {
    const kind = programKind(program.category);
    if (kind === "seoul" || kind === "global") return "Summer programs";
    if (kind === "winter") return "Winter online";
    if (kind === "individual") return "1-on-1 research";
    const category = program.category.toLowerCase();
    if (category.includes("project")) return "Projects";
    if (category.includes("competition")) return "Competitions";
    if (category.includes("intern")) return "Internships";
    return "Other";
  };
  const [activeTab, setActiveTab] = useState("All programs");
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.trim().toLowerCase());
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editProgram = async (id: string) => {
    setEditingId(id);
    try {
      const [program, faculty] = await Promise.all([getAdminProgramForEdit(id), getAdminProgramProfessors()]);
      setProfessors(faculty);
      if (!program) throw new Error("Program not found. Refresh the list and try again.");
      setEditingProgram(program);
    } catch { alert("Could not load this program. Please try again."); }
    finally { setEditingId(null); }
  };

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
          {isCreating ? "New program" : "Edit program"}
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

  const filteredPrograms = initialPrograms.filter((p) => (activeTab === "All programs" || getProgramTab(p) === activeTab) && `${p.title} ${p.category}`.toLowerCase().includes(search));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filteredPrograms.length / 25)));
  const visiblePrograms = filteredPrograms.slice((currentPage - 1) * 25, currentPage * 25);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
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
               aria-pressed={activeTab === tab}
               onClick={() => { setActiveTab(tab); setPage(1); }}
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
          disabled={editingId !== null}
          onClick={async () => {
            setEditingId("new");
            try { setProfessors(await getAdminProgramProfessors()); setIsCreating(true); }
            catch { alert("Could not load the program editor. Please retry."); }
            finally { setEditingId(null); }
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          New Program
        </button>
      </div>

      <div className="px-5 py-4 border-b border-slate-100"><label htmlFor="program-search" className="sr-only">Search programs</label><input id="program-search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search program title or category" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">Category</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Public Site</th>
              <th className="px-6 py-4 font-medium w-24">Order</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Start Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPrograms.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No programs found in this tab.
                </td>
              </tr>
            ) : (
              visiblePrograms.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{program.title}</td>
                  <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{program.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      program.status === 'OPEN' ? 'bg-green-100 text-green-800' : 
                      program.status === 'CLOSED' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {admissionLabel(program)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      disabled={togglingId === program.id}
                      onClick={async () => {
                        setTogglingId(program.id);
                        const nextState = program.isPublished === false ? true : false;
                        const res = await toggleProgramPublished(program.id, nextState);
                        if (res.success) {
                          router.refresh();
                        } else {
                          alert(res.error || "Failed to update visibility");
                        }
                        setTogglingId(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        program.isPublished !== false
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                      } ${togglingId === program.id ? "opacity-50 pointer-events-none" : ""}`}
                      title={program.isPublished !== false ? "Visible on public website (Click to Hide)" : "Hidden from public website (Click to Show)"}
                    >
                      {program.isPublished !== false ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      aria-label={`Display order for ${program.title}`}
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
                      disabled={editingId !== null}
                      onClick={() => editProgram(program.id)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title={editingId === program.id ? "Loading editor…" : "Edit program"}
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
      <ClientPagination page={currentPage} total={filteredPrograms.length} onChange={setPage} />
    </div>
  );
}
