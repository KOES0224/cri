"use client";

import { ATTRIBUTION_COOKIE, ATTRIBUTION_MAX_AGE, META_PIXEL_ID, cleanCustomData, metaHostAllowed, type Attribution, type MetaCustomData, type MetaCustomEvent, type MetaStandardEvent } from "./config";

type Fbq = ((...args: unknown[]) => void) & { loaded?: boolean };
declare global { interface Window { fbq?: Fbq; _fbq?: Fbq } }

/** Browser pixel is active only on the production hostnames with a configured pixel id. */
export function metaBrowserEnabled(): boolean {
  return typeof window !== "undefined" && Boolean(META_PIXEL_ID) && metaHostAllowed(window.location.hostname);
}

/** One id per conversion, shared by the browser and server events so Meta deduplicates them. */
export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Events fired before MetaPixel has initialised the pixel (page-level mount effects run before the layout's
 * MetaPixel effect on a hard load) wait here and are flushed right after fbq('init'). Bounded so a page that never
 * initialises the pixel cannot grow it.
 */
const pending: unknown[][] = [];
let ready = false;
const PENDING_LIMIT = 50;

function call(...args: unknown[]) {
  if (!ready || !window.fbq) { if (pending.length < PENDING_LIMIT) pending.push(args); return; }
  try { window.fbq(...args); } catch {}
}

/** Called by MetaPixel once the pixel is initialised; replays anything fired earlier in this page load. */
export function markMetaReady() {
  ready = true;
  const queued = pending.splice(0, pending.length);
  for (const args of queued) call(...args);
}

/** Standard event with a dedup id. No-op when the pixel is not active. */
export function metaTrack(event: MetaStandardEvent, data: MetaCustomData = {}, eventId?: string) {
  if (!metaBrowserEnabled()) return;
  call("track", event, cleanCustomData(data), eventId ? { eventID: eventId } : undefined);
}

/** Custom event (StartApplication) with a dedup id. */
export function metaTrackCustom(event: MetaCustomEvent, data: MetaCustomData = {}, eventId?: string) {
  if (!metaBrowserEnabled()) return;
  call("trackCustom", event, cleanCustomData(data), eventId ? { eventID: eventId } : undefined);
}

export function metaPageView(eventId?: string) {
  if (!metaBrowserEnabled()) return;
  call("track", "PageView", {}, eventId ? { eventID: eventId } : undefined);
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Runs on every page load: turns a `fbclid` in the URL into the `_fbc` cookie Meta expects
 * (fb.1.<ms timestamp>.<fbclid>) when the pixel has not set one, and stores first-touch UTM
 * parameters for 90 days so the conversion can report which campaign brought the visitor.
 */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  // A new click id replaces the stored one (Meta's pixel does the same once it has loaded).
  if (fbclid && !(readCookie("_fbc") || "").endsWith(`.${fbclid}`)) writeCookie("_fbc", `fb.1.${Date.now()}.${fbclid}`, ATTRIBUTION_MAX_AGE);

  const utm: Attribution = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const) {
    const v = params.get(key); if (v) utm[key] = v.slice(0, 200);
  }
  if (fbclid) utm.fbclid = fbclid.slice(0, 200);
  const hasNew = Object.keys(utm).length > 0;
  if (!hasNew) return;
  // First touch wins: stored fields are never overwritten, but fields the first visit lacked (e.g. a bare fbclid
  // landing followed later by a tagged campaign link) are filled in.
  let stored: Attribution = {};
  try { stored = JSON.parse(readCookie(ATTRIBUTION_COOKIE) || "{}") as Attribution; } catch {}
  const merged: Attribution = { ...utm, ...stored };
  if (JSON.stringify(merged) === JSON.stringify(stored)) return;
  if (!merged.landing) merged.landing = window.location.pathname;
  if (!merged.at) merged.at = Date.now();
  writeCookie(ATTRIBUTION_COOKIE, JSON.stringify(merged), ATTRIBUTION_MAX_AGE);
}

/** UTM fields to attach to a conversion's custom data. */
export function attributionCustomData(): Pick<MetaCustomData, "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term"> {
  try {
    const raw = readCookie(ATTRIBUTION_COOKIE);
    if (!raw) return {};
    const a = JSON.parse(raw) as Attribution;
    return { utm_source: a.utm_source, utm_medium: a.utm_medium, utm_campaign: a.utm_campaign, utm_content: a.utm_content, utm_term: a.utm_term };
  } catch { return {}; }
}
