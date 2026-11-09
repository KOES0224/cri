# Toss Payments (application fee, USD)

The application fee is **USD 50**, charged through Toss Payments' **payment widget** on CRI's **USD merchant id**. There is no won charge anywhere on the site. Code: `src/lib/application-fee.ts`, checkout in `src/app/apply/ApplyClient.tsx`, server confirm in `src/lib/toss.ts`, order/finalize actions in `src/app/actions/payment.ts`.

## Keys and environment (Vercel → cri-portal-2024 → Environment Variables)

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | **결제위젯 연동 키** client key: `test_gck_…` (test) / `live_gck_…` (live). API 개별 연동 키 (`test_ck_…`) do not work with the widget; the checkout then shows "online payment unavailable". |
| `TOSS_SECRET_KEY` | matching widget secret key `test_gsk_…` / `live_gsk_…` (Sensitive). Client and secret keys must be from the same set. |
| `NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY` | variantKey of the 해외결제 (overseas) payment-method UI created in the Toss admin for the USD merchant id. `DEFAULT` until it exists. |
| `NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY_KRW` | variantKey of the payment UI connected to the **won** merchant id. Only the review sample product (`/pg-review`) uses it. `DEFAULT` when unset. |
| `NEXT_PUBLIC_APPLICATION_FEE_ENABLED` | `true` to charge every applicant; unset/false keeps applications free except for the payment-review account. **On since 2026-11-09.** |
| `NEXT_PUBLIC_APPLICATION_FEE_SINCE` | ISO time the fee was switched on. Drafts last saved before it show a one-line "a fee has been introduced" notice. Set it together with the switch. |
| `NEXT_PUBLIC_TOSS_AGREEMENT_VARIANT_KEY` | variantKey of an English terms UI made in the Toss admin (결제 > 약관 설정). Unset renders Toss's default Korean terms (`AGREEMENT`). |

Changing `NEXT_PUBLIC_*` values needs a redeploy (they are baked in at build time).

To switch the fee off again: remove `NEXT_PUBLIC_APPLICATION_FEE_ENABLED` and redeploy. Applications are then free; a checkout whose payment already reached Toss is kept and still settled.

Toss issued two live merchant ids (won and foreign currency). The widget key pair is shared by the whole store; which merchant id a payment goes to is decided by the payment UI (variantKey) chosen in the Toss admin, not by the key. The per-merchant-id keys under "API 개별 연동 키" (`live_ck_…`, secret and security keys) are not used by this site. A confirm error `NOT_AVAILABLE_PAYMENT_BY_MERCHANT` means the UI in use points at a merchant id without a completed contract.

## What Toss must provide

- A **USD merchant id (MID)** with the overseas-card contract (Visa, Mastercard, JCB, AMEX in USD; UnionPay is KRW-only). PayPal in USD is a separate contract on the same MID. One MID carries one currency.
- In the Toss admin, a payment-widget UI for that MID; its `variantKey` goes into `NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY`.
- Test mode: Toss's sandbox test cards (Visa 4242 4242 4242 4242, Mastercard 5555 5555 5555 4444, JCB 3530 1113 3330 0000); UnionPay is not available in the sandbox.

Until the USD MID and UI exist, Toss rejects the USD request with "잘못된 통화 값입니다" (invalid currency). If that happens while the widget renders, the checkout shows the generic "payment options could not be loaded" text (details in the browser console); if it happens on "Pay and submit", Toss's message is shown as the notice.

## Flow

1. Step 3 of the application renders the order summary and the widget (`renderPaymentMethods` + `renderAgreement`) with the amount fixed to USD 50.
2. The Pay button saves the draft, creates a server-side order (`ApplicationCheckout`, USD 50; a new order id for every attempt), then calls `widgets.requestPayment` with `successUrl=/apply/payment-success`, `failUrl=/apply/payment-fail`. If PayPal is the selected method, `foreignEasyPay` (country + product line) is included.
3. `/apply/payment-success` calls `finalizePaidApplication`, which stores the payment key on the order, confirms the charge with Toss (`/v1/payments/confirm`, USD 50, same order id) and creates the application. The provider's `paymentKey` is removed from the address bar before analytics run and kept in the tab's session storage only until the payment is settled.

## Retries and unsettled payments

Rules live in `src/lib/checkout-policy.ts`; the reasoning is in its header.

- A charge only happens at confirm, and the payment key is written to the order just before it (first key wins). An order without a key has no charge behind it, so every press of Pay replaces it with a fresh order: closing the window, a declined card or coming back hours later never blocks the applicant.
- An order with a key follows Toss's record of that payment (`GET /v1/payments/{paymentKey}`): approved is recorded as the application without a second charge, refused or expired is released, in progress waits (the form and the success page re-check by themselves), and anything still unsettled after 40 minutes is mailed to admissions with the order number.
- The order-id lookup (`/v1/payments/orders/{orderId}`) cannot be called with payment-widget secret keys. Never base a decision on it.
- Admissions also gets a mail when the payment form cannot load for an applicant, since nobody can apply while that lasts.
- Do not roll back to a build from before 2026-11-09 while the fee is on: older code confirms without storing the key.

## Review account

`scripts/payment-review-account.ts` (see its header) creates the account that sees this checkout while the fee is off for everyone else.
