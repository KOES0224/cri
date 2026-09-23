import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { curatedPosts } from "@/lib/curated-blog";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Query db prioritizing custom slug, fallback to cuid ID
  let post = await prisma.post.findUnique({
    where: { slug: slug }
  });

  if (!post) {
    post = await prisma.post.findUnique({
      where: { id: slug }
    });
  }

  if (!post) {
    const curated = curatedPosts.find((candidate) => candidate.slug === slug || candidate.id === slug);
    if (!curated) return notFound();
    post = {
      ...curated,
      publishedAt: new Date(curated.publishedAt),
      createdAt: new Date(curated.createdAt),
      eventDate: null,
      updatedAt: new Date(curated.createdAt),
    };
  }
  if (!post) return notFound();
  const resolvedPost = post;

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/blog" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to all articles
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6 leading-[1.1]">{resolvedPost.title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-10">
          <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{resolvedPost.category}</span>
          <span className="font-medium">{resolvedPost.author}</span>
          <span>•</span>
          <span>{resolvedPost.publishedAt ? format(new Date(resolvedPost.publishedAt), 'MMMM d, yyyy') : format(new Date(resolvedPost.createdAt), 'MMMM d, yyyy')}</span>
        </div>

        {resolvedPost.imageUrl && (
           <div className="relative w-full aspect-[4/3] md:aspect-[16/9] mb-12 rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
             <Image src={resolvedPost.imageUrl} alt={resolvedPost.title} fill sizes="(max-width: 896px) 100vw, 896px" className="object-contain" unoptimized referrerPolicy="no-referrer" />
           </div>
        )}

        <article aria-label="Article">
          <MarkdownRenderer content={resolvedPost.content} className="bg-white p-6 sm:p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm mt-8" />
        </article>

        {resolvedPost.externalLink && (
           <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
             <a 
               href={resolvedPost.externalLink} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-gray-900"
             >
               {resolvedPost.id.startsWith("naver-") ? "Source: CRI’s original Korean article" : "Related publication"} <ExternalLink className="w-4 h-4" />
             </a>
           </div>
        )}
      </div>
    </div>
  );
}
