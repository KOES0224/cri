"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Image as ImageIcon } from "lucide-react";
import { getSiteContent, saveSiteContent } from "@/app/actions/siteContent";

export default function LandingClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Define keys for the landing page with defaults matching the live site
  const [formData, setFormData] = useState({
    landing_hero_title: "Interests Taken\\nSeriously.",
    landing_hero_subtitle: "CRI is a guided research environment where genuine interests are developed into academic work that can be examined, defended, and evaluated.",
    landing_hero_image: "",
    landing_stat1_number: "100%",
    landing_stat1_label: "Admissions Success",
    landing_stat2_number: "#1",
    landing_stat2_label: "Research Institute",
    landing_stat3_number: "50+",
    landing_stat3_label: "Ivy Mentors",
    landing_footer_cta: "Building the next generation of academic contributors.",
  });

  useEffect(() => {
    async function fetchContent() {
      const res = await getSiteContent("landing");
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          ...res.data
        }));
      }
      setLoading(false);
    }
    fetchContent();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      let finalData = { ...formData };

      // Upload image if selected
      if (file) {
        const fileData = new FormData();
        fileData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fileData });
        if (!res.ok) throw new Error("Image upload failed");
        const blob = await res.json();
        finalData.landing_hero_image = blob.url;
      }

      const res = await saveSiteContent("landing", finalData);
      if (res.success) {
        setMessage("Landing page content saved successfully!");
        setFile(null); // Clear pending file as it's now uploaded
        router.refresh();
      } else {
        setMessage("Error saving content.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to upload image or save data.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) return <div className="p-8">Loading CMS settings...</div>;

  return (
      <div className="max-w-4xl mx-auto pb-12">
        <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Landing Page Settings</h1>
          <p className="text-gray-600">Update the text and images that appear on the public portal front page.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-lg font-medium \${message.includes('Error') || message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* Section: Hero */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3 text-sm">1</span>
            Hero Section
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Hero Headline</label>
              <textarea
                name="landing_hero_title"
                rows={2}
                value={formData.landing_hero_title}
                onChange={handleChange}
                placeholder="e.g. Interests Taken\nSeriously."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium text-lg leading-relaxed whitespace-pre-line"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Hero Subheadline</label>
              <textarea
                name="landing_hero_subtitle"
                rows={3}
                value={formData.landing_hero_subtitle}
                onChange={handleChange}
                placeholder="e.g. Join the most prestigious research institute..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Background Image</label>
              
              <div className="flex gap-6 items-start">
                {/* Media Preview Window */}
                <div className="relative w-48 h-32 rounded-xl border border-gray-200 bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                   {(file || formData.landing_hero_image) ? (
                     (file?.type === 'video/mp4' || (!file && formData.landing_hero_image.endsWith('.mp4'))) ? (
                       <video 
                         src={file ? URL.createObjectURL(file) : formData.landing_hero_image} 
                         className="w-full h-full object-cover" 
                         muted loop autoPlay playsInline 
                       />
                     ) : (
                       <img 
                         src={file ? URL.createObjectURL(file) : formData.landing_hero_image} 
                         alt="Hero Background Preview" 
                         className="w-full h-full object-cover" 
                       />
                     )
                   ) : (
                     <ImageIcon className="w-8 h-8 text-gray-400" />
                   )}
                </div>

                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*,video/mp4"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none mb-2"
                  />
                  <p className="text-xs text-gray-500">Upload a high quality panoramic image or .mp4 video. It will automatically be darkened to make the white text readable.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Statistics */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 text-sm">2</span>
            Highlight Statistics
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Stat 1 */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Stat Block 1</label>
              <input
                type="text"
                name="landing_stat1_number"
                value={formData.landing_stat1_number}
                onChange={handleChange}
                placeholder="e.g. 100%"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-lg font-black text-center mb-3"
              />
              <input
                type="text"
                name="landing_stat1_label"
                value={formData.landing_stat1_label}
                onChange={handleChange}
                placeholder="e.g. Top 20 Admissions"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center"
              />
            </div>
            {/* Stat 2 */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Stat Block 2</label>
              <input
                type="text"
                name="landing_stat2_number"
                value={formData.landing_stat2_number}
                onChange={handleChange}
                placeholder="e.g. #1"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-lg font-black text-center mb-3"
              />
              <input
                type="text"
                name="landing_stat2_label"
                value={formData.landing_stat2_label}
                onChange={handleChange}
                placeholder="e.g. Research Institute"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center"
              />
            </div>
            {/* Stat 3 */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Stat Block 3</label>
              <input
                type="text"
                name="landing_stat3_number"
                value={formData.landing_stat3_number}
                onChange={handleChange}
                placeholder="e.g. 50+"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-lg font-black text-center mb-3"
              />
              <input
                type="text"
                name="landing_stat3_label"
                value={formData.landing_stat3_label}
                onChange={handleChange}
                placeholder="e.g. Ivy League Mentors"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center"
              />
            </div>
          </div>
        </div>

        {/* Section: Footer CTA */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mr-3 text-sm">3</span>
            Call to Action (Bottom)
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Footer Headline</label>
              <input
                type="text"
                name="landing_footer_cta"
                value={formData.landing_footer_cta}
                onChange={handleChange}
                placeholder="e.g. Ready to begin your research journey?"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
              />
            </div>
          </div>
        </div>
      </div>
      </div>
  );
}
