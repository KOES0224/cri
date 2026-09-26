'use client';

import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@vercel/analytics';

/**
 * Funnel events for Google Analytics 4 (NEXT_PUBLIC_GA_ID) and Vercel Web Analytics (enabled per project).
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
  | 'sign_up';              // account created

type Params = Record<string, string | number | boolean | undefined>;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export function trackEvent(name: FunnelEvent, params: Params = {}) {
  if (typeof window === 'undefined') return;
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) if (value !== undefined) clean[key] = value;

  try { track(name, clean); } catch {}
  if (GA_ID) { try { sendGAEvent('event', name, clean); } catch {} }
}
