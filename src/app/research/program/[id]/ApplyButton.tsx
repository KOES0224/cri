"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";

interface ApplyButtonProps {
  programId: string;
  className?: string;
}

export default function ApplyButton({ programId, className = "" }: ApplyButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPending) return;

    startTransition(() => {
      router.push(`/apply?programId=${programId}`);
    });
  };

  return (
    <button
      onClick={handleApplyClick}
      disabled={isPending}
      className={`relative w-full h-14 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 text-white rounded-2xl text-center font-bold text-lg transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 flex items-center justify-center group/btn overflow-hidden cursor-pointer active:scale-[0.98] disabled:opacity-90 disabled:cursor-wait ${className}`}
    >
      {/* Subtle Apple-style light sweep on hover */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out" />

      {isPending ? (
        <span className="inline-flex items-center gap-2.5 text-white/95 text-base font-semibold tracking-wide animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
          Loading Application...
        </span>
      ) : (
        <span className="inline-flex items-center text-white">
          Apply for Program
          <ChevronRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1.5 transition-transform duration-200" />
        </span>
      )}
    </button>
  );
}
