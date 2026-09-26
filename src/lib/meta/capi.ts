import { after } from "next/server";
import { cookies, headers } from "next/headers";
import { META_PIXEL_ID, cleanCustomData, type MetaCustomData } from "./config";
import { ATTRIBUTION_COOKIE, META_GRAPH_VERSION, buildMetaPayload, metaCustomData, metaServerEnabled, parseAttribution, type MetaRequestContext, type MetaServerEvent } from "./payload";

export { safeEventId, buildMetaPayload, metaServerEnabled, metaCustomData } from "./payload";
export type { MetaPerson, MetaRequestContext, MetaServerEvent } from "./payload";

/**
 * Meta Conversions API (server-side events).
 * Every conversion the browser pixel reports is also sent from here with the same event_id, so Meta keeps one copy
 * and still receives it when the pixel is blocked. Personal data is normalised and SHA-256 hashed before it leaves
 * the server (see ./payload.ts); the raw values are never part of the payload.
 */
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || "";

/** Never throws: outside a request (tests, scripts) it returns a context that sends nothing. */
export async function captureMetaContext(): Promise<MetaRequestContext> {
  try {
    const [h, c] = await Promise.all([headers(), cookies()]);
    const forwarded = h.get("x-forwarded-for");
    return {
      host: h.get("x-forwarded-host") || h.get("host"),
      ip: (forwarded ? forwarded.split(",")[0] : h.get("x-real-ip"))?.trim() || null,
      userAgent: h.get("user-agent"),
      referer: h.get("referer"),
      fbp: c.get("_fbp")?.value || null,
      fbc: c.get("_fbc")?.value || null,
      attribution: parseAttribution(c.get(ATTRIBUTION_COOKIE)?.value),
      // Previews and local runs may send server events only for Test Events (a test code is required), never to live data.
      production: process.env.VERCEL_ENV === "production" || (process.env.META_CAPI_ALLOW_NON_PRODUCTION === "true" && Boolean(process.env.META_TEST_EVENT_CODE)),
    };
  } catch {
    return { host: null, ip: null, userAgent: null, referer: null, fbp: null, fbc: null, attribution: {}, production: false };
  }
}

async function post(body: Record<string, unknown>) {
  const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("Meta CAPI rejected event", response.status, text.slice(0, 300));
  }
}

/**
 * Sends one server event. Call from a server action or route handler while the request is alive.
 * The network call runs after the response is sent (`after`), so it never slows the visitor down, and failures
 * are logged rather than thrown: a saved lead or application never depends on Meta.
 */
export async function sendMetaEvent(event: MetaServerEvent, context?: MetaRequestContext): Promise<{ sent: boolean; data: MetaCustomData }> {
  try {
    const ctx = context || (await captureMetaContext());
    // Returned to the browser so its pixel call carries exactly the same parameters as the server copy.
    const data = cleanCustomData(metaCustomData(ctx, event.data)) as MetaCustomData;
    if (!metaServerEnabled(ctx)) return { sent: false, data };
    const body = buildMetaPayload(ctx, event);
    const task = () => post(body).catch((error) => console.error("Meta CAPI request failed", error instanceof Error ? error.message : error));
    try { after(task); } catch { await task(); }
    return { sent: true, data };
  } catch (error) {
    console.error("Meta CAPI skipped", error instanceof Error ? error.message : error);
    return { sent: false, data: cleanCustomData(event.data || {}) as MetaCustomData };
  }
}
