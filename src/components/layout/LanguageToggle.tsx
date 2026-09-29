"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/i18n/config";
import { useT } from "@/i18n/client";
import { isLocalizablePath, stripLocalePrefix, switchLocaleHref } from "@/i18n/routing";

const LABELS: Record<Locale, string> = { en: "EN", ko: "한국어" };

/**
 * "EN | 한국어" switch. Sets the `lang` cookie through /api/locale. Public pages then load their URL in the other
 * language (a full load, because the root layout that renders the navbar is not refetched on client navigation);
 * portal pages refresh their server components.
 */
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
      const here = window.location.pathname;
      if (isLocalizablePath(stripLocalePrefix(here).path)) {
        window.location.assign(switchLocaleHref(`${here}${window.location.search}${window.location.hash}`, next));
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
