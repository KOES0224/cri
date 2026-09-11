"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createLead } from "@/app/actions/crm";
import { useRouter } from "next/navigation";

export default function CreateLeadModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setDuplicateId(null);
    setLoading(true);

    const result = await createLead(name, email);

    if (result.success && result.leadId) {
      setIsOpen(false);
      router.push(`/dashboard/leads/${result.leadId}`);
    } else {
      if ("existingLeadId" in result && result.existingLeadId) setDuplicateId(result.existingLeadId);
      else alert(result.error);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        New inquiry
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-4">
              New inquiry
            </h3>
            <p className="text-gray-500 text-sm mb-6 mt-4">
              Add a person to follow up with. You can add school details, contact information and notes afterward.
            </p>

            {duplicateId && <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">An inquiry with this email already exists. <Link href={`/dashboard/leads/${duplicateId}`} className="font-semibold underline">Open existing inquiry</Link></p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-inquiry-name" className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                <input
                  id="new-inquiry-name" type="text"
                  value={name}
                  required
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="new-inquiry-email" className="block text-sm font-bold text-gray-700 mb-2">Email Address (Optional)</label>
                <input
                  id="new-inquiry-email" type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-4"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create inquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
