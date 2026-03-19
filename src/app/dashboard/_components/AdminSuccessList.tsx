"use client";

import { useState } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import SuccessStoryForm from "./SuccessStoryForm";
import { deleteSuccessStory } from "@/app/actions/success";
import { useRouter } from "next/navigation";

type Story = {
  id: string;
  slug: string | null;
  name: string;
  university: string;
  major: string;
  projectTitle: string;
  description: string | null;
  imageUrl: string | null;
  externalLink: string | null;
  createdAt: Date;
};

export default function AdminSuccessList({ initialStories }: { initialStories: Story[] }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this story?")) {
      const result = await deleteSuccessStory(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    }
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingStory(null);
  };

  if (isCreating || editingStory) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {isCreating ? "Add new Success Story" : "Edit Success Story"}
        </h3>
        <SuccessStoryForm 
          initialData={editingStory || undefined} 
          onSuccess={closeForm} 
          onCancel={closeForm} 
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-900">Manage Success Stories</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          New Story
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-medium">Student</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">University</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Major</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialStories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No success stories published yet. Create your first one!
                </td>
              </tr>
            ) : (
              initialStories.map((story) => (
                <tr key={story.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{story.name}</td>
                  <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{story.university}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                     <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                       {story.major}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => setEditingStory(story)}
                      className="text-orange-600 hover:text-orange-900 bg-orange-50 p-2 rounded-md hover:bg-orange-100"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(story.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md hover:bg-red-100"
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
