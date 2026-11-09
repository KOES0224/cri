/**
 * Application fee. Charged in US dollars through Toss Payments' payment widget on the merchant's USD merchant id
 * (foreign-issued cards and PayPal). There is no won charge anywhere on the site.
 */
export const APPLICATION_CHARGE = { currency: 'USD', amount: 50 } as const;
export const APPLICATION_CHARGE_LABEL = '$50 USD';
/** When the fee was switched on for every applicant. Drafts last saved before this were started while applying was free and get a one-line notice. */
export const APPLICATION_FEE_INTRODUCED = new Date('2026-11-09T06:00:00Z');
/** The same amount the way a US checkout prints it, with cents. The currency code is shown next to it where space allows. */
export const APPLICATION_CHARGE_PRICE = '$50.00';

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
/** Payment UI of the won merchant id, used only by the review sample product. One widget key serves both merchant ids; the UI picks which one is charged. */
export const TOSS_WIDGET_VARIANT_KEY_KRW = process.env.NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY_KRW || 'DEFAULT';

/**
 * Terms UI the widget renders under the payment methods. `AGREEMENT` is Toss's default (Korean); an English one made in
 * the Toss admin (결제 > 약관 설정) is selected by putting its variantKey here.
 */
export const TOSS_AGREEMENT_VARIANT_KEY = process.env.NEXT_PUBLIC_TOSS_AGREEMENT_VARIANT_KEY || 'AGREEMENT';

/** The widget only initialises with a 결제위젯 연동 키 (…_gck_…); API 개별 연동 키 (…_ck_…) belong to the legacy won-only window. */
export function tossWidgetClientKeyValid(key: string | undefined): boolean {
  return /^(test|live)_gck_[A-Za-z0-9_]+$/.test(key || '');
}
