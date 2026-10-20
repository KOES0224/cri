import type { Metadata } from "next";
import Link from "@/i18n/link";
import { getDictionary, getLocale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";
import { COMPANY, companyLegalName } from "@/lib/company";
import { TERMS } from "./content";

export async function generateMetadata(): Promise<Metadata> {
  const doc = TERMS[await getLocale()];
  return pageMetadata({ title: doc.metaTitle, description: doc.description, path: "/terms", type: "website" });
}

/** 사이버몰 이용약관: the posted terms every online seller must link (전자상거래법 제10조). Text lives in ./content.ts. */
export default async function TermsPage() {
  const locale = await getLocale();
  const doc = TERMS[locale];
  const labels = getDictionary(locale).footer;
  return (
    <article className="mx-auto max-w-3xl px-6 pb-24 pt-36 text-gray-700">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{doc.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">{doc.title}</h1>
      <p className="mt-4 text-sm text-gray-500">
        {companyLegalName(locale)} · {labels.business.representative} {COMPANY.representative[locale]} · {labels.business.registration} {COMPANY.businessRegistrationNumber} · {doc.effective}
      </p>
      <div className="mt-10 space-y-8 leading-relaxed">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-bold text-gray-900">{section.heading}</h2>
            <div className="mt-2 space-y-2">{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          </section>
        ))}
      </div>
      <p className="mt-12 text-sm text-gray-600">
        {doc.contact}: <a href={`mailto:${COMPANY.email}`} className="text-blue-700 underline">{COMPANY.email}</a> · <a href={COMPANY.phoneHref} className="text-blue-700 underline">{COMPANY.phone}</a>
      </p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/privacy" className="font-semibold text-blue-700 underline">{labels.privacy}</Link>
        <Link href="/refunds" className="font-semibold text-blue-700 underline">{labels.refunds}</Link>
      </div>
    </article>
  );
}
