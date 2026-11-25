"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { useT } from "@/i18n/client";
import { trackEvent } from "@/lib/analytics";
import { KAKAO_CHANNEL_CHAT_URL, WEBINAR, WEBINAR_KAKAO_KEYWORD } from "@/lib/webinar";

type Place = "page" | "success" | "live";

/**
 * KakaoTalk sign-up: the steps the channel bot walks through (keyword, name and number, channel add, then the link;
 * src/app/api/kakao/skill) and one button that copies the keyword and opens the CRI chat.
 * "page" sits inside the sign-up box's KakaoTalk tab, so it has no frame of its own; "success" and "live" are cards.
 */
export default function KakaoSignupCard({ place, className = "" }: { place: Place; className?: string }) {
  const { t } = useT();
  const copy = t.webinar.kakaoSignup;
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 6000);
    return () => window.clearTimeout(id);
  }, [copied]);

  function onOpen() {
    trackEvent("webinar_kakao_click", { topic: WEBINAR.key, method: place });
    // Started inside the click so browsers allow it; if the clipboard is blocked the fallback line says what to type.
    navigator.clipboard?.writeText(WEBINAR_KAKAO_KEYWORD).then(() => setCopied(true), () => undefined);
  }

  const title = place === "success" ? copy.afterTitle : place === "live" ? copy.liveTitle : copy.title;
  const lead = place === "success" ? copy.afterLead : place === "live" ? copy.liveLead : copy.lead;
  const framed = place !== "page";

  const body = (
    <>
      <p className="text-sm leading-relaxed text-gray-700 sm:text-base">{lead}</p>
      {place !== "success" && (
        <>
          <ol className="mt-4 space-y-2.5">
            {copy.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm text-gray-800 sm:text-[15px]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FEE500] text-xs font-black text-[#191919]">{i + 1}</span>
                <span className="pt-0.5 leading-snug">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2.5 pl-9 text-sm font-semibold text-gray-900">{copy.stepsDone}</p>
        </>
      )}
      <a
        href={KAKAO_CHANNEL_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] px-3 py-4 text-[15px] font-black text-[#191919] shadow-sm transition hover:brightness-95 sm:px-5 sm:text-base"
      >
        {copied ? <Check className="h-5 w-5" aria-hidden /> : <Copy className="h-5 w-5" aria-hidden />}
        {copied ? copy.copied : copy.button}
      </a>
      <p role="status" className="sr-only">{copied ? copy.copied : ""}</p>
      <p className="mt-3 text-xs text-gray-500">{copy.fallback}</p>
    </>
  );

  if (!framed) return <div className={className}>{body}</div>;
  return (
    <section aria-labelledby={`kakao-${place}`} className={`overflow-hidden rounded-3xl border-2 border-[#FEE500] bg-white text-left ${className}`}>
      <div className="flex items-center gap-2 bg-[#FEE500] px-5 py-3">
        <MessageCircle className="h-5 w-5 shrink-0 fill-[#191919] text-[#191919]" aria-hidden />
        <h2 id={`kakao-${place}`} className="text-base font-black text-[#191919] sm:text-lg">{title}</h2>
      </div>
      <div className="p-5">{body}</div>
    </section>
  );
}
