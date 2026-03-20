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
          <div className="w-full px-4 py-4 min-h-[200px] max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
            {formData.description ? (
              <MarkdownRenderer content={formData.description} className="text-sm" />
            ) : (
              <p className="text-gray-400 text-sm italic">Nothing to preview yet...</p>
            )}
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
