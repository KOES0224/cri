"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSuccessStory, updateSuccessStory } from "@/app/actions/success";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type SuccessFormProps = {
  initialData?: {
    id: string;
    slug?: string | null;
    name: string;
    university: string;
    major: string;
    projectTitle: string;
    description?: string | null;
    imageUrl?: string | null;
    externalLink?: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function SuccessStoryForm({ initialData, onSuccess, onCancel }: SuccessFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    university: initialData?.university || "",
    major: initialData?.major || "",
    projectTitle: initialData?.projectTitle || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    externalLink: initialData?.externalLink || "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let uploadedImageUrl = formData.imageUrl;
      if (file) {
        const fileData = new FormData();
        fileData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fileData });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Image upload failed");
        }
        const blob = await res.json();
        uploadedImageUrl = blob.url;
      }

      const payload = {
        name: formData.name,
        slug: formData.slug || null,
        university: formData.university,
        major: formData.major,
        projectTitle: formData.projectTitle,
        description: formData.description || null,
        imageUrl: uploadedImageUrl || null,
        externalLink: formData.externalLink || null,
      };

      let result;
      if (initialData?.id) {
        result = await updateSuccessStory(initialData.id, payload);
      } else {
        result = await createSuccessStory(payload);
      }

      if (result.success) {
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        setError(result.error || "Failed to save story.");
      }
    } catch (err: any) {
      console.error("Form Submission Error:", err);
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Slug (URL) *</label>
          <input
            type="text"
            name="slug"
            required
            placeholder="e.g. david-stanford"
            value={formData.slug}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. David Kim"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
          <input
            type="text"
            name="university"
            required
            placeholder="e.g. Stanford University"
            value={formData.university}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Major/Intended Major *</label>
          <input
            type="text"
            name="major"
            required
            placeholder="e.g. Computer Science"
            value={formData.major}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
        <textarea
          name="projectTitle"
          required
          rows={2}
          placeholder="e.g. AI Ethics in Modern Computation"
          value={formData.projectTitle}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Detailed Description (Optional)</label>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${!previewMode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${previewMode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Preview
            </button>
          </div>
        </div>
        {previewMode ? (
          <div className="w-full px-4 py-8 min-h-[400px] max-h-[800px] overflow-y-auto border border-gray-200 rounded-xl bg-[#FAFAFA] shadow-inner mb-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                {(file || formData.imageUrl) ? (
                   <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-sm border border-gray-100 shrink-0 bg-gray-200">
                     <img src={file ? URL.createObjectURL(file) : formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                   </div>
                ) : (
                   <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-sm border border-gray-100 shrink-0 flex items-center justify-center bg-gray-200">
                     <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${formData.name}&backgroundColor=e2e8f0`} alt="Avatar" className="w-full h-full object-cover" />
                   </div>
                )}
                
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4 leading-tight">{formData.name || "Student Name"}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-6">
                    <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{formData.university || "University"}</span>
                    <span className="font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-700">Major: {formData.major || "Major"}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-3">Research Profile</h2>
                  <p className="text-gray-600 font-medium leading-relaxed bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    {formData.projectTitle || "Project Title"}
                  </p>
                </div>
              </div>

              <MarkdownRenderer content={formData.description || "Nothing to preview yet."} className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm" />
            </div>
          </div>
        ) : (
          <textarea
            name="description"
            rows={4}
            placeholder="Use Markdown to describe their journey or the research paper..."
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile/Hero Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none"
          />
          {formData.imageUrl && !file && <p className="text-xs text-gray-500 mt-1">Current image uploaded.</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">External Link (Optional)</label>
          <input
            type="url"
            name="externalLink"
            placeholder="https://example.com/paper-link"
            value={formData.externalLink}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : initialData ? "Update Story" : "Publish Story"}
        </button>
      </div>
    </form>
  );
}
