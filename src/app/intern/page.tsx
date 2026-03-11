"use client";
import { motion } from "framer-motion";
import { Briefcase, Building2, MapPin } from "lucide-react";

export default function InternPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">Internship Opportunities</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Exclusive access to industry and laboratory internships for qualified CRI scholars.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-8 rounded-3xl border border-gray-100 premium-card group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">Summer 2026</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Research Assistant</h3>
              <p className="text-gray-500 text-sm font-medium mb-4 flex items-center"><MapPin className="w-4 h-4 mr-1"/> Seoul National University</p>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">Assist in data collection and statistical analysis for an ongoing study in cognitive behavioral science.</p>
              <button className="w-full py-3 bg-gray-50 text-gray-900 font-semibold rounded-xl hover:bg-gray-900 hover:text-white shadow-sm hover-lift click-press">View Details</button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
