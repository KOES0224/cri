"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/i18n/config";
import { useT } from "@/i18n/client";

const LABELS: Record<Locale, string> = { en: "EN", ko: "한국어" };

/** "EN | 한국어" switch. Sets the `lang` cookie through /api/locale, then refreshes server components. */
export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, t } = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      try {
        await fetch("/api/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: next }) });
      } catch {
        return;
      }
      router.refresh();
    });
  }

  return (
    <div role="group" aria-label={t.language.label} className={`inline-flex items-center text-xs font-bold tracking-wide ${className}`}>
      {LOCALES.map((code, index) => (
        <span key={code} className="inline-flex items-center">
          {index > 0 && <span aria-hidden="true" className="mx-1.5 text-gray-300">|</span>}
          <button
            type="button"
            onClick={() => choose(code)}
            aria-pressed={locale === code}
            aria-label={t.language.switchTo[code]}
            disabled={pending}
            className={`inline-flex items-center min-h-8 px-1 rounded transition-colors disabled:opacity-60 ${locale === code ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
          >
            {LABELS[code]}
          </button>
        </span>
      ))}
    </div>
  );
}
