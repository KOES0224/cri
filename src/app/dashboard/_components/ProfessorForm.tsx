"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProfessor, updateProfessor } from "@/app/actions/professors";

type ProfessorFormProps = {
  initialData?: {
    id: string;
    name: string;
    role: string;
    university: string | null;
    bio: string;
    acceptingMentees: boolean;
    publications: number;
    programs?: { id: string; title: string }[];
    courseTitle?: string | null;
    courseDescription?: string | null;
    teachingHoursProf?: string | null;
    teachingHoursTA?: string | null;
    courseSchedule?: string | null;
  };
  programs: { id: string; title: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ProfessorForm({ initialData, programs, onSuccess, onCancel }: ProfessorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    role: initialData?.role || "",
    university: initialData?.university || "",
    bio: initialData?.bio || "",
    acceptingMentees: initialData?.acceptingMentees ?? true,
    publications: initialData?.publications || 0,
    programIds: initialData?.programs?.map(p => p.id) || ([] as string[]),
    courseTitle: initialData?.courseTitle || "",
    courseDescription: initialData?.courseDescription || "",
    teachingHoursProf: initialData?.teachingHoursProf || "",
    teachingHoursTA: initialData?.teachingHoursTA || "",
    courseSchedule: initialData?.courseSchedule || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleProgramToggle = (programId: string) => {
    setFormData(prev => ({
      ...prev,
      programIds: prev.programIds.includes(programId) 
        ? prev.programIds.filter(id => id !== programId)
        : [...prev.programIds, programId]
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, publications: parseInt(e.target.value) || 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: formData.name,
        role: formData.role,
        university: formData.university || null,
        bio: formData.bio,
        acceptingMentees: formData.acceptingMentees,
        publications: formData.publications,
        programIds: formData.programIds,
        courseTitle: formData.courseTitle || null,
        courseDescription: formData.courseDescription || null,
        teachingHoursProf: formData.teachingHoursProf || null,
        teachingHoursTA: formData.teachingHoursTA || null,
        courseSchedule: formData.courseSchedule || null,
      };

      let result;
      if (initialData?.id) {
        result = await updateProfessor(initialData.id, payload);
      } else {
        result = await createProfessor(payload);
      }

      if (result.success) {
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        setError(result.error || "Failed to save profile.");
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Dr. Sarah Chen"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title / Role *</label>
          <input
            type="text"
            name="role"
            required
            value={formData.role}
            onChange={handleChange}
            placeholder="e.g. Director of Cognitive Sciences"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-all outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">University Affiliation</label>
        <input
          type="text"
          name="university"
          value={formData.university}
          onChange={handleChange}
          placeholder="e.g. Stanford University"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-all outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Biography / Research Focus *</label>
        <textarea
          name="bio"
          required
          rows={4}
          value={formData.bio}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-all outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Programs</label>
        <div className="flex flex-wrap gap-2">
           {programs.map(prog => (
             <button
               key={prog.id}
               type="button"
               onClick={() => handleProgramToggle(prog.id)}
               className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors border ${
                 formData.programIds.includes(prog.id) 
                   ? "bg-green-100 text-green-800 border-green-200"
                   : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
               }`}
             >
               {prog.title}
             </button>
           ))}
           {programs.length === 0 && <span className="text-sm text-gray-400">No programs available</span>}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4 my-2">
        <h4 className="font-bold text-gray-900">Curriculum / Course Details (Optional)</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
          <input type="text" name="courseTitle" value={formData.courseTitle} onChange={handleChange} placeholder="e.g. Intro to Machine Learning" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Description / Syllabus</label>
          <textarea name="courseDescription" rows={3} value={formData.courseDescription} onChange={handleChange} placeholder="Brief syllabus or learning outcomes..." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Professor Teaching Hours</label>
            <input type="text" name="teachingHoursProf" value={formData.teachingHoursProf} onChange={handleChange} placeholder="e.g. 5 hours/week" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TA Teaching Hours</label>
            <input type="text" name="teachingHoursTA" value={formData.teachingHoursTA} onChange={handleChange} placeholder="e.g. 10 hours/week" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Schedule</label>
          <input type="text" name="courseSchedule" value={formData.courseSchedule} onChange={handleChange} placeholder="e.g. Mondays & Wednesdays 5PM - 7PM EST" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Publications</label>
          <input
            type="number"
            name="publications"
            min="0"
            value={formData.publications}
            onChange={handleNumberChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-all outline-none"
          />
        </div>
        <div className="flex items-center mt-6">
          <input
            type="checkbox"
            id="acceptingMentees"
            name="acceptingMentees"
            checked={formData.acceptingMentees}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="acceptingMentees" className="ml-2 block text-sm text-gray-900 font-medium">
            Currently Accepting New Mentees
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
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
          className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : initialData ? "Update Profile" : "Add Professor"}
        </button>
      </div>
    </form>
  );
}
