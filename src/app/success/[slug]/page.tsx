import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { curatedSuccessStories } from "@/lib/curated-blog";

export default async function SuccessStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let story = await prisma.successStory.findUnique({
    where: { slug: slug }
  });

  if (!story) {
    story = await prisma.successStory.findUnique({
      where: { id: slug }
    });
  }

  if (!story) {
    const curated = curatedSuccessStories.find((candidate) => candidate.slug === slug || candidate.id === slug);
    if (!curated) return notFound();
    story = {
      ...curated,
      createdAt: new Date(curated.createdAt),
      updatedAt: new Date(curated.updatedAt),
    };
  }

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/success" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to all success stories
        </Link>
        
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          {story.imageUrl ? (
             <div className="relative w-full aspect-[4/3] md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-sm border border-gray-100 shrink-0 bg-white">
               <Image src={story.imageUrl} alt={story.projectTitle} fill sizes="(max-width: 768px) 100vw, 192px" className="object-contain" unoptimized referrerPolicy="no-referrer" />
             </div>
          ) : (
             <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden shadow-sm border border-gray-100 shrink-0 flex items-center justify-center bg-gray-200">
               <Image src={`https://api.dicebear.com/7.x/notionists/svg?seed=${story.name}&backgroundColor=e2e8f0`} alt={story.name} fill className="object-cover" unoptimized={true} />
             </div>
          )}
          
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4 leading-[1.1]">{story.name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <span className="font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" /> {story.university}
              </span>
              <span className="font-medium bg-gray-100 px-4 py-2 rounded-full text-gray-700">Major: {story.major}</span>
              <span className="text-gray-400">Reported {format(new Date(story.createdAt), 'yyyy')}</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Research Profile</h2>
            <p className="text-xl text-gray-600 font-medium leading-relaxed bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              {story.projectTitle}
            </p>
          </div>
        </div>

        {story.description && (
             <article aria-label="Student story">
               <MarkdownRenderer content={story.description} className="bg-white p-6 sm:p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm mt-12" />
             </article>
        )}

        {story.externalLink && (
           <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
             <a 
               href={story.externalLink} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-gray-900"
             >
               {story.id.startsWith("success-") ? "Source: CRI’s original Korean article" : "Related publication"} <ExternalLink className="w-4 h-4" />
             </a>
           </div>
        )}
      </div>
    </div>
  );
}
