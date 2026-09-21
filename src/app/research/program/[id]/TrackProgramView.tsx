"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/** Records a program detail view once per page load so the funnel starts at the program, not at the apply click. */
export default function TrackProgramView({ programId, programTitle, open }: { programId: string; programTitle: string; open: boolean }) {
  useEffect(() => { trackEvent("program_view", { program_id: programId, program_title: programTitle, accepting: open }); }, [programId, programTitle, open]);
  return null;
}
