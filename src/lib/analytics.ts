'use client';

import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@vercel/analytics';

/**
 * Funnel events. Each provider is optional and switched on by an environment variable:
 *   NEXT_PUBLIC_GA_ID          Google Analytics 4 measurement id (G-XXXX)
 *   NEXT_PUBLIC_META_PIXEL_ID  Meta Pixel id
 *   Vercel Web Analytics       enabled per project in the Vercel dashboard
 * Calls are safe on the server and when nothing is configured.
 */
export type FunnelEvent =
  | 'program_view'          // program detail page opened
  | 'apply_click'           // "Apply for Program" pressed
  | 'application_step'      // moved to a step of the application form
  | 'checkout_begin'        // Toss payment window requested
  | 'application_submitted' // fee confirmed, application created
  | 'contact_submitted'     // contact form sent
  | 'sign_up';              // account created

type Params = Record<string, string | number | boolean | undefined>;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Map funnel events to Meta's standard events so ad campaigns can optimise on them.
const META_EVENTS: Partial<Record<FunnelEvent, string>> = {
  apply_click: 'ViewContent',
  checkout_begin: 'InitiateCheckout',
  application_submitted: 'Purchase',
  contact_submitted: 'Lead',
  sign_up: 'CompleteRegistration',
};

export function trackEvent(name: FunnelEvent, params: Params = {}) {
  if (typeof window === 'undefined') return;
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) if (value !== undefined) clean[key] = value;

  try { track(name, clean); } catch {}
  if (GA_ID) { try { sendGAEvent('event', name, clean); } catch {} }
  if (META_PIXEL_ID) {
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    const standard = META_EVENTS[name];
    try {
      if (fbq && standard) fbq('track', standard, { value: clean.value, currency: clean.currency, content_name: clean.program_title, content_ids: clean.program_id ? [clean.program_id] : undefined });
      else if (fbq) fbq('trackCustom', name, clean);
    } catch {}
  }
}
