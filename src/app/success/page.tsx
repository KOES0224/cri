import { GraduationCap, ArrowRight, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getSuccessStoryCards } from "@/lib/public-data";
import { getDictionary, getLocale } from "@/i18n";

export const metadata: Metadata = pageMetadata({
  title: "Student Success | CRI",
  description:
    "Meet CRI students who turned their questions into research, presentations, publications, competition milestones and new academic opportunities.",
  path: "/success",
});

export default async function SuccessPage() {
  const stories = await getSuccessStoryCards();
  const t = getDictionary(await getLocale()).success;

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-xl text-gray-400 font-medium">{t.empty}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story, i) => (
              <Link href={`/success/${story.slug || story.id}`} key={story.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col relative h-full">
                <div className="h-56 bg-gray-100 relative overflow-hidden shrink-0">
                  {story.imageUrl ? (
                    <Image src={story.imageUrl} className="object-cover group-hover:scale-105 transition-transform duration-500" alt="" fill priority={i < 3} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center" aria-hidden="true">
                      <Award className="w-14 h-14 text-white/80" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="p-7 flex-1 flex flex-col">
                  <p className="text-blue-600 font-bold text-sm mb-3 flex items-start gap-1.5"><GraduationCap className="w-4 h-4 mt-0.5 shrink-0" /> {story.university}</p>
                  <h2 className="text-xl font-bold leading-snug text-gray-900 mb-4">{story.projectTitle}</h2>
                  <p className="mt-auto text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{story.name}</span>
                    {story.major && <> · {story.major}</>}
                  </p>
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <div className="inline-flex items-center text-sm font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                      {t.readStory} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-20 rounded-3xl bg-gray-900 text-white p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-2xl md:text-3xl font-bold">{t.listCtaTitle}</p>
            <p className="text-gray-300 mt-2 max-w-xl">{t.listCtaBody}</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/research" className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors click-press">{t.seePrograms}</Link>
            <Link href="/contact" className="border border-white/30 px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors click-press">{t.askAdmissions}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
