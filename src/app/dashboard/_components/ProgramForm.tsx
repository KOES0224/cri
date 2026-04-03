"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProgram, updateProgram } from "@/app/actions/programs";

type ProgramFormProps = {
  initialData?: {
    id: string;
    title: string;
    description: string;
    category: string;
    subCategory?: string | null;
    status: string;
    tuition?: number | null;
    startDate?: Date | null;
    endDate?: Date | null;
    content?: string | null;
    teachingHoursProf?: string | null;
    teachingHoursTA?: string | null;
    courseSchedule?: string | null;
    professors?: { id: string; name: string }[];
  };
  professors?: { id: string; name: string; role?: string; university?: string; bio?: string; courseTitle?: string; courseDescription?: string; idealStudents?: string; potentialTopics?: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ProgramForm({ initialData, professors = [], onSuccess, onCancel }: ProgramFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentStartDates, setRecentStartDates] = useState<string[]>([]);
  const [recentEndDates, setRecentEndDates] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedStarts = localStorage.getItem("recentStartDates");
    if (storedStarts) setRecentStartDates(JSON.parse(storedStarts));
    
    const storedEnds = localStorage.getItem("recentEndDates");
    if (storedEnds) setRecentEndDates(JSON.parse(storedEnds));
  }, []);

  const saveRecentDate = (key: string, dateStr: string, currentList: string[]) => {
    if (!dateStr) return currentList;
    const updatedList = [dateStr, ...currentList.filter(d => d !== dateStr)].slice(0, 3);
    localStorage.setItem(key, JSON.stringify(updatedList));
    return updatedList;
  };

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "Summer Camp",
    subCategory: initialData?.subCategory || "",
    status: initialData?.status || "OPEN",
    tuition: initialData?.tuition || "",
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
    content: initialData?.content || "",
    teachingHoursProf: initialData?.teachingHoursProf || "",
    teachingHoursTA: initialData?.teachingHoursTA || "",
    courseSchedule: initialData?.courseSchedule || "",
    professorIds: initialData?.professors?.map(p => p.id) || ([] as string[]),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfessorToggle = (profId: string) => {
    setFormData(prev => {
      const isCurrentlyAssigned = prev.professorIds.includes(profId);
      const newProfessorIds = isCurrentlyAssigned
        ? prev.professorIds.filter(id => id !== profId)
        : [...prev.professorIds, profId];

      if (!isCurrentlyAssigned) {
        // We just added a professor. Auto-fill if fields are empty, or prompt to overwrite.
        const prof = professors.find(p => p.id === profId);
        if (prof) {
          const hasExistingData = prev.title || prev.description || prev.content;
          let shouldAutofill = true;
          
          if (hasExistingData) {
            shouldAutofill = window.confirm(
              `Would you like to auto-fill the program details (Title, Description, Syllabus) from ${prof.name}'s profile? This will overwrite your current inputs.`
            );
          }

          if (shouldAutofill) {
            const addedSyllabusParts = [
              prof.courseDescription || prof.bio || "",
              prof.idealStudents ? `\n\n### Ideal Students\n${prof.idealStudents}` : "",
              prof.potentialTopics ? `\n\n### Potential Research Topics\n${prof.potentialTopics}` : ""
            ].filter(Boolean).join("");

            return {
              ...prev,
              professorIds: newProfessorIds,
              title: prof.courseTitle || `Research Program with ${prof.name}`,
              description: prof.bio ? prof.bio.substring(0, 300) + (prof.bio.length > 300 ? "..." : "") : prev.description,
              content: addedSyllabusParts || prev.content
            };
          }
        }
      }

      return {
        ...prev,
        professorIds: newProfessorIds
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subCategory: formData.subCategory,
        tuition: formData.tuition ? Number(formData.tuition) : null,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        content: formData.content || null,
        teachingHoursProf: formData.teachingHoursProf || null,
        teachingHoursTA: formData.teachingHoursTA || null,
        courseSchedule: formData.courseSchedule || null,
        professorIds: formData.professorIds,
      };

      let result;
      if (initialData?.id) {
        result = await updateProgram(initialData.id, payload);
      } else {
        result = await createProgram(payload);
      }

      if (result.success) {
        if (formData.startDate) {
          setRecentStartDates(prev => saveRecentDate("recentStartDates", formData.startDate, prev));
        }
        if (formData.endDate) {
          setRecentEndDates(prev => saveRecentDate("recentEndDates", formData.endDate, prev));
        }
        
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        setError(result.error || "Failed to save program.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      {/* Search Input for Professors - MOVED TO TOP */}
      <div className="pb-4 border-b border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Assign Professor (Select to Auto-fill Details)</label>
        
        {/* Selected Professors Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.professorIds.length === 0 && <span className="text-sm text-gray-400">No professors assigned</span>}
          {formData.professorIds.map(id => {
            const prof = professors.find(p => p.id === id);
            if (!prof) return null;
            return (
              <div key={prof.id} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">
                <span>{prof.name}</span>
                <button type="button" onClick={() => handleProfessorToggle(prof.id)} className="hover:text-blue-500 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors ml-1">
                  &times;
                </button>
              </div>
            );
          })}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, university or field..."
            className="w-full px-4 py-2 border border-blue-200 bg-blue-50/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm placeholder:text-gray-400"
          />
          
          {/* Dropdown Results */}
          {searchQuery.trim().length > 0 && (
             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-hidden">
               {(() => {
                 const query = searchQuery.toLowerCase();
                 const filtered = professors.filter(p => 
                   (p.name && p.name.toLowerCase().includes(query)) ||
                   (p.role && p.role.toLowerCase().includes(query)) ||
                   (p.university && p.university.toLowerCase().includes(query)) ||
                   (p.bio && p.bio.toLowerCase().includes(query)) ||
                   (p.courseTitle && p.courseTitle.toLowerCase().includes(query))
                 );

                 if (filtered.length === 0) {
                   return <div className="p-4 text-sm text-gray-500 text-center">No matching professors found.</div>;
                 }

                 return filtered.map(prof => {
                   const isSelected = formData.professorIds.includes(prof.id);
                   return (
                     <button
                       key={prof.id}
                       type="button"
                       onClick={() => {
                         handleProfessorToggle(prof.id);
                         setSearchQuery(""); // Auto clear string on selection for quick adding
                       }}
                       className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex justify-between items-center transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                     >
                       <div>
                         <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                           {prof.name}
                         </div>
                         <div className="text-xs text-gray-500 font-medium truncate max-w-sm mt-0.5">
                           {[prof.role, prof.university].filter(Boolean).join(" • ")}
                         </div>
                         {prof.courseTitle && <div className="text-xs text-blue-600 mt-0.5 truncate max-w-sm">Course: {prof.courseTitle}</div>}
                       </div>
                       {isSelected ? (
                         <span className="text-blue-600 text-xs font-bold bg-blue-100 px-2 py-1 rounded">Added</span>
                       ) : (
                         <span className="text-gray-400 text-xs font-medium border border-gray-200 px-2 py-1 rounded">Add</span>
                       )}
                     </button>
                   );
                 });
               })()}
             </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Program Title *</label>
        <input
          type="text"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          placeholder="e.g. Advanced AI Research"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          name="description"
          required
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          placeholder="Program details..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
          >
            <option value="Research">Research (1-on-1)</option>
            <option value="Summer Camp">Summer Camp (Global)</option>
            <option value="Seoul Research Program">Seoul Research Program</option>
            <option value="Winter Online">Winter Online</option>
            <option value="Projects">Projects</option>
            <option value="Competitions">Competitions</option>
            <option value="Internship">Interns / Internships</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory / Variation (Optional)</label>
           <input
            type="text"
            name="subCategory"
            value={formData.subCategory}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            placeholder="e.g. Group, Advanced"
           />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          >
            <option value="OPEN">Open for Applications</option>
            <option value="CLOSED">Closed / Upcoming</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tuition (USD)</label>
          <input
            type="number"
            name="tuition"
            value={formData.tuition}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            placeholder="e.g. 8580"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
          {recentStartDates.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 py-1">Recent:</span>
              {recentStartDates.map(date => (
                <button
                  key={`start-${date}`}
                  type="button"
                  onClick={() => setFormData({ ...formData, startDate: date })}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                >
                  {date}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
          {recentEndDates.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 py-1">Recent:</span>
              {recentEndDates.map(date => (
                <button
                  key={`end-${date}`}
                  type="button"
                  onClick={() => setFormData({ ...formData, endDate: date })}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                >
                  {date}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Schedule</label>
          <input
            type="text"
            name="courseSchedule"
            value={formData.courseSchedule}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            placeholder="e.g. Saturdays 10AM EST"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Professor Teaching Hours</label>
          <input
            type="text"
            name="teachingHoursProf"
            value={formData.teachingHoursProf}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            placeholder="e.g. 10 hours"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">TA Teaching Hours</label>
          <input
            type="text"
            name="teachingHoursTA"
            value={formData.teachingHoursTA}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            placeholder="e.g. 5 hours"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Syllabus / Course Content (Markdown Supported)</label>
        <p className="text-xs text-gray-500 mb-3">You can paste formatted markdown here to populate the detailed syllabus UI on the public page.</p>
        <textarea
          name="content"
          rows={15}
          value={formData.content}
          onChange={handleChange}
          placeholder="e.g. ## Program Objectives&#10;..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono text-sm leading-relaxed"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : initialData ? "Update Program" : "Create Program"}
        </button>
      </div>
    </form>
  );
}
