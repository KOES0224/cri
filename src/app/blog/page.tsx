"use client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function BlogPage() {
  const posts = [
    { title: "The Future of AI in Economic Research", date: "August 12, 2024", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop" },
    { title: "Reflections from the 2024 Seoul Summer Camp", date: "July 28, 2024", img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop" },
    { title: "How to Structure a Winning Literature Review", date: "June 05, 2024", img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop" }
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">Institute Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Articles, news, and insights directly from our scholars and mentors.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <p className="text-sm font-bold text-gray-400 mb-3">{post.date}</p>
                <h3 className="text-xl font-bold mb-4 leading-tight">{post.title}</h3>
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <button className="flex items-center text-sm font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                    Read Article <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
