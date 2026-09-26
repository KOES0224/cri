"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { META_PIXEL_ID } from "@/lib/meta/config";
import { captureAttribution, markMetaReady, metaBrowserEnabled, metaPageView, newEventId } from "@/lib/meta/pixel";

/** Advanced-matching keys for a signed-in visitor: SHA-256 hashes computed on the server from the session (the pixel passes hashed values through). */
export type MetaMatching = { em?: string; external_id?: string };

/**
 * Meta Pixel loader. Renders nothing and does nothing unless the page is served from a production hostname
 * (see NEXT_PUBLIC_META_ALLOWED_HOSTS), so preview deployments and localhost send no events.
 * - Initialises on the first effect (no waiting on client-side session fetches) with the matching keys the
 *   layout passed in, then flushes events that page components fired before this effect ran.
 * - Fires PageView with the real path on every client-side navigation, each with its own event id.
 * - Persists fbclid as the `_fbc` cookie and first-touch UTM parameters (90 days) for the conversion events.
 */
export default function MetaPixel({ matching }: { matching?: MetaMatching }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialised = useRef(false);
  const lastPage = useRef<string>("");

  useEffect(() => {
    if (!metaBrowserEnabled()) return;
    if (!initialised.current) {
      initialised.current = true;
      captureAttribution();
      loadPixel();
      const keys: Record<string, string> = {};
      if (matching?.em) keys.em = matching.em;
      if (matching?.external_id) keys.external_id = matching.external_id;
      window.fbq?.("init", META_PIXEL_ID, keys);
      markMetaReady();
    }
    // The payment provider returns with its payment reference in the query string; the page removes it first
    // (see apply/payment-success), and the PageView fires once the address is clean.
    if (searchParams.has("paymentKey")) return;
    const page = `${pathname}?${searchParams.toString()}`;
    if (page === lastPage.current) return;
    lastPage.current = page;
    captureAttribution();
    metaPageView(newEventId());
  }, [pathname, searchParams, matching?.em, matching?.external_id]);

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
