"use client";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function GroupProjectsPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/projects" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
        
        <div className="bg-white p-8 md:p-16 rounded-[3rem] border border-gray-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-bl-[100px] -z-10 blur-3xl opacity-60"></div>
          
          <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-purple-100">
            <Users className="w-10 h-10" />
          </div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter mb-6 leading-tight">
            Group Projects
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl text-gray-600 leading-relaxed max-w-2xl mb-12">
            Cross-disciplinary teams working on large-scale societal or technical problems. Group projects mimic real-world startup or lab environments, requiring strict version control, delegated responsibilities, and unified presentation.
          </motion.p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Program Structure</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-purple-500 mr-3 shrink-0" />
                  <span className="text-gray-700">Teams of 3 to 5 scholars</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-purple-500 mr-3 shrink-0" />
                  <span className="text-gray-700">Agile development sprints</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-purple-500 mr-3 shrink-0" />
                  <span className="text-gray-700">Capstone symposium presentation</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-purple-600 text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <h3 className="text-2xl font-bold mb-4 relative z-10">Join a Cohort</h3>
              <p className="text-purple-100 mb-8 relative z-10">Browse active groups seeking additional members or pitch a new team concept.</p>
              <Link href="/auth/login" className="inline-flex w-full justify-center items-center px-6 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-50 transition-colors relative z-10 group">
                Access Team Portal
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
