import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed links that let one registrant add a phone number to their own webinar sign-up (from the success screen or
 * the follow-up email) without an account. The token is an HMAC of the registration id with NEXTAUTH_SECRET.
 */
function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET is not set");
  return value;
}

export function webinarPhoneToken(registrationId: string): string {
  return createHmac("sha256", secret()).update(`webinar-phone:${registrationId}`).digest("base64url").slice(0, 32);
}

export function webinarPhoneTokenValid(registrationId: string, token: string | null | undefined): boolean {
  if (!registrationId || !token) return false;
  const expected = Buffer.from(webinarPhoneToken(registrationId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function webinarPhoneLink(siteUrl: string, registrationId: string): string {
  return `${siteUrl.replace(/\/$/, "")}/webinar/phone?r=${encodeURIComponent(registrationId)}&t=${webinarPhoneToken(registrationId)}`;
}
