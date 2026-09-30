# Toss Payments (application fee, USD)

The application fee is **USD 50**, charged through Toss Payments' **payment widget** on CRI's **USD merchant id**. There is no won charge anywhere on the site. Code: `src/lib/application-fee.ts`, checkout in `src/app/apply/ApplyClient.tsx`, server confirm in `src/lib/toss.ts`, order/finalize actions in `src/app/actions/payment.ts`.

## Keys and environment (Vercel → cri-portal-2024 → Environment Variables)

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | **결제위젯 연동 키** client key: `test_gck_…` (test) / `live_gck_…` (live). API 개별 연동 키 (`test_ck_…`) do not work with the widget; the checkout then shows "online payment unavailable". |
| `TOSS_SECRET_KEY` | matching widget secret key `test_gsk_…` / `live_gsk_…` (Sensitive). Client and secret keys must be from the same set. |
| `NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY` | variantKey of the 해외결제 (overseas) payment-method UI created in the Toss admin for the USD merchant id. `DEFAULT` until it exists. |
| `NEXT_PUBLIC_APPLICATION_FEE_ENABLED` | `true` to charge every applicant; unset/false keeps applications free except for the payment-review account. |

Changing `NEXT_PUBLIC_*` values needs a redeploy (they are baked in at build time).

## What Toss must provide

- A **USD merchant id (MID)** with the overseas-card contract (Visa, Mastercard, JCB, AMEX in USD; UnionPay is KRW-only). PayPal in USD is a separate contract on the same MID. One MID carries one currency.
- In the Toss admin, a payment-widget UI for that MID; its `variantKey` goes into `NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY`.
- Test mode: Toss's sandbox test cards (Visa 4242 4242 4242 4242, Mastercard 5555 5555 5555 4444, JCB 3530 1113 3330 0000); UnionPay is not available in the sandbox.

Until the USD MID and UI exist, `widgets.setAmount({ currency: 'USD' })` / `requestPayment` fail with Toss's "잘못된 통화 값입니다" (invalid currency), which the checkout shows as a notice.

## Flow

1. Step 3 of the application renders the widget (`renderPaymentMethods` + `renderAgreement`) with the amount fixed to USD 50.
2. "Pay and submit" saves the draft, creates a server-side order (`ApplicationCheckout`, USD 50, 30-minute expiry), then calls `widgets.requestPayment` with `successUrl=/apply/payment-success`, `failUrl=/apply/payment-fail`. If PayPal is the selected method, `foreignEasyPay` (country + product line) is included.
3. `/apply/payment-success` calls `finalizePaidApplication`, which confirms the charge with Toss (`/v1/payments/confirm`, USD 50, same order id) and creates the application. The provider's `paymentKey` is removed from the address bar before analytics run.

## Review account

`scripts/payment-review-account.ts` (see its header) creates the account that sees this checkout while the fee is off for everyone else.
