"use client";
import Link from "next/link";
import { ArrowLeft, FolderGit2, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PersonalProjectsPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/projects" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
        
        <div className="bg-white p-8 md:p-16 rounded-[3rem] border border-gray-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-[100px] -z-10 blur-3xl opacity-60"></div>
          
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-blue-100">
            <FolderGit2 className="w-10 h-10" />
          </div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter mb-6 leading-tight">
            Personal Projects
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl text-gray-600 leading-relaxed max-w-2xl mb-12">
            Independent research and technical builds tailored to your specific academic passions. At CRI, a personal project is not just a hobby—it is a rigorously structured pursuit designed to yield publishable or demonstrable outcomes.
          </motion.p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Program Structure</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-blue-500 mr-3 shrink-0" />
                  <span className="text-gray-700">1-on-1 faculty mentorship</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-blue-500 mr-3 shrink-0" />
                  <span className="text-gray-700">Weekly progress reviews and code audits</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-blue-500 mr-3 shrink-0" />
                  <span className="text-gray-700">Access to CRI proprietary datasets</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-600 text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <h3 className="text-2xl font-bold mb-4 relative z-10">Ready to Start?</h3>
              <p className="text-blue-100 mb-8 relative z-10">Pitch your project idea directly through the student portal to get matched with a mentor.</p>
              <Link href="/auth/login" className="inline-flex w-full justify-center items-center px-6 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-50 transition-colors relative z-10 group">
                Submit Proposal
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
