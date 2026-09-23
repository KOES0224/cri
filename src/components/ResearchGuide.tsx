'use client';

import Link from "@/i18n/link";
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { programFactsLocalized } from '@/lib/program-facts-i18n';
import { useT } from '@/i18n/client';

export default function ResearchGuide({ category }: { category?: string }) {
  const { t, locale } = useT();
  const copy = t.guide;
  const facts = category ? programFactsLocalized({ category }, locale) : null;
  const details = facts ? [
    { label: copy.whoFor, value: facts.audience },
    { label: copy.format, value: facts.format },
    { label: copy.professorInstruction, value: facts.professorHours },
    { label: copy.taGuidance, value: facts.taHours },
  ] : [];

  return (
    <section className="@container my-10 overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-sm" aria-label={copy.ariaLabel}>
      <div className={facts ? "grid @3xl:grid-cols-2" : "grid"}>
        <div className="p-6 sm:p-8 @3xl:p-10">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">{copy.eyebrow}</span>
          </div>
          <h2 className="max-w-lg text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">
            {copy.title1}<br />{copy.title2} <span className="inline-block text-blue-600">{copy.title3}</span>
          </h2>
          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-gray-600">
            {copy.body}
          </p>
          <Link href="/admissions" className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800">
            {copy.cta}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
          </Link>
        </div>
        {facts && (
          <div className="border-t border-gray-100 bg-gray-50/70 p-6 sm:p-8 @3xl:border-l @3xl:border-t-0 @3xl:p-10">
            <p className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">{copy.atAGlance}</p>
            <dl className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
              {details.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</dt>
                  <dd className="mt-2 text-sm font-semibold leading-relaxed text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 border-t border-gray-200/80 pt-5 text-sm leading-relaxed text-gray-500">{facts.duration}</p>
          </div>
        )}
      </div>
      <div className="border-t border-gray-100 px-6 py-4 sm:px-8 @3xl:px-10">
        <p className="max-w-4xl text-xs leading-relaxed text-gray-500">
          {copy.disclaimer}
        </p>
      </div>
    </section>
  );
}
