'use client';

import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@vercel/analytics';
import { pushGtmEvent, type FunnelParam } from './gtm';

/**
 * Funnel events for Vercel Web Analytics (enabled per project) and the GTM dataLayer (NEXT_PUBLIC_GTM_ID), where they
 * are Custom Event triggers with the same names; GA4, Google Ads, Kakao and Naver are configured inside GTM.
 * NEXT_PUBLIC_GA_ID (GA4 installed in code) must stay unset while the GTM container carries GA4, or GA4 counts twice.
 * One-time conversions carry transaction_id (application, order or inquiry id, the same value Meta gets as event_id).
 * Google Ads (Transaction ID) and Meta deduplicate on it; GA4, Kakao and Naver count every push, so a repeat
 * submission must not call trackEvent at all.
 * Meta receives only standard events with its own parameter schema through src/lib/meta (pixel + Conversions API),
 * not these custom names. Calls are safe on the server and when nothing is configured.
 */
export type FunnelEvent =
  | 'program_view'          // program detail page opened
  | 'apply_click'           // "Apply for Program" pressed
  | 'application_step'      // moved to a step of the application form
  | 'checkout_begin'        // Toss payment window requested
  | 'application_submitted' // fee confirmed, application created
  | 'contact_submitted'     // contact form sent
  | 'sign_up'               // account created
  | 'webinar_registered';   // webinar sign-up sent

// Only keys listed in FUNNEL_PARAMS (src/lib/gtm.ts), so the dataLayer reset always covers every parameter.
type Params = Partial<Record<FunnelParam, string | number | boolean | undefined>>;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export function trackEvent(name: FunnelEvent, params: Params = {}) {
  if (typeof window === 'undefined') return;
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) if (value !== undefined) clean[key] = value;

  try { track(name, clean); } catch {}
  if (GA_ID) { try { sendGAEvent('event', name, clean); } catch {} }
  try { pushGtmEvent(name, clean); } catch {}
}
