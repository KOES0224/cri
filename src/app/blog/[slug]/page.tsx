import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import MarkdownRenderer from "@/components/MarkdownRenderer";

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

  if (!post) return notFound();

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/blog" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to all articles
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6 leading-[1.1]">{post.title}</h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-10">
          <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{post.category}</span>
          <span className="font-medium">{post.author}</span>
          <span>•</span>
          <span>{post.publishedAt ? format(new Date(post.publishedAt), 'MMMM d, yyyy') : format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
        </div>

        {post.imageUrl && (
           <div className="relative w-full h-[400px] mb-12 rounded-3xl overflow-hidden shadow-sm border border-gray-100">
             <Image src={post.imageUrl} alt={post.title} fill className="object-cover" unoptimized={true} />
           </div>
        )}

        <MarkdownRenderer content={post.content} className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm mt-8" />

        {post.externalLink && (
           <div className="mt-16 pt-8 border-t border-gray-200">
             <a 
               href={post.externalLink} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors inline-flex items-center w-full sm:w-auto justify-center click-press"
             >
               Read the full Original Publication <ExternalLink className="w-5 h-5 ml-3" />
             </a>
           </div>
        )}
      </div>
    </div>
  );
}
