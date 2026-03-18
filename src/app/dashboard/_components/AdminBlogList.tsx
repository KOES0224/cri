"use client";

import { useState } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import BlogForm from "./BlogForm";
import { deletePost } from "@/app/actions/blog";
import { useRouter } from "next/navigation";

type Post = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  author: string;
  publishedAt: Date | null;
  createdAt: Date;
};

export default function AdminBlogList({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      const result = await deletePost(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    }
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingPost(null);
  };

  if (isCreating || editingPost) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {isCreating ? "Write New Article" : "Edit Article"}
        </h3>
        <BlogForm 
          initialData={editingPost || undefined} 
          onSuccess={closeForm} 
          onCancel={closeForm} 
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-900">Manage Articles</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          New Article
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">Author</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Category</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No articles published yet. Create your first one!
                </td>
              </tr>
            ) : (
              initialPosts.map((post) => (
                <tr key={post.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{post.title}</td>
                  <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{post.author}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                     <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                       {post.category}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Draft'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => setEditingPost(post)}
                      className="text-purple-600 hover:text-purple-900 transition-colors bg-purple-50 p-2 rounded-md hover:bg-purple-100"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-900 transition-colors bg-red-50 p-2 rounded-md hover:bg-red-100"
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
