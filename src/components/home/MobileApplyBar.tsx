"use client";

import { useEffect, useState } from "react";
import Link from "@/i18n/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/i18n/client";

/** Bottom bar on phones that appears once the visitor scrolls past the hero and hides while the programs section is on screen. */
export default function MobileApplyBar({ openCount }: { openCount: number }) {
  const { t } = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Hide while the programs section or the footer is on screen (the bar would cover the footer's legal links).
    const watched: Element[] = [document.getElementById("open-programs"), document.querySelector("footer")].filter((el): el is HTMLElement => el !== null);
    const covering = new Set<Element>();
    const update = () => setVisible(window.scrollY > window.innerHeight * 0.7 && covering.size === 0);
    const observer = new IntersectionObserver((entries) => { for (const entry of entries) { if (entry.isIntersecting) covering.add(entry.target); else covering.delete(entry.target); } update(); }, { threshold: 0.05 });
    watched.forEach((el) => observer.observe(el));
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => { window.removeEventListener("scroll", update); observer.disconnect(); };
  }, []);

  return (
    <div aria-hidden={!visible} className={`fixed bottom-0 inset-x-0 z-40 lg:hidden transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"}`}>
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{openCount > 0 ? t.home.mobileBar.openTitle(openCount) : t.home.mobileBar.closedTitle}</p>
          <p className="text-xs text-gray-500 truncate">{t.home.mobileBar.subtitle}</p>
        </div>
        <Link href="#open-programs" tabIndex={visible ? 0 : -1} className="shrink-0 inline-flex items-center h-11 px-5 rounded-xl bg-gray-900 text-white text-sm font-bold">
          {openCount > 0 ? t.home.mobileBar.apply : t.home.mobileBar.see} <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
