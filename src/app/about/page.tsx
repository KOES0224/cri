import type { Metadata } from "next";
import Link from "@/i18n/link";
import { ArrowRight } from "lucide-react";
import { getLocale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, aboutPageJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { ABOUT } from "./content";

export async function generateMetadata(): Promise<Metadata> {
  const doc = ABOUT[await getLocale()];
  return pageMetadata({ title: doc.metaTitle, description: doc.description, path: "/about", card: "about" });
}

/** Who CRI is, in the owner's words. Copy lives in ./content.ts; keep it in step with llms.txt and the organization JSON-LD. */
export default async function AboutPage() {
  const locale = await getLocale();
  const doc = ABOUT[locale];
  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <JsonLd
        data={[
          aboutPageJsonLd(locale, { name: doc.metaTitle, description: doc.description, path: "/about" }),
          breadcrumbJsonLd(locale, [["CRI", "/"], [doc.title, "/about"]]),
        ]}
      />
      <article className="mx-auto max-w-3xl px-6 text-gray-700">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{doc.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">{doc.title}</h1>
          <p className="mt-6 text-xl leading-relaxed text-gray-600">{doc.lead}</p>
        </header>

        <section className="mt-16" aria-labelledby="about-story">
          <h2 id="about-story" className="text-2xl font-black tracking-tight text-gray-900">{doc.story.heading}</h2>
          <div className="mt-4 space-y-4 text-lg leading-relaxed">
            {doc.story.body.map((p) => <p key={p}>{p}</p>)}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="about-middle">
          <h2 id="about-middle" className="text-2xl font-black tracking-tight text-gray-900">{doc.middle.heading}</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-[1fr_1.4fr_1fr]">
            {doc.middle.stages.map((stage) => (
              <li
                key={stage.label}
                className={
                  stage.core
                    ? "rounded-2xl bg-gray-900 p-5 text-white shadow-lg"
                    : "rounded-2xl border border-gray-200 bg-white p-5"
                }
              >
                <p className={`text-xs font-bold uppercase tracking-widest ${stage.core ? "text-blue-300" : "text-gray-400"}`}>{stage.label}</p>
                <p className={`mt-2 text-lg font-bold ${stage.core ? "text-white" : "text-gray-900"}`}>{stage.title}</p>
                <p className={`mt-1 text-sm leading-relaxed ${stage.core ? "text-gray-300" : "text-gray-500"}`}>{stage.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 space-y-4 text-lg leading-relaxed">
            {doc.middle.body.map((p) => <p key={p}>{p}</p>)}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="about-teaching">
          <h2 id="about-teaching" className="text-2xl font-black tracking-tight text-gray-900">{doc.teaching.heading}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {doc.teaching.points.map((point) => (
              <li key={point.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="font-bold text-gray-900">{point.title}</p>
                <p className="mt-2 leading-relaxed text-gray-600">{point.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="about-goal">
          <h2 id="about-goal" className="text-2xl font-black tracking-tight text-gray-900">{doc.goal.heading}</h2>
          <div className="mt-4 space-y-4 text-lg leading-relaxed">
            {doc.goal.body.map((p) => <p key={p}>{p}</p>)}
          </div>
        </section>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/research" className="inline-flex items-center rounded-xl bg-gray-900 px-6 py-3 font-bold text-white hover:bg-black transition-colors click-press">
            {doc.ctaPrograms} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/success" className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-bold text-gray-900 hover:border-blue-300 hover:text-blue-700 transition-colors click-press">
            {doc.ctaStories}
          </Link>
        </div>
      </article>
    </div>
  );
}
