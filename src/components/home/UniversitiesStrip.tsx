"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { FEATURED_UNIVERSITIES, type MentorUniversity } from "@/lib/home-data";

function Logo({ university }: { university: MentorUniversity }) {
  const [failed, setFailed] = useState(!university.logo);
  if (failed || !university.logo) {
    return <span className="text-sm md:text-base font-black tracking-wide text-gray-500 uppercase">{university.name}</span>;
  }
  return (
    <img
      src={university.logo}
      alt={university.name}
      style={{ height: university.height ?? 32 }}
      className="w-auto max-w-[150px] md:max-w-[170px] object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

/** Where the mentors teach: a fixed set of university wordmarks (see FEATURED_UNIVERSITIES). */
export default function UniversitiesStrip({ universities = FEATURED_UNIVERSITIES }: { universities?: MentorUniversity[] }) {
  const { t } = useT();
  if (universities.length === 0) return null;
  return (
    <section aria-label={t.home.universities.eyebrow} className="relative z-10 px-6 pt-16 pb-4 max-w-6xl mx-auto">
      <p className="text-center text-xs font-black uppercase tracking-widest text-gray-400 mb-7">{t.home.universities.eyebrow}</p>
      <ul className="flex flex-wrap items-center justify-center gap-x-10 md:gap-x-14 gap-y-6">
        {universities.map((u) => (
          <li key={u.name} className="flex items-center" title={u.name}>
            <Logo university={u} />
          </li>
        ))}
      </ul>
    </section>
  );
}
