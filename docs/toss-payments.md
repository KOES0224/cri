# Toss Payments (application fee, USD)

The application fee is **USD 50** (less, or nothing, with a referral code: `docs/referral-codes.md`), charged through Toss Payments' **payment widget** on CRI's **USD merchant id**. There is no won charge anywhere on the site. Code: `src/lib/application-fee.ts`, checkout in `src/app/apply/ApplyClient.tsx`, server confirm in `src/lib/toss.ts`, order/finalize actions in `src/app/actions/payment.ts`.

## Keys and environment (Vercel → cri-portal-2024 → Environment Variables)

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | **결제위젯 연동 키** client key: `test_gck_…` (test) / `live_gck_…` (live). API 개별 연동 키 (`test_ck_…`) do not work with the widget; the checkout then shows "online payment unavailable". |
| `TOSS_SECRET_KEY` | matching widget secret key `test_gsk_…` / `live_gsk_…` (Sensitive). Client and secret keys must be from the same set. |
| `NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY` | variantKey of the 해외결제 (overseas) payment-method UI created in the Toss admin for the USD merchant id. `DEFAULT` until it exists. |
| `NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY_KRW` | variantKey of the payment UI connected to the **won** merchant id. Only the review sample product (`/pg-review`) uses it. `DEFAULT` when unset. |
| `NEXT_PUBLIC_APPLICATION_FEE_ENABLED` | Exactly `true` (lower case, no spaces) turns the fee on for every applicant; anything else keeps applications free except for the payment-review account. **Currently `false`**: on for a few hours on 2026-11-09, then switched off the same evening because Toss had not opened dollar payments (see "Current state" below). |
| `NEXT_PUBLIC_APPLICATION_FEE_SINCE` | The time the fee was switched on, in UTC with a `Z` (or with `+09:00`); a time without a zone is read as UTC. Drafts last saved before it show a one-line "a fee has been introduced" notice. **Change it every time the fee is switched on**; while the fee is on, `/dashboard/fee-codes` shows the date in use. |
| `NEXT_PUBLIC_TOSS_AGREEMENT_VARIANT_KEY` | variantKey of an English terms UI made in the Toss admin (결제 > 약관 설정). Unset renders Toss's default Korean terms (`AGREEMENT`). |

Changing `NEXT_PUBLIC_*` values needs a redeploy (they are baked in at build time).

### Current state (2026-11-09 evening): fee off

The fee was on from about 15:30 to 20:00 KST on 2026-11-09. No application and no checkout was created in that window. It was switched off because a live dollar payment does not go through yet: on `/pg-review/usd` the Toss window ends with code `2003` ("업체 사정으로 인해 결제를 일시 중지하였습니다"), which is decided on Toss's side for the foreign-currency merchant id. Won payments on `/pg-review` work.

While the fee is off, the payment step and the referral code field are not shown to applicants. Referral codes can be created in `/dashboard/fee-codes` at any time and work as soon as the fee is on.

### Switching the fee on (checklist)

Update the "Current state" section above when this is done.

**Before** (fee still off; the payment-review account sees the paid checkout already):

