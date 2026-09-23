"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Award } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";
import EditorialCover from "@/components/EditorialCover";

type Post = {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  category: string;
  author: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
};

const PAGE_SIZE = 12;

function postDate(post: Post) {
  return format(new Date(post.publishedAt ?? post.createdAt), "MMMM d, yyyy");
}

function Cover({ post, sizes, priority = false }: { post: Post; sizes: string; priority?: boolean }) {
  return post.imageUrl ? (
    <Image src={post.imageUrl} alt="" fill sizes={sizes} priority={priority} className="object-cover group-hover:scale-105 transition-transform duration-500" />
  ) : (
    <EditorialCover category={post.category} />
  );
}

export default function BlogClientPage({ posts }: { posts: Post[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const publishedPosts = posts.filter((p) => p.publishedAt !== null);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of publishedPosts) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [publishedPosts]);

  const filteredPosts = selectedCategory === "All" ? publishedPosts : publishedPosts.filter((p) => p.category === selectedCategory);
  // The newest article leads the unfiltered page; everything else goes in the grid.
  const featured = selectedCategory === "All" ? filteredPosts[0] : undefined;
  const gridPosts = featured ? filteredPosts.slice(1) : filteredPosts;

  const choose = (category: string) => {
    setSelectedCategory(category);
    setVisible(PAGE_SIZE);
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">Institute Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Program news, faculty spotlights, admissions insights, and practical guides to doing real research in high school.</p>
        </motion.div>

        {publishedPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-xl text-gray-400 font-medium">No articles published yet.</p>
          </div>
        ) : (
          <>
            {categories.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2.5 mb-12" role="group" aria-label="Filter articles by category">
                {[["All", publishedPosts.length] as const, ...categories].map(([cat, count]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => choose(cat)}
                    aria-pressed={selectedCategory === cat}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all click-press ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600"
                    }`}
                  >
                    {cat} <span className={selectedCategory === cat ? "text-blue-100" : "text-gray-400"}>{count}</span>
                  </button>
                ))}
              </div>
            )}

            {featured && (
              <Link
                href={`/blog/${featured.slug || featured.id}`}
                className="group grid md:grid-cols-2 bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all mb-10"
              >
                <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[360px] overflow-hidden bg-gray-100">
                  <Cover post={featured} sizes="(max-width: 768px) 100vw, 640px" priority />
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Latest · {featured.category}</p>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 leading-tight mb-4">{featured.title}</h2>
                  {featured.excerpt && <p className="text-gray-600 text-lg leading-relaxed mb-6 line-clamp-3">{featured.excerpt}</p>}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-gray-400">{postDate(featured)}</span>
                    <span className="inline-flex items-center font-bold text-blue-600 group-hover:text-blue-800">
                      Read article <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridPosts.slice(0, visible).map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i % PAGE_SIZE, 6) * 0.05 }}
                  className="flex flex-col h-full relative"
                >
                  <Link href={`/blog/${post.slug || post.id}`} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative">
                    <div className="h-52 overflow-hidden relative bg-gray-100 shrink-0">
                      <Cover post={post} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px" />
                      {post.imageUrl && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">{post.category}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-7 flex-1 flex flex-col">
                      <p className="text-sm font-bold text-gray-400 mb-3">{postDate(post)}</p>
                      <h3 className="text-xl font-bold mb-3 leading-snug text-gray-900">{post.title}</h3>
                      {post.excerpt && <p className="text-gray-600 line-clamp-3 text-sm mb-4 leading-relaxed">{post.excerpt}</p>}
                      <div className="mt-auto pt-5 border-t border-gray-100">
                        <div className="inline-flex items-center text-sm font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                          Read article <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {gridPosts.length > visible && (
              <div className="text-center mt-12">
                <button
                  type="button"
                  onClick={() => setVisible((n) => n + PAGE_SIZE)}
                  className="px-8 py-3 rounded-full bg-white border border-gray-200 text-gray-800 font-bold hover:border-blue-300 hover:text-blue-700 transition-colors click-press"
                >
                  Show more articles <span className="text-gray-400 font-medium">({gridPosts.length - visible} more)</span>
                </button>
              </div>
            )}

            <Link
              href="/success"
              className="group mt-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-gray-900 text-white p-8 md:p-10"
            >
              <div className="flex items-start gap-4">
                <Award className="w-8 h-8 text-blue-300 shrink-0" />
                <div>
                  <p className="text-xl font-bold">Looking for student outcomes?</p>
                  <p className="text-gray-300 mt-1">Read how CRI students turned their questions into publications, conference talks, awards, and admissions.</p>
                </div>
              </div>
              <span className="inline-flex items-center font-bold text-blue-300 group-hover:text-white shrink-0">
                Student Success <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
