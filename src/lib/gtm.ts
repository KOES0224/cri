/**
 * Google Tag Manager — shared configuration (safe on client and server).
 *
 * Environment:
 *   NEXT_PUBLIC_GTM_ID   Container id, e.g. GTM-ABC1234. Empty or malformed = GTM off everywhere.
 *
 * The container loads only on the production hostnames, so preview deployments and localhost never fire tags.
 * GA4 (NEXT_PUBLIC_GA_ID) and the Meta Pixel are installed in code; do not add them again as GTM tags, or every
 * page view and conversion is counted twice.
 */
/** "gtm-abc123 " → "GTM-ABC123"; anything that isn't a container id (e.g. a GA4 "G-…" id) → "". */
export function parseGtmId(raw: string | undefined): string {
  const id = (raw || "").trim().toUpperCase();
  return /^GTM-[A-Z0-9]+$/.test(id) ? id : "";
}

export const GTM_ID = parseGtmId(process.env.NEXT_PUBLIC_GTM_ID);

const GTM_HOSTS = ["criglobal.org", "www.criglobal.org"];

/** True in the browser on a production hostname with a container configured. */
export function gtmEnabled(): boolean {
  return Boolean(GTM_ID) && typeof window !== "undefined" && GTM_HOSTS.includes(window.location.hostname);
}

/**
 * Queues a custom event for GTM triggers (Trigger type "Custom Event", event name = the funnel event).
 * Events pushed before the container finishes loading are processed when it does.
 */
export function pushGtmEvent(event: string, params: Record<string, string | number | boolean>) {
  if (!gtmEnabled()) return;
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer = w.dataLayer || []).push({ event, ...params });
}
