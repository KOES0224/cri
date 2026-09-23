import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, GraduationCap, User } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { getSuccessStory, getSuccessStoryCards } from "@/lib/public-data";
import { pageMetadata, summarize } from "@/lib/seo";
import { getDictionary, getLocale } from "@/i18n";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = await getSuccessStory((await params).slug);
  if (!story) return {};
  return pageMetadata({
    title: `${story.projectTitle} | Student Success | CRI`,
    description: summarize(`${story.university}. ${story.description ?? ""}`),
    path: `/success/${story.slug || story.id}`,
    image: story.imageUrl,
  });
}

export default async function SuccessStoryPage({ params }: Props) {
  const { slug } = await params;
  const story = await getSuccessStory(slug);
  if (!story) return notFound();

  const naverSource = story.externalLink?.includes("blog.naver.com");
  const locale = await getLocale();
  const t = getDictionary(locale).success;
  const more = (await getSuccessStoryCards()).filter((s) => s.id !== story.id).slice(0, 3);

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/success" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.back}
        </Link>

        <p className="flex w-fit items-start gap-2 font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-2xl mb-6">
          <GraduationCap className="w-5 h-5 mt-0.5 shrink-0" /> {story.university}
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6 leading-[1.1]">{story.projectTitle}</h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-600 mb-10">
          <span className="inline-flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> <span className="font-semibold text-gray-800">{story.name}</span></span>
          {story.major && <span className="inline-flex items-center gap-2"><BookOpen className="w-4 h-4 text-gray-400" /> {story.major}</span>}
        </div>
        {locale === "ko" && naverSource && story.externalLink && (
          <p className="-mt-4 mb-8 text-sm text-gray-600">
            {t.koreanOriginalNote}{" "}
            <a href={story.externalLink} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline">{t.koreanOriginal} →</a>
          </p>
        )}

        {story.imageUrl && (
          <div className="relative w-full aspect-[16/9] mb-10 rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-gray-100">
            <Image src={story.imageUrl} alt="" fill priority sizes="(max-width: 896px) 100vw, 896px" className="object-cover object-[50%_30%]" referrerPolicy="no-referrer" />
          </div>
        )}

        {story.description && (
          <article aria-label="Student story" className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-10 sm:px-10 md:px-16 md:py-14">
            <MarkdownRenderer content={story.description} className="mx-auto max-w-[44rem]" />
          </article>
        )}

        {story.externalLink && (
          <div className="mt-8 text-sm text-gray-500">
            <a href={story.externalLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-gray-900 underline-offset-4 hover:underline">
              {naverSource ? t.koreanOriginal : t.viewResearch} <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        <div className="mt-10 rounded-3xl bg-gray-900 text-white p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-2xl font-bold">{t.storyCtaTitle}</p>
            <p className="text-gray-300 mt-2">{t.storyCtaBody}</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/research" className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors click-press">{t.seePrograms}</Link>
            <Link href="/contact" className="border border-white/30 px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors click-press">{t.askAdmissions}</Link>
          </div>
        </div>

        {more.length > 0 && (
          <section className="mt-20" aria-labelledby="more-heading">
            <h2 id="more-heading" className="text-2xl font-black tracking-tight text-gray-900 mb-6">{t.moreStories}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {more.map((item) => (
                <Link key={item.id} href={`/success/${item.slug || item.id}`} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col">
                  <div className="relative h-36 bg-gradient-to-br from-blue-600 to-indigo-800 overflow-hidden">
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 300px" className="object-cover group-hover:scale-105 transition-transform duration-500" />}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-xs font-bold text-blue-600 mb-2 line-clamp-1">{item.university}</p>
                    <p className="font-bold text-gray-900 leading-snug mb-3">{item.projectTitle}</p>
                    <span className="mt-auto inline-flex items-center text-sm font-bold text-blue-600">
                      {t.read} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
