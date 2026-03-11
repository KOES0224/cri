"use client";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">Student Success</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Meet our scholars who have transfromed their curiosity into accepted publications and elite university admissions.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: "David K.", u: "Stanford University", p: "Machine Learning applied to Climate Models" },
            { n: "Sarah M.", u: "MIT", p: "Novel Biomarkers in Early Alzheimer's" },
            { n: "Jin Y.", u: "Seoul National University", p: "Algorithmic Game Theory in Economics" },
            { n: "Alice T.", u: "Oxford University", p: "Historical Linguistic Shifts in 19th Century" }
          ].map((student, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${student.n}&backgroundColor=e2e8f0`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Student" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">{student.n}</h3>
                <p className="text-blue-600 font-semibold text-sm mb-4 flex items-center"><GraduationCap className="w-4 h-4 mr-1"/> {student.u}</p>
                <p className="text-gray-500 text-sm leading-relaxed">Research Topic: {student.p}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
