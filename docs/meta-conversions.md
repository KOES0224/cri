# Meta Pixel + Conversions API

Pixel / dataset id `2270683237022393`. Code lives in `src/lib/meta/` and `src/components/MetaPixel.tsx`.

## What fires where

| Event | Browser (pixel) | Server (CAPI) | Where |
| --- | --- | --- | --- |
| PageView | every route change, real path | – | `MetaPixel` |
| ViewContent | program detail | – | `TrackProgramView` |
| StartApplication (custom, `step` 1–3) | apply form opened / step advanced | – | `ApplyClient` |
| CompleteRegistration | sign-up (credentials + Google onboarding) | `/api/auth/register`, `/api/auth/onboard` | user id |
| Lead | contact form success | `submitContactForm` | lead id |
| InitiateCheckout | Toss window requested | `beginApplicationCheckout` | checkout order id |
| SubmitApplication | free submission success | `submitApplicationWithoutFee` | application id |
| Purchase | payment-success page | `finalizePaidApplication` | Toss order id |

The server decides the event id (the record's own id, so retries, reloads and resumed checkouts collapse to one event) and computes the parameters (`content_name` = "University - Professor - Field", `content_category`, `applicant_type`, `applicant_region`, `value`/`currency`, first-touch UTM). It returns both as `tracking` and `eventId`; the browser fires the pixel event with exactly those, so the two copies are identical and Meta deduplicates them.

Browser events fired before the pixel has initialised (page-level mount effects run before the layout's `MetaPixel` effect) are buffered in `src/lib/meta/pixel.ts` and flushed right after `fbq('init')`, so ViewContent on a direct landing is never lost. `MetaPixel` does not wait for the client-side session: the root layout reads the session on the server and passes the SHA-256 hashed email and user id as advanced-matching keys.

Known limitation: advanced-matching keys are set at pixel init, so a visitor who signs in without a full page load keeps anonymous browser events until the next hard navigation. The P0 conversions are matched through the server events (hashed email, phone, name, country, user id) regardless.

`/apply/payment-success` removes the provider's `paymentKey`, `amount` and `paymentType` from the address bar before the pixel's PageView fires, and the server strips every query parameter except `programId`, `topic`, `role`, `step`, `fbclid` and `utm_*` from `event_source_url`.

## Environment (Vercel → Project → Environment Variables)

| Variable | Scope | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | all | `2270683237022393` (already set) |
| `META_CAPI_ACCESS_TOKEN` | Production only | Events Manager → Settings → Conversions API → Generate access token |
| `META_TEST_EVENT_CODE` | Preview / temporary | `TESTxxxxx` from Events Manager → Test events; remove after verifying |
| `META_CAPI_ALLOW_NON_PRODUCTION` | Preview only | `true` to let a preview send server events; only honoured together with `META_TEST_EVENT_CODE` |
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
