"use client";

import { useT } from "@/i18n/client";
import type { MentorUniversity } from "@/lib/home-data";

/** Where the mentors teach. Logos come from the professor inventory; names are the fallback. */
export default function UniversitiesStrip({ universities }: { universities: MentorUniversity[] }) {
  const { t } = useT();
  if (universities.length === 0) return null;
  return (
    <section aria-label={t.home.universities.eyebrow} className="relative z-10 px-6 pt-16 pb-4 max-w-6xl mx-auto">
      <p className="text-center text-xs font-black uppercase tracking-widest text-gray-400 mb-6">{t.home.universities.eyebrow}</p>
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
        {universities.map((u) => (
          <li key={u.name} className="flex items-center" title={u.name}>
            {u.logo ? (
              <img src={u.logo} alt={u.name} className="h-9 md:h-11 max-w-[140px] object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition" loading="lazy" />
            ) : (
              <span className="text-sm font-bold text-gray-500">{u.name}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
