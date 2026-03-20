"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";

type Post = {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  author: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
};

export default function BlogClientPage({ posts }: { posts: Post[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const publishedPosts = posts.filter(p => p.publishedAt !== null);
  const categories = ["All", ...Array.from(new Set(publishedPosts.map(p => p.category)))];

  const filteredPosts = selectedCategory === "All" 
    ? publishedPosts 
    : publishedPosts.filter(p => p.category === selectedCategory);

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">Institute Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Articles, news, and insights directly from our scholars and mentors.</p>
        </motion.div>

        {publishedPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
             <p className="text-xl text-gray-400 font-medium">No articles published yet.</p>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            {categories.length > 2 && (
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all click-press ${
                      selectedCategory === cat 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-8">
              {filteredPosts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="flex flex-col h-full relative">
                  <Link href={`/blog/${post.slug || post.id}`} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative">
                    <div className="h-48 overflow-hidden relative bg-gray-100 shrink-0">
                      {post.imageUrl ? (
                        <Image src={post.imageUrl} alt={post.title} className="object-cover group-hover:scale-105 transition-transform duration-500" fill />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-50">
                          <span className="text-purple-200 font-bold block pb-[5%]">CRI</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      {/* Parse date safely */}
                      <p className="text-sm font-bold text-gray-400 mb-3">
                        {post.publishedAt ? format(new Date(post.publishedAt), 'MMMM d, yyyy') : format(new Date(post.createdAt), 'MMMM d, yyyy')}
                      </p>
                      <h3 className="text-xl font-bold mb-3 leading-tight text-gray-900">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-gray-600 line-clamp-2 text-sm mb-4 leading-relaxed">{post.excerpt}</p>
                      )}
                      <div className="mt-auto pt-6 border-t border-gray-100">
                        <div className="inline-flex items-center text-sm font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                          Read Article <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
