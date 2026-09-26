# Meta Pixel + Conversions API

Pixel / dataset id `2270683237022393`. Code lives in `src/lib/meta/` and `src/components/MetaPixel.tsx`.

## What fires where

| Event | Browser (pixel) | Server (CAPI) | Where |
| --- | --- | --- | --- |
| PageView | every route change, real path | – | `MetaPixel` |
| ViewContent | program detail | – | `TrackProgramView` |
| StartApplication (custom, `step` 1–3) | apply form opened / step advanced | – | `ApplyClient` |
| CompleteRegistration | sign-up (credentials + Google onboarding) | `/api/auth/register`, `/api/auth/onboard` | same `eventId` |
| Lead | contact form success | `submitContactForm` | same `eventId` |
| InitiateCheckout | Toss window requested | `beginApplicationCheckout` | same `eventId` |
| SubmitApplication | free submission success | `submitApplicationWithoutFee` | same `eventId` |
| Purchase | payment-success page | `finalizePaidApplication` | `eventId` = Toss order id (stable across reloads) |

The server action computes the parameters (`content_name` = "University - Professor - Field", `content_category`, `applicant_type`, `applicant_region`, `value`/`currency`, first-touch UTM) and returns them as `tracking`; the browser fires the pixel event with that object and the same `eventId`, so both copies are identical and Meta deduplicates them.

## Environment (Vercel → Project → Environment Variables)

| Variable | Scope | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | all | `2270683237022393` (already set) |
| `META_CAPI_ACCESS_TOKEN` | Production only | Events Manager → Settings → Conversions API → Generate access token |
| `META_TEST_EVENT_CODE` | Preview / temporary | `TESTxxxxx` from Events Manager → Test events; remove after verifying |
| `META_CAPI_ALLOW_NON_PRODUCTION` | Preview only | `true` to let a preview send server events (used with a test code) |
| `NEXT_PUBLIC_META_ALLOWED_HOSTS` | optional | defaults to `criglobal.org,www.criglobal.org`; add `cri.kr,www.cri.kr` when that domain goes live |
| `META_LEAD_VALUE_USD`, `META_SUBMIT_APPLICATION_VALUE_USD` | optional | estimated values for Lead / SubmitApplication |

Gating: the browser pixel only loads when `location.hostname` is in the allowed list, and the server only posts when `VERCEL_ENV=production` (or the override above) **and** the request host is allowed. `cri-portal-2024.vercel.app` and preview URLs therefore send nothing.

## Privacy

`user_data` contains SHA-256 hashes of the normalised email, phone (E.164 digits, dialling code from the residence country), first/last name, country and internal user id, plus `client_ip_address`, `client_user_agent`, `_fbp`, `_fbc`. No raw personal data is ever sent. The consent sentence appears under the contact and application forms and in the "Advertising measurement" section of `/privacy` (en/ko).

## Verifying

1. Events Manager → Test events → open criglobal.org with `?fbclid=test` → PageView shows real paths.
2. Send a contact inquiry → one Lead with both "Browser" and "Server" sources and the same event id (deduplicated).
3. Submit a free application → SubmitApplication (both sources). With the fee on: InitiateCheckout, then Purchase with value/currency.
4. Open a `*.vercel.app` URL → no events at all.
5. After ~1 week: Events Manager → event → "Event match quality" should be ≥ 6; compare Lead count with `Lead` rows in the database (±10 %).
