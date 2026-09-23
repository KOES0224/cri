import { getOpenPrograms } from "@/lib/open-programs";
import { getSiteContentDictionary } from "@/lib/public-data";
import HomeClient from "./HomeClient";
import { getDictionary, getLocale } from "@/i18n";
import { APPLICATION_FEE_ENABLED } from "@/lib/application-fee";
import { JsonLd, faqJsonLd } from "@/lib/structured-data";

// 30 seconds revalidation to heavily cache queries and keep site extremely fast
export const revalidate = 30;

export default async function Page() {
  const [dictionary, openPrograms] = await Promise.all([
    getSiteContentDictionary("landing"),
    getOpenPrograms(6),
  ]);

  const locale = await getLocale();
  const faq = getDictionary(locale).home.faq;
  // Same answers FaqSection shows, including the free-application variant of the cost question.
  const faqItems = faq.items.map((item, i) => (i === 2 && !APPLICATION_FEE_ENABLED ? { ...item, a: faq.costFree } : item));

  return (
    <>
      <JsonLd data={faqJsonLd(locale, faqItems)} />
      <HomeClient content={dictionary} openPrograms={openPrograms} />
    </>
  );
}
