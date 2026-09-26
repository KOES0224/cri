import { Suspense } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import MetaPixel from './MetaPixel';

/**
 * Page-view tracking for every provider that is configured. Rendered once in the root layout.
 * - Vercel Web Analytics: no key needed; enable it on the project in the Vercel dashboard.
 * - Google Analytics 4: NEXT_PUBLIC_GA_ID
 * - Meta Pixel: NEXT_PUBLIC_META_PIXEL_ID (browser events only on NEXT_PUBLIC_META_ALLOWED_HOSTS; see src/lib/meta)
 * Funnel events go through trackEvent() in src/lib/analytics.ts (GA + Vercel) and src/lib/meta (Meta standard events).
 */
export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  return (
    <>
      <VercelAnalytics />
      {gaId && <GoogleAnalytics gaId={gaId} />}
      {pixelId && <Suspense fallback={null}><MetaPixel /></Suspense>}
    </>
  );
}
