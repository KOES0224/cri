import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, GraduationCap } from "lucide-react";
import { format } from "date-fns";

export default async function SuccessStoryPage({ params }: { params: { slug: string } }) {
  let story = await prisma.successStory.findUnique({
    where: { slug: params.slug }
  });

  if (!story) {
    story = await prisma.successStory.findUnique({
      where: { id: params.slug }
    });
  }

  if (!story) return notFound();

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/success" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to all success stories
        </Link>
        
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          {story.imageUrl ? (
             <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden shadow-sm border border-gray-100 shrink-0">
               <Image src={story.imageUrl} alt={story.name} fill className="object-cover" unoptimized={true} />
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
              <span className="text-gray-400">Accepted {format(new Date(story.createdAt), 'yyyy')}</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Research Profile</h2>
            <p className="text-xl text-gray-600 font-medium leading-relaxed bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              {story.projectTitle}
            </p>
          </div>
        </div>

        {story.description && (
          <div className="prose prose-lg prose-blue max-w-none text-gray-700 font-medium leading-relaxed bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm mt-12">
             <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">The Journey</h3>
             {story.description.split('\n').map((line, i) => (
               line.trim() ? <p key={i}>{line}</p> : <br key={i} />
             ))}
          </div>
        )}

        {story.externalLink && (
           <div className="mt-16 pt-8 border-t border-gray-200 text-center md:text-left">
             <a 
               href={story.externalLink} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors inline-flex items-center w-full sm:w-auto justify-center shadow-lg hover:shadow-xl hover:-translate-y-1"
             >
               View Published Research <ExternalLink className="w-5 h-5 ml-3" />
             </a>
           </div>
        )}
      </div>
    </div>
  );
}
