import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a Standard Webhooks / Svix signature (what Resend sends). The secret is the dashboard
 * value starting with "whsec_"; the signed payload is "<id>.<timestamp>.<raw body>".
 */
export function verifySvixSignature(secret: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, rawBody: string, nowMs: number = Date.now(), toleranceSec = 300): boolean {
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;
  const ts = Number.parseInt(headers.timestamp, 10);
  if (!Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > toleranceSec) return false;
  let key: Buffer;
  try { key = Buffer.from(secret.replace(/^whsec_/, ""), "base64"); } catch { return false; }
  if (key.length === 0) return false;
  const expected = createHmac("sha256", key).update(`${headers.id}.${headers.timestamp}.${rawBody}`).digest();
  return headers.signature.split(/\s+/).some(part => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    let given: Buffer;
    try { given = Buffer.from(value, "base64"); } catch { return false; }
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
