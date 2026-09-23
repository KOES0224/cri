/**
 * schema.org JSON-LD for search engines and AI assistants. Only facts that are visible on the page go in here;
 * professor details are deliberately left out (the faculty roster is not published as structured data).
 */
import type { Locale } from "@/i18n";
import { SITE_URL, summarize } from "@/lib/seo";
import { localizedPath } from "@/i18n/routing";
import { programFacts, seoulDay } from "@/lib/program-policy";

type Json = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Official profiles that identify CRI elsewhere on the web. Add new channels here (Instagram, YouTube, LinkedIn…). */
const SAME_AS = ["https://blog.naver.com/cri_official", "http://pf.kakao.com/_xhdzxln"];

const IN_LANGUAGE: Record<Locale, string> = { en: "en", ko: "ko" };

const abs = (path: string, locale: Locale = "en") => `${SITE_URL}${localizedPath(path, locale)}`;

/** Renders one JSON-LD block. `<` is escaped so content can never close the script tag. */
export function JsonLd({ data }: { data: Json | Json[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationJsonLd(locale: Locale, description: string): Json[] {
  const address =
    locale === "ko"
      ? { streetAddress: "논현로153길 53", addressLocality: "강남구", addressRegion: "서울특별시" }
      : { streetAddress: "53, Nonhyeon-ro 153-gil", addressLocality: "Gangnam-gu", addressRegion: "Seoul" };
  return [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "@id": ORG_ID,
      name: "CRI",
      alternateName: "CRI Global",
      legalName: "Elite Research Co., Ltd.",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      image: `${SITE_URL}/opengraph-image.png`,
      description,
      email: "support@cri.kr",
      telephone: "+82-2-6203-8999",
      address: { "@type": "PostalAddress", ...address, postalCode: "06036", addressCountry: "KR" },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "admissions",
        email: "support@cri.kr",
        telephone: "+82-2-6203-8999",
        availableLanguage: ["English", "Korean"],
        url: abs("/contact", locale),
      },
      sameAs: SAME_AS,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: "CRI",
      url: SITE_URL,
      inLanguage: ["en", "ko"],
      publisher: { "@id": ORG_ID },
    },
  ];
}

export function breadcrumbJsonLd(locale: Locale, items: Array<[name: string, path: string]>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: abs(path, locale),
    })),
  };
}

export function faqJsonLd(locale: Locale, items: Array<{ q: string; a: string }>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: IN_LANGUAGE[locale],
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

type CourseProgram = {
  id: string;
  title: string;
  description: string;
  category: string;
  tuition: number | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  locationFormat?: string | null;
  capacity?: number | null;
};

const COURSE_MODE = { seoul: ["Onsite"], global: ["Onsite"], winter: ["Online"], individual: ["Online", "Onsite"] } as const;

export function courseJsonLd(locale: Locale, program: CourseProgram, audience: string): Json {
  const facts = programFacts(program);
  const path = `/research/program/${program.id}`;
  const url = abs(path, locale);
  const start = program.startDate ? seoulDay(program.startDate) : null;
  const end = program.endDate ? seoulDay(program.endDate) : null;
  const mode = facts.kind === "other" ? undefined : COURSE_MODE[facts.kind];
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${url}#course`,
    name: program.title,
    description: summarize(program.description, 500),
    url,
    provider: { "@id": ORG_ID, "@type": "EducationalOrganization", name: "CRI", sameAs: SITE_URL },
    audience: { "@type": "EducationalAudience", educationalRole: "student", audienceType: audience },
    ...(program.tuition != null
      ? { offers: { "@type": "Offer", category: "Paid", price: program.tuition, priceCurrency: "USD", url } }
      : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      ...(mode ? { courseMode: mode } : {}),
      ...(start ? { startDate: start } : {}),
      ...(end ? { endDate: end } : {}),
      ...(facts.capacity ? { maximumAttendeeCapacity: facts.capacity } : {}),
    },
  };
}

type ArticleInput = {
  path: string;
  headline: string;
  description: string;
  image?: string | null;
  published: Date | string;
  modified: Date | string;
  /** The Korean post on CRI's Naver blog this article was adapted from. */
  basedOn?: string | null;
};

export function articleJsonLd({ path, headline, description, image, published, modified, basedOn }: ArticleInput): Json {
  const url = abs(path);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage: "en",
    ...(image ? { image: image.startsWith("/") ? `${SITE_URL}${image}` : image } : {}),
    datePublished: new Date(published).toISOString(),
    dateModified: new Date(modified).toISOString(),
    author: { "@id": ORG_ID, "@type": "Organization", name: "CRI", url: SITE_URL },
    publisher: { "@id": ORG_ID },
    ...(basedOn ? { isBasedOn: basedOn } : {}),
  };
}
