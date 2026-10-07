"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import Link from "@/i18n/link";
import { useT } from "@/i18n/client";
import { WEBINAR, webinarBannerVisible } from "@/lib/webinar";
import { stripLocalePrefix } from "@/i18n/routing";

const DISMISS_KEY = `cri.webinar.dismissed.${WEBINAR.key}`;

/**
 * Site-wide strip above the navigation until the webinar day is over (src/lib/webinar.ts). Hidden on the sign-up
 * page itself and after the visitor closes it (for the session). Checks the clock in the browser too, so a cached
 * page cannot keep showing it after the deadline.
 */
export default function WebinarBanner() {
  const { t } = useT();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Decided after mount (session storage and the visitor's clock are browser-only); deferred to keep the effect pure.
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(DISMISS_KEY) === "1"; } catch {}
    const show = webinarBannerVisible() && !dismissed;
    const id = window.setTimeout(() => setVisible(show), 0);
    return () => window.clearTimeout(id);
  }, []);
  const shown = visible && stripLocalePrefix(pathname).path !== "/webinar";
  // The strip makes the fixed navigation taller; globals.css pads <main> by the same height while it is shown.
  useEffect(() => {
    document.documentElement.classList.toggle("cri-banner", shown);
    return () => document.documentElement.classList.remove("cri-banner");
  }, [shown]);
  if (!shown) return null;
  const dismiss = () => { setVisible(false); try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {} };
  return (
    <div className="h-10 bg-blue-700 text-white">
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-center gap-3 px-4 text-sm sm:px-6">
        <Link href="/webinar" className="flex min-w-0 items-center gap-2 font-semibold hover:underline">
          <span className="truncate">{t.webinar.banner.text}</span>
          <span className="inline-flex shrink-0 items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold">{t.webinar.banner.cta} <ArrowRight className="ml-1 h-3 w-3" /></span>
        </Link>
        <button type="button" onClick={dismiss} aria-label={t.webinar.banner.dismiss} className="ml-2 shrink-0 rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