1. Toss confirms the foreign-currency merchant id is open and the `criUSD` payment UI is connected to it.
2. One dollar payment succeeds on `/pg-review/usd` (USD 1.00, review account or an admin). Cancel it in the Toss admin.
3. Rehearse the real path with the review account (`~/cri-pg-review.txt`) and two throwaway codes from `/dashboard/fee-codes` (one reduced, one waiving). An application can only be submitted once per program, so in this order:
   - Program A, last step: apply the reduced code. The total and the Pay button show the reduced amount; press Pay, check that the Toss window shows the same amount, and close the window without paying.
   - Same form: remove the code, apply the waiving code. The payment form disappears; "Submit application" submits, and the code's Used count goes up by one.
   - Program B (or program A again after the cleanup below): pay the full fee. The receipt page appears and two mails marked `[TEST · payment review]` arrive; cancel the payment in the Toss admin.
   Then run `npx tsx scripts/payment-review-account.ts --cleanup --apply` (it deletes the account's test applications, drafts and checkouts) and switch the throwaway codes off. The throwaway codes keep their Used count, and their Used link shows no rows, because the review account is left out of the applications lists.
4. The referral codes for partners exist and are Active (`/dashboard/fee-codes`, or `npx tsx scripts/referral-codes.ts` to list them).

**Switch** (Vercel → cri-portal-2024 → Environment Variables, Production):

5. `NEXT_PUBLIC_APPLICATION_FEE_ENABLED` = `true` and `NEXT_PUBLIC_APPLICATION_FEE_SINCE` = now in UTC (e.g. `2026-11-20T03:00:00Z`), then redeploy.

**After**:

6. A program page and `/admissions` state the USD 50 fee in English and Korean; `/dashboard/fee-codes` says the fee is on, with the right date.
7. With a student test account (not an admin: admins cannot open the form), the last step shows the order summary, "Have a referral code?" and the payment form.
8. Watch the admissions inbox for `[CRI payment problem]` and `[CRI payment check]` on the first day.

Tabs that were open during the switch: Vercel skew protection is on for this project (maximum age 12 hours, read from the project settings on 2026-11-09; Vercel → Settings → Advanced shows the current value). While it applies, a tab opened before the deploy keeps talking to the old build: someone already on the free form when the fee goes on can still submit for free from that tab, and the reverse when it goes off. When such a tab does reach the new build and Submit or Pay is pressed, the server answers that the fee has changed and the form reloads itself onto the current form (after a switch-on, with a one-line note that a fee has been introduced). If the tab cannot even save (the new build does not recognise the old page), the applicant sees "Draft not saved" and has to reload by hand; nothing typed before the last successful save is lost.

### Switching the fee off

Set `NEXT_PUBLIC_APPLICATION_FEE_ENABLED` to `false` and redeploy. A payment that already reached Toss keeps its applicant's form locked until it is settled (recorded as the application, or released when Toss reports no charge), so nobody ends up charged and also submitted for free; everyone else applies for free at once. If `[CRI payment check]` mails are open, go through them first.

Keep `TOSS_SECRET_KEY` set, and from the same key set, while the fee is off: settling such a payment means asking Toss about it. If Toss cannot answer (key removed or changed, or a payment it reports in a state the site does not recognise), that applicant's form stays locked. To release it by hand: look the order number from the `[CRI payment check]` mail up in the Toss admin; if nothing was charged, delete that one `ApplicationCheckout` row (Supabase → Table editor, `id` = the order number) and the form is free again; if it was charged, refund it there first or ask the applicant to open the form so the site records it.

Toss issued two live merchant ids (won and foreign currency). The widget key pair is shared by the whole store; which merchant id a payment goes to is decided by the payment UI (variantKey) chosen in the Toss admin, not by the key. The per-merchant-id keys under "API 개별 연동 키" (`live_ck_…`, secret and security keys) are not used by this site. A confirm error `NOT_AVAILABLE_PAYMENT_BY_MERCHANT` means the UI in use points at a merchant id without a completed contract.

## What Toss must provide

- A **USD merchant id (MID)** with the overseas-card contract (Visa, Mastercard, JCB, AMEX in USD; UnionPay is KRW-only). PayPal in USD is a separate contract on the same MID. One MID carries one currency.
- In the Toss admin, a payment-widget UI for that MID; its `variantKey` goes into `NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY`.
- Test mode: Toss's sandbox test cards (Visa 4242 4242 4242 4242, Mastercard 5555 5555 5555 4444, JCB 3530 1113 3330 0000); UnionPay is not available in the sandbox.

Until the USD MID and UI exist, Toss rejects the USD request with "잘못된 통화 값입니다" (invalid currency). If that happens while the widget renders, the checkout shows the generic "payment options could not be loaded" text (details in the browser console); if it happens on Pay, the applicant sees "The payment was not completed and you have not been charged" with Toss's code as a reference, and admissions gets a `[CRI payment problem]` mail with Toss's own message.

## Flow

1. Step 3 of the application renders the order summary and the widget (`renderPaymentMethods` + `renderAgreement`). The amount is USD 50, or the reduced amount when a referral code is applied; a code that waives the fee hides the widget and the application is submitted without payment.
2. The Pay button saves the draft, creates a server-side order (`ApplicationCheckout`, priced by the server with the code if any; a new order id for every attempt), sets the widget to exactly that amount, then calls `widgets.requestPayment` with `successUrl=/apply/payment-success`, `failUrl=/apply/payment-fail`. If PayPal is the selected method, `foreignEasyPay` (country + product line) is included.
3. `/apply/payment-success` calls `finalizePaidApplication`, which stores the payment key on the order, confirms the charge with Toss (`/v1/payments/confirm`, the order's own amount, same order id) and creates the application. The provider's `paymentKey` is removed from the address bar before analytics run and kept in the tab's session storage only until the payment is settled.

## Retries and unsettled payments

Rules live in `src/lib/checkout-policy.ts`; the reasoning is in its header.

- A charge only happens at confirm, and the payment key is written to the order just before it (first key wins). An order without a key has no charge behind it, so every press of Pay replaces it with a fresh order: closing the window, a declined card or coming back hours later never blocks the applicant.
- An order with a key follows Toss's record of that payment (`GET /v1/payments/{paymentKey}`): approved is recorded as the application without a second charge, refused or expired is released, in progress waits (the form and the success page re-check by themselves), and anything still unsettled after 40 minutes is mailed to admissions with the order number.
- The order-id lookup (`/v1/payments/orders/{orderId}`) cannot be called with payment-widget secret keys. Never base a decision on it.
- Admissions also gets a mail (`[CRI payment problem]`, a few an hour at most) when the payment form cannot load or the payment window fails in the form: nobody can apply while that lasts. A separate mail with its own hourly budget (`[CRI payment problem] a payment ended with code …`) is sent when an applicant lands on `/apply/payment-fail` with a code the page cannot explain (Toss's merchant-side codes such as `2003`, or one the site does not know): one can be a one-off, several in a row mean payments are not going through. The payer's own cancel, a declined card and a card that cannot pay in dollars are not reported.
- `[CRI payment check]` mails state the order's amount and its referral code, so a USD 20 payment in the Toss admin is not mistaken for a wrong charge.
- Deleting a paid application in the admin refunds nothing: refund the order in the Toss admin if needed (the delete dialog in the spreadsheet view shows the order number). The order stays in `ApplicationCheckout` as the site's record of the payment, marked `REMOVED` and set aside, so the same account can apply to that program again (and would pay again). The old receipt page of a removed order says the application was removed by admissions.
- Do not roll back to a build from before 2026-11-09 while the fee is on: older code confirms without storing the key.

## Testing locally

- `npm test`: unit tests, no database.
- `npm run test:integration` needs a disposable PostgreSQL on `127.0.0.1` (the tests refuse any other host). Without Docker or a system PostgreSQL, the npm package `embedded-postgres` (installed in a scratch folder outside the repo) runs one: start it on a free port, then `DATABASE_URL=postgresql://…@127.0.0.1:<port>/<db> npx prisma db push --skip-generate` and run the tests with the same `DATABASE_URL`. Never run `prisma db push` without that override: `.env` points at production.
- A local site with the fee on, for clicking through codes and the admin pages: `DATABASE_URL=postgresql://…@127.0.0.1:<port>/<db> NEXT_PUBLIC_APPLICATION_FEE_ENABLED=true NEXTAUTH_URL=http://localhost:<port> npx next dev -p <port>`. As with `db push`, never without the `DATABASE_URL` override: `next dev` reads every variable that is not given on the command line from `.env`, and `.env` points at production. To see the payment widget, add Toss's published documentation sample keys as `NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_…` and `TOSS_SECRET_KEY=test_gsk_docs_…`: it renders in test mode, but that sample merchant has no dollar contract, so Pay ends with `INVALID_AMOUNT_CURRENCY`. A dollar payment can only be exercised on production with the review account.

## Review account

`scripts/payment-review-account.ts` (see its header) creates the account that sees this checkout while the fee is off for everyone else.
