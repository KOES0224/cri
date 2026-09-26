/**
 * Meta Pixel + Conversions API — shared configuration and pure helpers (safe on client and server).
 *
 * Environment:
 *   NEXT_PUBLIC_META_PIXEL_ID          Pixel / dataset id (public). Empty = Meta tracking off everywhere.
 *   NEXT_PUBLIC_META_ALLOWED_HOSTS     Comma list of hostnames allowed to send events. Default: the production domains.
 *                                      Preview deployments (*.vercel.app) and localhost never match, so they send nothing.
 *   META_CAPI_ACCESS_TOKEN             Server-only Conversions API token. Empty = no server events.
 *   META_TEST_EVENT_CODE               Optional. When set, server events carry test_event_code (Events Manager → Test events).
 *   META_CAPI_ALLOW_NON_PRODUCTION     "true" lets a preview/local deployment send server events (only for testing with a test code).
 *   META_LEAD_VALUE_USD                Optional estimated value attached to Lead events (server and browser).
 *   META_SUBMIT_APPLICATION_VALUE_USD  Optional estimated value attached to SubmitApplication events.
 */
export const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").replace(/[^0-9]/g, "");

export const META_ALLOWED_HOSTS = (process.env.NEXT_PUBLIC_META_ALLOWED_HOSTS || "criglobal.org,www.criglobal.org")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

/** True only for the production hostnames. `host` may include a port. */
export function metaHostAllowed(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = host.trim().toLowerCase().split(":")[0];
  return META_ALLOWED_HOSTS.includes(bare);
}

export type MetaStandardEvent = "PageView" | "ViewContent" | "Lead" | "SubmitApplication" | "Purchase" | "CompleteRegistration" | "InitiateCheckout";
export type MetaCustomEvent = "StartApplication";
export type MetaEventName = MetaStandardEvent | MetaCustomEvent;

export type ApplicantType = "parent" | "student";
export type ApplicantRegion = "KR" | "SEA" | "NA" | "OTHER";

/** Parameters attached to conversion events (browser and server send the same object). */
export type MetaCustomData = {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  applicant_type?: ApplicantType;
  applicant_region?: ApplicantRegion;
  value?: number;
  currency?: string;
  step?: number;
  order_id?: string;
  /** CompleteRegistration: whether the sign-up succeeded. */
  status?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

const SEA = new Set(["VN", "TH", "ID", "MY", "PH", "SG", "KH", "LA", "MM", "BN", "TL"]);
const NA = new Set(["US", "CA"]);

/** Maps an ISO-3166 alpha-2 country to the ad reporting region. */
export function applicantRegion(country: string | null | undefined): ApplicantRegion | undefined {
  const cc = (country || "").trim().toUpperCase();
  if (!cc) return undefined;
  if (cc === "KR") return "KR";
  if (SEA.has(cc)) return "SEA";
  if (NA.has(cc)) return "NA";
  return "OTHER";
}

/** Portal roles map to the ad reporting applicant type. */
export function applicantTypeFromRole(role: string | null | undefined): ApplicantType | undefined {
  if (role === "PARENT") return "parent";
  if (role === "STUDENT") return "student";
  return undefined;
}

type ProfessorLike = { name: string; university?: string | null; relatedMajor?: string | null; potentialTopics?: string | null; keywords?: string | null };
type ProgramLike = { id: string; title: string; category?: string | null; subCategory?: string | null; professors?: ProfessorLike[] | null };

/** "Emory University - David McMillon - Behavioral Economics": what ads reports show per program. */
export function programContent(program: ProgramLike): Pick<MetaCustomData, "content_name" | "content_category" | "content_ids" | "content_type"> {
  const professor = program.professors?.[0];
  const field = (professor?.relatedMajor || professor?.potentialTopics?.split(/[|,]/)[0] || program.subCategory || program.category || "").trim();
  const parts = professor ? [professor.university, professor.name, field].map((p) => (p || "").trim()).filter(Boolean) : [];
  return {
    content_name: parts.length ? parts.join(" - ") : program.title,
    content_category: field || undefined,
    content_ids: [program.id],
    content_type: "product",
  };
}

function envNumber(value: string | undefined): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
/** Optional estimated values (USD) for non-purchase conversions. Server-only env; undefined when unset. */
export const META_VALUES = {
  lead: envNumber(process.env.META_LEAD_VALUE_USD),
  submitApplication: envNumber(process.env.META_SUBMIT_APPLICATION_VALUE_USD),
};

/** Drops undefined/empty values so payloads stay small and identical on both sides. */
export function cleanCustomData(data: MetaCustomData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = v;
  }
  return out;
}

/** UTM / click-id attribution captured on the first visit and carried to the conversion. */
export type Attribution = { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string; fbclid?: string; landing?: string; at?: number };
export const ATTRIBUTION_COOKIE = "cri_attr";
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90;
