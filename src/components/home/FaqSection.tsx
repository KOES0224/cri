"use client";

import Link from "@/i18n/link";
import { ChevronDown } from "lucide-react";
import { useT } from "@/i18n/client";
import { APPLICATION_FEE_ENABLED } from "@/lib/application-fee";

/** The questions families ask before applying; answers link to the pages with the full terms. */
export default function FaqSection() {
  const { t } = useT();
  return (
    <section className="relative z-10 bg-white px-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-3">{t.home.faq.title}</h2>
        <p className="text-gray-500 text-lg mb-10">{t.home.faq.intro}</p>
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {t.home.faq.items.map((item, i) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-bold text-gray-900 [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-gray-600 leading-relaxed pr-8">{i === 2 && !APPLICATION_FEE_ENABLED ? t.home.faq.costFree : item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-gray-500">
          {t.home.faq.more} <Link href="/admissions" className="font-bold text-gray-900 hover:text-blue-700 underline underline-offset-4">{t.home.faq.admissionsLink}</Link> · <Link href="/refunds" className="font-bold text-gray-900 hover:text-blue-700 underline underline-offset-4">{t.home.faq.refundsLink}</Link> · <Link href="/contact" className="font-bold text-gray-900 hover:text-blue-700 underline underline-offset-4">{t.home.faq.contactLink}</Link>
        </p>
      </div>
    </section>
  );
}
