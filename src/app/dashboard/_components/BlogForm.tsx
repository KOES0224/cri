"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "@/app/actions/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type PostFormProps = {
  initialData?: {
    id: string;
    slug?: string | null;
    title: string;
    excerpt: string | null;
    content: string;
    category: string;
    author: string;
    imageUrl?: string | null;
    externalLink?: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function BlogForm({ initialData, onSuccess, onCancel }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    category: initialData?.category || "Success Stories",
    author: initialData?.author || "CRI Editorial",
    imageUrl: initialData?.imageUrl || "",
    externalLink: initialData?.externalLink || "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        title: formData.title,
        slug: formData.slug || null,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        author: formData.author,
        imageUrl: uploadedImageUrl || null,
        externalLink: formData.externalLink || null,
      };

      let result;
      if (initialData?.id) {
        result = await updatePost(initialData.id, payload);
      } else {
        result = await createPost({
            ...payload,
            publishedAt: new Date()
        });
      }

      if (result.success) {
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        setError(result.error || "Failed to save post.");
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
            placeholder="e.g. my-awesome-post"
            value={formData.slug}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Article Title *</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Short Excerpt</label>
        <textarea
          name="excerpt"
          rows={2}
          value={formData.excerpt}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Full Content *</label>
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
          <div className="w-full px-4 py-8 min-h-[400px] max-h-[800px] overflow-y-auto border border-gray-200 rounded-xl bg-[#FAFAFA] shadow-inner">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-6 leading-tight">
                {formData.title || "Untitled Article"}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-10 flex-wrap">
                <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{formData.category || "Category"}</span>
                <span className="font-medium">{formData.author || "Author"}</span>
                <span>•</span>
                <span>Just now</span>
              </div>
      
              {(file || formData.imageUrl) && (
                 <div className="relative w-full h-[300px] mb-12 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-gray-200 shrink-0">
                   {/* We use standard img tag instead of next/image to easily support local Blob URLs without config errors */}
                   <img 
                     src={file ? URL.createObjectURL(file) : formData.imageUrl} 
                     alt="Hero Preview" 
                     className="w-full h-full object-cover" 
                   />
                 </div>
              )}
      
              <MarkdownRenderer content={formData.content || "Nothing to preview yet."} className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm" />
            </div>
          </div>
        ) : (
          <textarea
            name="content"
            required
            rows={8}
            value={formData.content}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none font-mono text-sm"
            placeholder="Use Markdown or plain text..."
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none bg-white"
          >
            <option value="Success Stories">Success Stories</option>
            <option value="University News">University News</option>
            <option value="Study Abroad">Study Abroad</option>
            <option value="Admissions Strategy">Admissions Strategy</option>
            <option value="CRI Announcements">CRI Announcements</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image Upload</label>
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
            placeholder="https://example.com"
            value={formData.externalLink}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none"
          />
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
          className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : initialData ? "Update Article" : "Publish Article"}
        </button>
      </div>
    </form>
  );
}
