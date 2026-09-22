// Preserve the existing merchant's KRW charge until a different currency is configured and approved.
export const APPLICATION_FEE_USD = 50;
export const APPLICATION_CHARGE = { currency: 'KRW', amount: 68000 } as const;
export const APPLICATION_CHARGE_LABEL = '₩68,000 KRW';

/**
 * Whether applying requires the paid checkout. Off by default: applications are free and submit
 * directly to admissions. Set NEXT_PUBLIC_APPLICATION_FEE_ENABLED=true in Vercel to turn the fee
 * (and the Toss checkout step) back on without a code change.
 */
export const APPLICATION_FEE_ENABLED = process.env.NEXT_PUBLIC_APPLICATION_FEE_ENABLED === 'true';
