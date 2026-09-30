import { SITE_URL } from "@/lib/site";

/** The site stores the PDF path as /api/documents/<id>; emails and exports need a full address. */
export function absoluteResumeUrl(resumeUrl: unknown): string {
  const value = typeof resumeUrl === "string" ? resumeUrl.trim() : "";
  if (!value) return "";
  return value.startsWith("/") ? `${SITE_URL}${value}` : value;
}

/** Document id from the stored path, or null for anything else. */
export function resumeDocumentId(resumeUrl: unknown): string | null {
  const match = typeof resumeUrl === "string" ? /^\/api\/documents\/([a-z0-9]+)$/.exec(resumeUrl.trim()) : null;
  return match ? match[1] : null;
}
