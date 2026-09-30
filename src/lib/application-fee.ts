/**
 * Application fee. Charged in US dollars through Toss Payments' payment widget on the merchant's USD merchant id
 * (foreign-issued cards and PayPal). There is no won charge anywhere on the site.
 */
export const APPLICATION_CHARGE = { currency: 'USD', amount: 50 } as const;
export const APPLICATION_CHARGE_LABEL = '$50 USD';

/**
 * Whether applying requires the paid checkout. Off by default: applications are free and submit
 * directly to admissions. Set NEXT_PUBLIC_APPLICATION_FEE_ENABLED=true in Vercel to turn the fee
 * (and the Toss checkout step) back on without a code change.
 */
export const APPLICATION_FEE_ENABLED = process.env.NEXT_PUBLIC_APPLICATION_FEE_ENABLED === 'true';

/**
 * Payment-method UI the widget renders: the overseas-payment (해외결제) UI's variantKey from the Toss admin.
 * DEFAULT renders the merchant's default UI.
 */
export const TOSS_WIDGET_VARIANT_KEY = process.env.NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY || 'DEFAULT';

/** The widget only initialises with a 결제위젯 연동 키 (…_gck_…); API 개별 연동 키 (…_ck_…) belong to the legacy won-only window. */
export function tossWidgetClientKeyValid(key: string | undefined): boolean {
  return /^(test|live)_gck_[A-Za-z0-9_]+$/.test(key || '');
}
