import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/i18n/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import EditorialCover from "@/components/EditorialCover";
import { getPost, getPublishedPostCards } from "@/lib/public-data";
import { pageMetadata, summarize } from "@/lib/seo";
import { JsonLd, articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { getDictionary, getLocale } from "@/i18n";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return pageMetadata({
    title: `${post.title} | CRI`,
    description: summarize(post.excerpt || post.content),
    path: `/blog/${post.slug || post.id}`,
    image: post.imageUrl,
    type: "article",
  });
}

function readingMinutes(markdown: string) {
  const words = markdown.replace(/!\[[^\]]*\]\([^)]*\)/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return notFound();

  const locale = await getLocale();
  const t = getDictionary(locale).blog;
  const label = (category: string) => t.categories[category] ?? category;
  const date = format(new Date(post.publishedAt ?? post.createdAt), t.dateFormat);
  const naverSource = post.externalLink?.includes("blog.naver.com");
  const related = (await getPublishedPostCards())
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  const path = `/blog/${post.slug || post.id}`;
  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <JsonLd
        data={[
          articleJsonLd({
            path,
            headline: post.title,
            description: summarize(post.excerpt || post.content),
            image: post.imageUrl,
            published: post.publishedAt ?? post.createdAt,
            modified: post.updatedAt,
            basedOn: naverSource ? post.externalLink : null,
          }),
          breadcrumbJsonLd(locale, [["CRI", "/"], [t.title, "/blog"], [post.title, path]]),
        ]}
      />
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/blog" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.back}
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6">
          <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{label(post.category)}</span>
          <span>{date}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {t.minutesRead(readingMinutes(post.content))}</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6 leading-[1.1]">{post.title}</h1>
        {post.excerpt && <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-3xl">{post.excerpt}</p>}
        {locale === "ko" && naverSource && post.externalLink && (
          <p className="-mt-4 mb-8 text-sm text-gray-600">
            {t.koreanOriginalNote}{" "}
            <a href={post.externalLink} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline">{t.koreanOriginal} →</a>
          </p>
        )}

        <div className="relative w-full aspect-[16/9] mb-10 rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-gray-100">
          {post.imageUrl ? (
            <Image src={post.imageUrl} alt="" fill priority sizes="(max-width: 896px) 100vw, 896px" className="object-cover" referrerPolicy="no-referrer" />
          ) : (
            <EditorialCover category={post.category} label={label(post.category)} size="hero" />
          )}
        </div>

        <article aria-label="Article" className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-10 sm:px-10 md:px-16 md:py-14">
          <MarkdownRenderer content={post.content} className="mx-auto max-w-[44rem]" />

          {post.externalLink && (
            <div className="mx-auto max-w-[44rem] mt-12 pt-6 border-t border-gray-100 text-sm text-gray-500">
              <a href={post.externalLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-gray-900 underline-offset-4 hover:underline">
                {naverSource ? t.koreanOriginal : t.relatedPublication} <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </article>

        <div className="mt-10 rounded-3xl bg-gray-900 text-white p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-2xl font-bold">{t.ctaTitle}</p>
            <p className="text-gray-300 mt-2">{t.ctaBody}</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/research" className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors click-press">{t.seePrograms}</Link>
            <Link href="/contact" className="border border-white/30 px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors click-press">{t.askAdmissions}</Link>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-2xl font-black tracking-tight text-gray-900 mb-6">{t.moreIn(label(post.category))}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link key={item.id} href={`/blog/${item.slug || item.id}`} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col">
                  <div className="relative h-36 bg-gray-100 overflow-hidden">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 300px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <EditorialCover category={item.category} label={label(item.category)} />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="font-bold text-gray-900 leading-snug mb-3">{item.title}</p>
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
