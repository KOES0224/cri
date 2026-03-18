"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "@/app/actions/blog";

type PostFormProps = {
  initialData?: {
    id: string;
    title: string;
    excerpt: string | null;
    content: string;
    category: string;
    author: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function BlogForm({ initialData, onSuccess, onCancel }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    category: initialData?.category || "Uncategorized",
    author: initialData?.author || "CRI Editorial",
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
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        author: formData.author,
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Content *</label>
        <textarea
          name="content"
          required
          rows={8}
          value={formData.content}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none font-mono text-sm"
          placeholder="Use Markdown or plain text..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g. Research Spotlight"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none"
          />
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
