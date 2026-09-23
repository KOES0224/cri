"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ApplyButtonProps {
  programId: string;
  programTitle?: string;
  className?: string;
  label?: string;
  /** Kept for callers; the pending state is now shown by the route's loading.tsx. */
  pendingLabel?: string;
}

/** Primary call to action on the program page. A real link (right-click, middle-click, keyboard, crawlers all work). */
export default function ApplyButton({ programId, programTitle, className = "", label = "Apply for Program" }: ApplyButtonProps) {
  return (
    <Link
      href={`/apply?programId=${encodeURIComponent(programId)}`}
      onClick={() => trackEvent("apply_click", { program_id: programId, program_title: programTitle })}
      className={`relative w-full h-14 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 text-white rounded-2xl text-center font-bold text-lg transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 flex items-center justify-center group/btn overflow-hidden active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 ${className}`}
    >
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out" aria-hidden="true" />
      <span className="inline-flex items-center text-white">
        {label}
        <ChevronRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1.5 transition-transform duration-200" />
      </span>
    </Link>
  );
}
