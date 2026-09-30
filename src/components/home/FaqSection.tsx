"use client";

import Link from "@/i18n/link";
import { ChevronDown } from "lucide-react";
import { useT } from "@/i18n/client";
import { APPLICATION_FEE_ENABLED } from "@/lib/application-fee";

/** The questions families ask before applying; answers link to the pages with the full terms. Two columns on wide screens keep the page short. */
export default function FaqSection() {
  const { t } = useT();
  return (
    <section className="relative z-10 bg-white px-6 py-20 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-700">{t.home.faq.eyebrow}</p>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">{t.home.faq.title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">{t.home.faq.intro}</p>
          <p className="mt-6 text-sm leading-relaxed text-gray-500">
            {t.home.faq.more} <Link href="/admissions" className="font-bold text-gray-900 underline underline-offset-4 hover:text-blue-700">{t.home.faq.admissionsLink}</Link> · <Link href="/refunds" className="font-bold text-gray-900 underline underline-offset-4 hover:text-blue-700">{t.home.faq.refundsLink}</Link> · <Link href="/contact" className="font-bold text-gray-900 underline underline-offset-4 hover:text-blue-700">{t.home.faq.contactLink}</Link>
          </p>
        </div>
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {t.home.faq.items.map((item, i) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-bold text-gray-900 [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 pr-8 leading-relaxed text-gray-600">{i === 2 && !APPLICATION_FEE_ENABLED ? t.home.faq.costFree : item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
