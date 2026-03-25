"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Image as ImageIcon, Layout, Microscope, Rocket, Briefcase } from "lucide-react";
import { getSiteContent, saveSiteContent } from "@/app/actions/siteContent";

export default function LandingClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<Record<string, File>>({});
  const [activeTab, setActiveTab] = useState<"Landing" | "Research" | "Projects" | "Internships">("Landing");

  const [formData, setFormData] = useState({
    // Landing
    landing_pill_badge: "Elite Curriculum Portals",
    landing_hero_title: "Interests Taken",
    landing_hero_title_highlight: "Seriously.",
    landing_hero_subtitle: "CRI is a guided research environment where genuine interests are developed into academic work that can be examined, defended, and evaluated.",
    landing_hero_image: "",
    landing_stat1_number: "100%",
    landing_stat1_label: "Admissions Success",
    landing_stat2_number: "#1",
    landing_stat2_label: "Research Institute",
    landing_stat3_number: "50+",
    landing_stat3_label: "Ivy Mentors",
    landing_footer_cta: "Building the next generation of academic contributors.",
    
    // Research
    research_pill_badge: "Elite Curriculum Portals",
    research_hero_title: "Pioneering",
    research_hero_highlight: "Research",
    research_hero_subtitle: "Select a research environment below to explore available specializations, esteemed mentors, and active applications.",
    research_seoul_image: "",
    research_winter_image: "",
    research_1on1_image: "",
    
    // Projects
    projects_pill_badge: "Student Portfolios",
    projects_hero_title: "Ideas Turned Into",
    projects_hero_highlight: "Impact",
    projects_hero_subtitle: "Explore personal endeavors, collaborative group work, and rigorous competition preparation led entirely by our scholars.",
    
    // Internships
    intern_pill_badge: "CRI Scholar Network",
    intern_hero_title: "Elite",
    intern_hero_highlight: "Internships",
    intern_hero_subtitle: "Exclusive access to industry and laboratory internships for qualified CRI scholars. Bridge the gap between academic theory and real-world impact.",
    intern_pillar1_image: "",
    intern_pillar2_image: "",
    intern_pillar3_image: "",
  });

  useEffect(() => {
    async function fetchContent() {
      const res = await getSiteContent("landing");
      if (res.success && Object.keys(res.data).length > 0) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [key]: e.target.files[0] });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      let finalData: any = { ...formData };

      // Upload images if selected
      for (const [key, selectedFile] of Object.entries(files)) {
        if (selectedFile) {
          const fileData = new FormData();
          fileData.append("file", selectedFile);
          const res = await fetch("/api/upload", { method: "POST", body: fileData });
          
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Upload failed for ${key}: ${errorText.substring(0,100)} (File might be too large - limit is 4MB)`);
          }
          
          const blob = await res.json();
          finalData[key] = blob.url;
        }
      }

      const res = await saveSiteContent("landing", finalData);
      if (res.success) {
        setMessage("Public pages content saved successfully!");
        setFiles({});
        router.refresh();
      } else {
        throw new Error(res.error || "Error saving content to database.");
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`Save failed: ${err.message || "Unknown error occurred"}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) return <div className="p-8">Loading CMS settings...</div>;

  const tabs = [
    { id: "Landing", icon: Layout },
    { id: "Research", icon: Microscope },
    { id: "Projects", icon: Rocket },
    { id: "Internships", icon: Briefcase },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Public Pages Settings</h1>
          <p className="text-gray-600">Manage the hero content and taglines across all primary landing pages.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-lg font-medium ${message.includes('Error') || message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? "text-blue-600" : "text-gray-400"}`} />
            {tab.id}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        
        {/* LANDING TAB */}
        {activeTab === "Landing" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4">Landing Page Setup</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Starred Pill Badge</label>
                <input
                  type="text"
                  name="landing_pill_badge"
                  value={formData.landing_pill_badge}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium mb-3"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Headline (White text)</label>
                  <input
                    type="text"
                    name="landing_hero_title"
                    value={formData.landing_hero_title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-purple-600 mb-2">Headline (Highlight text)</label>
                  <input
                    type="text"
                    name="landing_hero_title_highlight"
                    value={formData.landing_hero_title_highlight}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none font-medium text-purple-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subheadline</label>
                <textarea
                  name="landing_hero_subtitle"
                  rows={3}
                  value={formData.landing_hero_subtitle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Background Image/Video</label>
                <div className="flex gap-6 items-start">
                  <div className="relative w-48 h-32 rounded-xl border border-gray-200 bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                     {(files['landing_hero_image'] || formData.landing_hero_image) ? (
                       (files['landing_hero_image']?.type === 'video/mp4' || (!files['landing_hero_image'] && formData.landing_hero_image.endsWith('.mp4'))) ? (
                         <video src={files['landing_hero_image'] ? URL.createObjectURL(files['landing_hero_image']) : formData.landing_hero_image} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                       ) : (
                         <img src={files['landing_hero_image'] ? URL.createObjectURL(files['landing_hero_image']) : formData.landing_hero_image} className="w-full h-full object-cover" />
                       )
                     ) : (
                       <ImageIcon className="w-8 h-8 text-gray-400" />
                     )}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/*,video/mp4" onChange={(e) => handleFileChange(e, 'landing_hero_image')} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 mb-2" />
                    <p className="text-xs text-gray-500">Upload a background media file. Automatically darkened for text readability.</p>
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Highlight Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <input name="landing_stat1_number" value={formData.landing_stat1_number} onChange={handleChange} className="w-full p-2 bg-white border border-gray-200 rounded-lg font-black text-center mb-2" />
                    <input name="landing_stat1_label" value={formData.landing_stat1_label} onChange={handleChange} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-center" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <input name="landing_stat2_number" value={formData.landing_stat2_number} onChange={handleChange} className="w-full p-2 bg-white border border-gray-200 rounded-lg font-black text-center mb-2" />
                    <input name="landing_stat2_label" value={formData.landing_stat2_label} onChange={handleChange} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-center" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <input name="landing_stat3_number" value={formData.landing_stat3_number} onChange={handleChange} className="w-full p-2 bg-white border border-gray-200 rounded-lg font-black text-center mb-2" />
                    <input name="landing_stat3_label" value={formData.landing_stat3_label} onChange={handleChange} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-center" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESEARCH TAB */}
        {activeTab === "Research" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4">Research Page Hero</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Starred Pill Badge</label>
              <input type="text" name="research_pill_badge" value={formData.research_pill_badge} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Headline (White text)</label>
                <input type="text" name="research_hero_title" value={formData.research_hero_title} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-blue-600 mb-2">Headline (Highlight text)</label>
                <input type="text" name="research_hero_highlight" value={formData.research_hero_highlight} onChange={handleChange} className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl font-medium text-blue-700" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Subheadline</label>
              <textarea name="research_hero_subtitle" rows={3} value={formData.research_hero_subtitle} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
            
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Program Hub Thumbnails</h3>
              <div className="space-y-6">
                {[
                  { label: "Seoul Research Summer Camp", key: "research_seoul_image" },
                  { label: "Winter Online Research", key: "research_winter_image" },
                  { label: "1-on-1 Advanced Research", key: "research_1on1_image" },
                ].map(item => (
                  <div key={item.key} className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">{item.label}</label>
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      <div className="relative w-48 h-32 rounded-xl border border-gray-200 bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {(files[item.key] || formData[item.key as keyof typeof formData]) ? (
                          <img src={files[item.key] ? URL.createObjectURL(files[item.key]) : (formData[item.key as keyof typeof formData] as string)} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 w-full">
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, item.key)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white mb-2" />
                        <p className="text-xs text-gray-500">Upload 4:3 aspect ratio premium photography.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "Projects" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4">Projects Page Hero</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Starred Pill Badge</label>
              <input type="text" name="projects_pill_badge" value={formData.projects_pill_badge} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Headline (White text)</label>
                <input type="text" name="projects_hero_title" value={formData.projects_hero_title} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Headline (Highlight text)</label>
                <input type="text" name="projects_hero_highlight" value={formData.projects_hero_highlight} onChange={handleChange} className="w-full px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl font-medium text-purple-700" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Subheadline</label>
              <textarea name="projects_hero_subtitle" rows={3} value={formData.projects_hero_subtitle} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>
        )}

        {/* INTERNSHIPS TAB */}
        {activeTab === "Internships" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4">Internships Page Hero</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Starred Pill Badge</label>
              <input type="text" name="intern_pill_badge" value={formData.intern_pill_badge} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Headline (White text)</label>
                <input type="text" name="intern_hero_title" value={formData.intern_hero_title} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-emerald-600 mb-2">Headline (Highlight text)</label>
                <input type="text" name="intern_hero_highlight" value={formData.intern_hero_highlight} onChange={handleChange} className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl font-medium text-emerald-700" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Subheadline</label>
              <textarea name="intern_hero_subtitle" rows={3} value={formData.intern_hero_subtitle} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>

            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Value Proposition Pillars (Backgrounds)</h3>
              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: "Unrivaled Network Pillar", key: "intern_pillar1_image" },
                  { label: "Tailored Paths Pillar", key: "intern_pillar2_image" },
                  { label: "Tangible Impact Pillar", key: "intern_pillar3_image" },
                ].map(item => (
                  <div key={item.key} className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">{item.label}</label>
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      <div className="relative w-48 h-32 rounded-xl border border-gray-200 bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {(files[item.key] || formData[item.key as keyof typeof formData]) ? (
                          <img src={files[item.key] ? URL.createObjectURL(files[item.key]) : (formData[item.key as keyof typeof formData] as string)} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 w-full">
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, item.key)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white mb-2" />
                        <p className="text-xs text-gray-500">Background photography for the flex-grow pillar.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
