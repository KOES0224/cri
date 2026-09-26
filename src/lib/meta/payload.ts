/**
 * Pure half of the Conversions API client: request-context shape, payload construction and validation.
 * No Next.js imports, so unit tests can exercise it directly. Sending lives in ./capi.ts.
 */
import { ATTRIBUTION_COOKIE, META_PIXEL_ID, cleanCustomData, metaHostAllowed, type Attribution, type MetaCustomData, type MetaEventName } from "./config";
import { hashed, normalizeCountry, normalizeEmail, normalizeName, normalizePhone } from "./normalize";

const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || "";
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "";
export const META_GRAPH_VERSION = "v21.0";
export { ATTRIBUTION_COOKIE };

export type MetaPerson = {
  email?: string | null;
  phone?: string | null;
  /** ISO-3166 alpha-2 residence country, used both as a matching key and for the phone dialling code. */
  country?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** Internal user id; hashed before sending. */
  externalId?: string | null;
};

export type MetaServerEvent = {
  name: MetaEventName;
  /** Shared with the browser pixel call for deduplication. */
  eventId?: string | null;
  person?: MetaPerson;
  data?: MetaCustomData;
  /** Page the visitor was on; defaults to the request referer. */
  sourceUrl?: string | null;
};

/** Request facts captured while the request is alive (headers/cookies cannot be read from a background task). */
export type MetaRequestContext = {
  host: string | null;
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
  fbp: string | null;
  fbc: string | null;
  /** First-touch UTM parameters captured by the pixel component (cri_attr cookie). */
  attribution: Attribution;
  production: boolean;
};

/** True when this deployment and request may send server events. Test and preview hosts never do. */
export function metaServerEnabled(ctx: MetaRequestContext): boolean {
  return Boolean(META_PIXEL_ID && ACCESS_TOKEN && ctx.production && metaHostAllowed(ctx.host));
}

export function parseAttribution(raw: string | undefined): Attribution {
  if (!raw) return {};
  try {
    const a = JSON.parse(raw) as Attribution;
    const pick = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 200) : undefined);
    return { utm_source: pick(a.utm_source), utm_medium: pick(a.utm_medium), utm_campaign: pick(a.utm_campaign), utm_content: pick(a.utm_content), utm_term: pick(a.utm_term) };
  } catch { return {}; }
}

/** The custom_data both sides report: event parameters plus the stored campaign attribution. */
export function metaCustomData(ctx: MetaRequestContext, data: MetaCustomData = {}): MetaCustomData {
  const { utm_source, utm_medium, utm_campaign, utm_content, utm_term } = ctx.attribution;
  return { utm_source, utm_medium, utm_campaign, utm_content, utm_term, ...data };
}

const EVENT_ID = /^[A-Za-z0-9._:_-]{8,64}$/;
/** Browser-supplied ids are opaque; anything unusual is dropped rather than forwarded. */
export function safeEventId(value: unknown): string | undefined {
  return typeof value === "string" && EVENT_ID.test(value) ? value : undefined;
}

/** Builds the Conversions API request body. Pure, so tests can assert on it; hashes are computed here. */
export function buildMetaPayload(ctx: MetaRequestContext, event: MetaServerEvent, now = Date.now()) {
  const p = event.person || {};
  const country = normalizeCountry(p.country);
  const user_data: Record<string, unknown> = {
    em: hashed(normalizeEmail(p.email)),
    ph: hashed(normalizePhone(p.phone, p.country)),
    fn: hashed(normalizeName(p.firstName)),
    ln: hashed(normalizeName(p.lastName)),
    country: hashed(country),
    external_id: hashed(p.externalId ? String(p.externalId).trim() : undefined),
    client_ip_address: ctx.ip || undefined,
    client_user_agent: ctx.userAgent || undefined,
    fbp: ctx.fbp || undefined,
    fbc: ctx.fbc || undefined,
  };
  for (const key of Object.keys(user_data)) if (user_data[key] === undefined) delete user_data[key];
  const custom_data = cleanCustomData(metaCustomData(ctx, event.data));
  const body: Record<string, unknown> = {
    data: [{
      event_name: event.name,
      event_time: Math.floor(now / 1000),
      event_id: event.eventId || undefined,
      event_source_url: event.sourceUrl || ctx.referer || undefined,
      action_source: "website",
      user_data,
      ...(Object.keys(custom_data).length ? { custom_data } : {}),
    }],
  };
  if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE;
  return body;
}

