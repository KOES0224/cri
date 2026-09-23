"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Background media for the hero. The poster paints immediately; the video is only fetched on
 * desktop-sized screens, after the page is idle, and never when the visitor asked to save data.
 * The current hero-bg.mp4 is ~70 MB, so loading it eagerly made every first visit feel slow.
 */
export default function HeroVideo({ src, poster = "/hero-poster.jpg", className = "" }: { src: string; poster?: string; className?: string }) {
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = connection?.saveData || /(^|[^4])2g|3g/.test(connection?.effectiveType || "");
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!wide || slow || reduce) return;
    const start = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(start, 1500);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (ready) ref.current?.play().catch(() => {});
  }, [ready]);

  return (
    <video
      ref={ref}
      autoPlay={ready}
      loop
      muted
      playsInline
      preload="none"
      poster={poster}
      className={className}
    >
      {ready && <source src={src} type="video/mp4" />}
    </video>
  );
}
