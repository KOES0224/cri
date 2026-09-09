"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProfessor, updateProfessor } from "@/app/actions/professors";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";

type ProfessorFormProps = {
  initialData?: {
    id: string;
    name: string;
    role: string;
    university: string | null;
    bio: string;
    imageUrl?: string | null;
    universityLogo?: string | null;
    acceptingMentees: boolean;
    publications: number;
    programs?: { id: string; title: string }[];
    courseTitle?: string | null;
    courseDescription?: string | null;
    idealStudents?: string | null;
    potentialTopics?: string | null;
    relatedMajor?: string | null;
    keywords?: string | null;
  };
  programs: { id: string; title: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ProfessorForm({ initialData, programs, onSuccess, onCancel }: ProfessorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    role: initialData?.role || "",
    university: initialData?.university || "",
    bio: initialData?.bio || "",
    imageUrl: initialData?.imageUrl || "",
    universityLogo: initialData?.universityLogo || "",
    acceptingMentees: initialData?.acceptingMentees ?? true,
    publications: initialData?.publications || 0,
    programIds: initialData?.programs?.map(p => p.id) || ([] as string[]),
    courseTitle: initialData?.courseTitle || "",
    courseDescription: initialData?.courseDescription || "",
    idealStudents: initialData?.idealStudents || "",
    potentialTopics: initialData?.potentialTopics || "",
    relatedMajor: initialData?.relatedMajor || "",
    keywords: initialData?.keywords || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || "Failed to upload image");
      }
      const blob = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: blob.url }));
    } catch (err: any) {
      alert(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || "Failed to upload logo");
      }
      const blob = await res.json();
      setFormData(prev => ({ ...prev, universityLogo: blob.url }));
    } catch (err: any) {
      alert(err.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
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
        imageUrl: formData.imageUrl || null,
        universityLogo: formData.universityLogo || null,
        acceptingMentees: formData.acceptingMentees,
        publications: formData.publications,
        programIds: formData.programIds,
        courseTitle: formData.courseTitle || null,
        courseDescription: formData.courseDescription || null,
        idealStudents: formData.idealStudents || null,
        potentialTopics: formData.potentialTopics || null,
        relatedMajor: formData.relatedMajor || null,
        keywords: formData.keywords || null,
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

      {/* Professor Photo and Institute Logo Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50/80 border border-gray-200 rounded-2xl">
        {/* Professor Face / Headshot */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-0.5">
            Professor Photo (Headshot / Face)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Displayed on program cards and detail pages.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {formData.imageUrl ? (
                <>
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : uploadingImage ? (
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5 text-gray-600" />
                {uploadingImage ? "Uploading..." : "Upload Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="Or paste image URL..."
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Institute / University Logo */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-0.5">
            Institute / University Logo
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Official seal or logo for Harvard, Oxford, Notre Dame, etc.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center p-2 overflow-hidden shrink-0 shadow-inner">
              {formData.universityLogo ? (
                <>
                  <img src={formData.universityLogo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, universityLogo: "" }))}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition-colors"
                    title="Remove logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : uploadingLogo ? (
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5 text-gray-600" />
                {uploadingLogo ? "Uploading..." : "Upload Logo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                name="universityLogo"
                value={formData.universityLogo}
                onChange={handleChange}
                placeholder="Or paste logo URL..."
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Related Major (Primary Field)</label>
        <input
          type="text"
          name="relatedMajor"
          value={formData.relatedMajor}
          onChange={handleChange}
          placeholder="e.g. Biomedical Engineering"
          className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-green-500 transition-all outline-none"
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

      <div className="pb-4 border-b border-gray-100 mt-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Research Programs</label>
        
        {/* Selected Programs Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.programIds.length === 0 && <span className="text-sm text-gray-400">No programs assigned</span>}
          {formData.programIds.map(id => {
            const prog = programs.find(p => p.id === id);
            if (!prog) return null;
            return (
              <div key={prog.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200">
                <span>{prog.title}</span>
                <button type="button" onClick={() => handleProgramToggle(prog.id)} className="hover:text-green-500 hover:bg-green-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors ml-1">
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
            placeholder="Search programs to assign..."
            className="w-full px-4 py-2 border border-green-200 bg-green-50/50 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none text-sm placeholder:text-gray-400"
          />
          
          {/* Dropdown Results */}
          {searchQuery.trim().length > 0 && (
             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-hidden">
               {(() => {
                 const query = searchQuery.toLowerCase();
                 const filtered = programs.filter(p => 
                   p.title && p.title.toLowerCase().includes(query)
                 );

                 if (filtered.length === 0) {
                   return <div className="p-4 text-sm text-gray-500 text-center">No matching programs found.</div>;
                 }

                 return filtered.map(prog => {
                   const isSelected = formData.programIds.includes(prog.id);
                   return (
                     <button
                       key={prog.id}
                       type="button"
                       onClick={() => {
                         handleProgramToggle(prog.id);
                         setSearchQuery(""); // Auto clear string on selection
                       }}
                       className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex justify-between items-center transition-colors ${isSelected ? 'bg-green-50/30' : ''}`}
                     >
                       <div className="font-bold text-gray-900 text-sm">
                         {prog.title}
                       </div>
                       {isSelected ? (
                         <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded">Added</span>
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

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4 my-2">
        <h4 className="font-bold text-gray-900">Curriculum / Course Details (Optional)</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
          <input type="text" name="courseTitle" value={formData.courseTitle} onChange={handleChange} placeholder="e.g. Intro to Machine Learning" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ideal Students</label>
            <textarea name="idealStudents" rows={3} value={formData.idealStudents} onChange={handleChange} placeholder="Target demographics or prerequisites..." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm placeholder:text-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Potential Topics</label>
            <textarea name="potentialTopics" rows={3} value={formData.potentialTopics} onChange={handleChange} placeholder="List of potential research areas..." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm placeholder:text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (Comma separated keywords for display)</label>
          <textarea name="keywords" rows={2} value={formData.keywords} onChange={handleChange} placeholder="e.g. AI, Neuroscience, Hardware" className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm placeholder:text-gray-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Description / Syllabus</label>
          <textarea name="courseDescription" rows={3} value={formData.courseDescription} onChange={handleChange} placeholder="Brief syllabus or learning outcomes..." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
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
