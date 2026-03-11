"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderGit2, Users, Trophy, ArrowRight } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">Student Projects</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Explore personal endeavors, collaborative group work, and competition preparation led by our scholars.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-3xl border border-gray-100 flex flex-col h-full group premium-card">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <FolderGit2 className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Personal Projects</h3>
            <p className="text-gray-500 mb-6 flex-grow">Independent research and technical builds tailored to specific academic passions.</p>
            <div className="pt-4 border-t border-gray-100 mt-auto">
              <Link href="/projects/personal" className="w-full inline-flex justify-between items-center px-5 py-3.5 bg-gray-50 text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-900 hover:text-white shadow-sm group-hover:shadow-md hover-lift click-press">
                View Project Details
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-3xl border border-gray-100 flex flex-col h-full group premium-card">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Group Projects</h3>
            <p className="text-gray-500 mb-6 flex-grow">Cross-disciplinary teams working on large-scale societal or technical problems.</p>
            <div className="pt-4 border-t border-gray-100 mt-auto">
              <Link href="/projects/group" className="w-full inline-flex justify-between items-center px-5 py-3.5 bg-gray-50 text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-900 hover:text-white shadow-sm group-hover:shadow-md hover-lift click-press">
                View Project Details
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-8 rounded-3xl border border-gray-100 flex flex-col h-full group premium-card">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Competition Preps</h3>
            <p className="text-gray-500 mb-6 flex-grow">Structured preparation for international science, math, and debate olympiads.</p>
            <div className="pt-4 border-t border-gray-100 mt-auto">
              <Link href="/projects/competitions" className="w-full inline-flex justify-between items-center px-5 py-3.5 bg-gray-50 text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-900 hover:text-white shadow-sm group-hover:shadow-md hover-lift click-press">
                View Project Details
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
