"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { metaTrack } from "@/lib/meta/pixel";
import type { MetaCustomData } from "@/lib/meta/config";

/**
 * Records a program detail view once per page load so the funnel starts at the program, not at the apply click.
 * GA/Vercel get `program_view`; Meta gets the standard ViewContent with "University - Professor - Field" as content_name.
 */
export default function TrackProgramView({ programId, programTitle, open, content }: { programId: string; programTitle: string; open: boolean; content: MetaCustomData }) {
  // Compared by value: the server component hands over a fresh object on every render.
  const contentKey = JSON.stringify(content);
  useEffect(() => {
    trackEvent("program_view", { program_id: programId, program_title: programTitle, accepting: open });
    metaTrack("ViewContent", JSON.parse(contentKey) as MetaCustomData);
  }, [programId, programTitle, open, contentKey]);
  return null;
}
