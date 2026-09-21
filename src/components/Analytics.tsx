import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';

/**
 * Page-view tracking for every provider that is configured. Rendered once in the root layout.
 * - Vercel Web Analytics: no key needed; enable it on the project in the Vercel dashboard.
 * - Google Analytics 4: NEXT_PUBLIC_GA_ID
 * - Meta Pixel: NEXT_PUBLIC_META_PIXEL_ID
 * Custom funnel events are sent through trackEvent() in src/lib/analytics.ts.
 */
export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  return (
    <>
      <VercelAnalytics />
      {gaId && <GoogleAnalytics gaId={gaId} />}
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId.replace(/[^0-9]/g, '')}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
