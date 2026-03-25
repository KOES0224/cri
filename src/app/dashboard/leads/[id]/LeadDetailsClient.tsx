"use client";

import { useState } from "react";
import { User, Mail, Phone, Building, Briefcase, Users, MessageSquare } from "lucide-react";
import { updateLeadDetails } from "@/app/actions/crm";
import { useRouter } from "next/navigation";

export default function LeadDetailsClient({ initialLead }: { initialLead: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const [formData, setFormData] = useState({
    name: initialLead.name || "",
    email: initialLead.email || "",
    phone: initialLead.phone || "",
    age: initialLead.age || "",
    interest: initialLead.interest || "",
    institution: initialLead.institution || "",
    agencyName: initialLead.agencyName || "",
    parentName: initialLead.parentName || "",
    kakaoId: initialLead.kakaoId || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await updateLeadDetails(initialLead.id, formData);
    
    if (result.success) {
      setMessage("Profile saved successfully");
      router.refresh();
    } else {
      setMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center whitespace-nowrap">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-600" />
          CRM Profile
        </h3>
        {initialLead.user ? (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            Registered
          </div>
        ) : (
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Manual Entry</span>
        )}
      </div>
      
      <form onSubmit={handleSave} className="p-6 space-y-5">
        
        {/* Core Contact Group */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center"><User className="w-3.5 h-3.5 mr-1" /> Student Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center"><Mail className="w-3.5 h-3.5 mr-1" /> Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Academic Profile Group */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Age</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 17" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center"><Building className="w-3.5 h-3.5 mr-1" /> Institution</label>
            <input type="text" name="institution" value={formData.institution} onChange={handleChange} placeholder="e.g. Seoul Int'l" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1" /> Academic Interest</label>
            <input type="text" name="interest" value={formData.interest} onChange={handleChange} placeholder="e.g. AI / Biology" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Network Group */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center"><Users className="w-3.5 h-3.5 mr-1" /> Parent Name</label>
              <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
             </div>
             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center"><MessageSquare className="w-3.5 h-3.5 mr-1" /> Kakao ID</label>
              <input type="text" name="kakaoId" value={formData.kakaoId} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
             </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-blue-600">Affiliated Agency</label>
            <input type="text" name="agencyName" value={formData.agencyName} onChange={handleChange} placeholder="Leave blank if independent" className="w-full px-3 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className={`text-xs font-medium ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </span>
          <button 
            type="submit" 
            disabled={loading}
            className="px-5 py-2.5 bg-gray-900 text-white font-semibold text-sm rounded-xl hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
