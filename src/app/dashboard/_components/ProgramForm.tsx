"use client";

import { useState } from "react";
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
    startDate?: Date | null;
    endDate?: Date | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ProgramForm({ initialData, onSuccess, onCancel }: ProgramFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "Research",
    subCategory: initialData?.subCategory || "",
    status: initialData?.status || "OPEN",
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      };

      let result;
      if (initialData?.id) {
        result = await updateProgram(initialData.id, payload);
      } else {
        result = await createProgram(payload);
      }

      if (result.success) {
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Main Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          >
            <option value="Research">Research</option>
            <option value="Mentorship">Mentorship</option>
            <option value="Internship">Internship</option>
            <option value="Camp">Camp</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Program Type / Variation</label>
           {formData.category === "Research" ? (
             <select
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
             >
              <option value="">Select Specific Program...</option>
              <option value="1-on-1 (With Professor)">1-on-1 Advanced Research (With Professor)</option>
              <option value="1-on-1 (With Mentor)">1-on-1 Advanced Research (With Mentor)</option>
              <option value="Seoul Research Summer Camp">Seoul Research Program (Summer Camp)</option>
              <option value="Winter Online Research">Winter Online Research</option>
             </select>
           ) : (
             <input
              type="text"
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              placeholder="e.g. 1-on-1, Group"
             />
           )}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
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
        </div>
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
