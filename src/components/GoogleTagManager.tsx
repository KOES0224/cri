"use client";

import { useEffect, useState } from "react";
import { GoogleTagManager as NextGoogleTagManager } from "@next/third-parties/google";
import { GTM_ID, gtmEnabled } from "@/lib/gtm";

/** Loads the GTM container (NEXT_PUBLIC_GTM_ID) after hydration, on production hostnames only (see src/lib/gtm.ts). */
export default function GoogleTagManager() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => setEnabled(gtmEnabled()), []);
  return enabled ? <NextGoogleTagManager gtmId={GTM_ID} /> : null;
}
