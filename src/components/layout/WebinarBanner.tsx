"use client";

import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import Link from "@/i18n/link";
import { useT } from "@/i18n/client";
import { WEBINAR, webinarBannerVisible } from "@/lib/webinar";

const DISMISS_COOKIE = `cri_webinar_dismissed_${WEBINAR.key}`;

/**
 * Announcement strip above the navigation until the webinar day is over (src/lib/webinar.ts). The root layout decides
 * the first paint (active, not on /webinar, not dismissed) and pads the page by the strip's height through the
 * `cri-banner` class on <html>; here the visitor's clock can still switch it off, and the close button dismisses it
 * for the session with a cookie so the server agrees on the next page.
 */
export default function WebinarBanner({ initialVisible }: { initialVisible: boolean }) {
  const { t } = useT();
  const [visible, setVisible] = useState(initialVisible);
  useEffect(() => {
    // A cached page may still carry the strip after the deadline; the browser clock has the last word (deferred to
    // keep the effect free of synchronous state updates).
    if (!visible || webinarBannerVisible()) return;
    const id = window.setTimeout(() => setVisible(false), 0);
    return () => window.clearTimeout(id);
  }, [visible]);
  useEffect(() => {
    document.documentElement.classList.toggle("cri-banner", visible);
  }, [visible]);
  if (!visible) return null;
  const dismiss = () => {
    setVisible(false);
    document.cookie = `${DISMISS_COOKIE}=1; Path=/; SameSite=Lax`;
  };
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
