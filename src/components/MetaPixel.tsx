"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { META_PIXEL_ID } from "@/lib/meta/config";
import { captureAttribution, metaBrowserEnabled, metaPageView, newEventId } from "@/lib/meta/pixel";

/**
 * Meta Pixel loader. Renders nothing and does nothing unless the page is served from a production hostname
 * (see NEXT_PUBLIC_META_ALLOWED_HOSTS), so preview deployments and localhost send no events.
 * - Waits for the session so a signed-in visitor's email and user id can be passed as advanced-matching keys
 *   (the pixel hashes them in the browser before sending).
 * - Fires PageView with the real path on every client-side navigation, each with its own event id.
 * - Persists fbclid as the `_fbc` cookie and first-touch UTM parameters (90 days) for the conversion events.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const initialised = useRef(false);
  const lastPage = useRef<string>("");

  useEffect(() => {
    if (!metaBrowserEnabled() || status === "loading") return;
    if (!initialised.current) {
      initialised.current = true;
      captureAttribution();
      loadPixel();
      const matching: Record<string, string> = {};
      if (session?.user?.email) matching.em = session.user.email.trim().toLowerCase();
      if (session?.user?.id) matching.external_id = session.user.id;
      window.fbq?.("init", META_PIXEL_ID, matching);
    }
    const page = `${pathname}?${searchParams.toString()}`;
    if (page === lastPage.current) return;
    lastPage.current = page;
    captureAttribution();
    metaPageView(newEventId());
  }, [pathname, searchParams, status, session?.user?.email, session?.user?.id]);

  return null;
}

/** The official snippet, inlined so it only runs after the host check passed. */
function loadPixel() {
  if (window.fbq) return;
  const f = window as Window & { fbq?: unknown; _fbq?: unknown };
  const n = function (this: unknown, ...args: unknown[]) {
    const self = n as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] };
    if (self.callMethod) self.callMethod.apply(n, args); else self.queue.push(args);
  } as unknown as { (...args: unknown[]): void; push: unknown; loaded: boolean; version: string; queue: unknown[]; callMethod?: unknown };
  if (!f._fbq) f._fbq = n;
  n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
  f.fbq = n;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}
