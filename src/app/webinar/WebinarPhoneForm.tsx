"use client";

import { useState } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { addWebinarPhone } from "@/app/actions/webinar";
import { KAKAO_CHANNEL_URL } from "@/lib/webinar";

/**
 * "Get the notice on KakaoTalk": adds a mobile number to one sign-up. Shown on the success screen when no number was
 * given, and on /webinar/phone (the link in the confirmation and follow-up emails). The signed token proves the sign-up.
 */
export default function WebinarPhoneForm({ id, token, place }: { id: string; token: string; place: "success" | "link" }) {
  const { t } = useT();
  const copy = t.webinar.phoneAsk;
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (phone.replace(/\D/g, "").length < 8) { setError(copy.errors.phone); return; }
    setState("saving"); setError("");
    try {
      const res = await addWebinarPhone({ id, token, phone });
      if (res.success) { setState("saved"); return; }
      setError(copy.errors[res.code]); setState("idle");
    } catch { setError(copy.errors.failed); setState("idle"); }
  }

  if (state === "saved") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left">
        <p className="inline-flex items-center gap-2 font-bold text-gray-900"><CheckCircle2 className="h-5 w-5 text-emerald-600" />{copy.savedTitle}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{copy.savedBody}</p>
        <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-xl bg-[#FEE500] px-4 py-2.5 text-sm font-bold text-[#191919] hover:brightness-95">{copy.addChannel}</a>
      </div>
    );
  }

  return (
    <form onSubmit={save} noValidate className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 text-left">
      <p className="inline-flex items-center gap-2 font-bold text-gray-900"><BellRing className="h-5 w-5 text-blue-700" />{copy.title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{copy.body}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`webinar-phone-add-${place}`} className="sr-only">{copy.label}</label>
        <input id={`webinar-phone-add-${place}`} type="tel" inputMode="tel" autoComplete="tel" placeholder="010-1234-5678" value={phone} onChange={(e) => { setPhone(e.target.value); setError(""); }} maxLength={40} aria-invalid={Boolean(error)} className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" disabled={state === "saving"} className="shrink-0 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-70">{state === "saving" ? copy.saving : copy.save}</button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <p className="mt-2 text-xs text-gray-500">{copy.note}</p>
    </form>
  );
}
