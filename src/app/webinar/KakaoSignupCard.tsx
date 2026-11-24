"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { useT } from "@/i18n/client";
import { trackEvent } from "@/lib/analytics";
import { KAKAO_CHANNEL_CHAT_URL, WEBINAR, WEBINAR_KAKAO_KEYWORD } from "@/lib/webinar";

type Place = "page" | "success" | "live";

/**
 * KakaoTalk sign-up, made obvious: the exact words to send sit in a KakaoTalk-style chat bubble, and the one button
 * copies them and opens the CRI channel, so the visitor only has to paste and send. The bot answers that message with
 * the sign-up and the Zoom link (src/app/api/kakao/skill).
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
    // Started inside the click so browsers allow it; if the clipboard is blocked the bubble still shows the words.
    navigator.clipboard?.writeText(WEBINAR_KAKAO_KEYWORD).then(() => setCopied(true), () => undefined);
  }

  const title = place === "success" ? copy.afterTitle : place === "live" ? copy.liveTitle : copy.title;
  const lead = place === "success" ? copy.afterLead : place === "live" ? copy.liveLead : copy.lead;

  return (
    <section aria-labelledby={`kakao-${place}`} className={`overflow-hidden rounded-3xl border-2 border-[#FEE500] bg-white text-left shadow-[0_12px_32px_rgb(0,0,0,0.06)] ${className}`}>
      <div className="flex items-center gap-2 bg-[#FEE500] px-5 py-3">
        <MessageCircle className="h-5 w-5 shrink-0 fill-[#191919] text-[#191919]" aria-hidden />
        <h2 id={`kakao-${place}`} className="text-base font-black text-[#191919] sm:text-lg">{title}</h2>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-gray-700 sm:text-base">{lead}</p>

        {/* A KakaoTalk chat in miniature: what to send, and what comes back. */}
        <div aria-hidden className="mt-4 rounded-2xl bg-[#B2C7D9] p-4">
          <div className="flex justify-end">
            <span className="rounded-2xl rounded-tr-md bg-[#FEE500] px-4 py-2.5 text-2xl font-black tracking-tight text-[#191919] shadow-sm sm:text-3xl">{WEBINAR_KAKAO_KEYWORD}</span>
          </div>
          <div className="mt-3 flex items-start gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#152B6B] text-[10px] font-black text-white">CRI</span>
            <span className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2 text-xs leading-relaxed text-gray-800 shadow-sm sm:text-sm">
              {copy.botReply}
              <span className="mt-0.5 block font-semibold text-blue-700">{copy.botLink}</span>
            </span>
          </div>
        </div>

        <a
          href={KAKAO_CHANNEL_CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] px-3 py-4 text-[15px] font-black text-[#191919] shadow-sm transition hover:brightness-95 sm:px-5 sm:text-base"
        >
          {copied ? <Check className="h-5 w-5" aria-hidden /> : <Copy className="h-5 w-5" aria-hidden />}
          {copied ? copy.copied : copy.button}
        </a>
        <p role="status" className="sr-only">{copied ? copy.copied : ""}</p>

        {place === "page" && (
          <ol className="mt-4 grid gap-2 text-sm text-gray-700 xl:grid-cols-3 xl:gap-3">
            {copy.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#191919] text-[11px] font-bold text-white">{i + 1}</span>
                <span className="leading-snug">{step}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-gray-500">{copy.fallback}</p>
      </div>
    </section>
  );
}
