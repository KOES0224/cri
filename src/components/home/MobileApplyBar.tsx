"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/i18n/client";

/** Bottom bar on phones that appears once the visitor scrolls past the hero and hides while the programs section is on screen. */
export default function MobileApplyBar({ openCount }: { openCount: number }) {
  const { t } = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("open-programs");
    let overPrograms = false;
    const update = () => setVisible(window.scrollY > window.innerHeight * 0.7 && !overPrograms);
    const observer = target ? new IntersectionObserver(([entry]) => { overPrograms = entry.isIntersecting; update(); }, { threshold: 0.15 }) : null;
    if (target && observer) observer.observe(target);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => { window.removeEventListener("scroll", update); observer?.disconnect(); };
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
