"use client";

import { useEffect, useState } from "react";
import Link from "@/i18n/link";
import { CalendarDays, CheckCircle2, Clock, Gift, MessageCircle, PencilLine, Video } from "lucide-react";
import { useT } from "@/i18n/client";
import { registerForWebinar, type WebinarResult } from "@/app/actions/webinar";
import { webinarErrors } from "@/lib/webinar-validation";
import { trackEvent } from "@/lib/analytics";
import { metaTrack } from "@/lib/meta/pixel";
import { WEBINAR, webinarEndsAt } from "@/lib/webinar";
import KakaoSignupCard from "./KakaoSignupCard";
import WebinarPhoneForm, { KakaoChannelNudge } from "./WebinarPhoneForm";

type Form = { name: string; role: "" | "PARENT" | "STUDENT" | "OTHER"; phone: string; email: string; kakaoId: string; question: string; consent: boolean };
const input = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-500";

export default function WebinarClient({ open, live: liveAtLoad = false, noticesOpen = true, user }: { open: boolean; live?: boolean; /** before the KakaoTalk friend-group cutoff */ noticesOpen?: boolean; user: { name: string; email: string; role: string } | null }) {
  const { t } = useT();
  const copy = t.webinar;
  const [form, setForm] = useState<Form>({ name: user?.name || "", role: (user?.role as Form["role"]) || "", phone: "", email: user?.email || "", kakaoId: "", question: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [closed, setClosed] = useState(!open);
  // Between the start and the end the form is closed but the KakaoTalk keyword still hands out the link.
  const [live, setLive] = useState(liveAtLoad);
  useEffect(() => {
    // A page left open switches itself: form → "on now" at the start, "on now" → closed at the end.
    const timers: number[] = [];
    const at = (when: Date, run: () => void) => {
      const ms = when.getTime() - Date.now();
      if (ms > 0 && ms < 2 ** 31 - 1) timers.push(window.setTimeout(run, ms));
    };
    at(WEBINAR.closesAt, () => { setClosed(true); setLive(true); });
    at(webinarEndsAt(), () => setLive(false));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);
  const [result, setResult] = useState<WebinarResult | null>(null);
  // One sign-up box, two ways in: KakaoTalk (the default: a few taps on a phone) or the form.
  const [tab, setTab] = useState<"kakao" | "form">("kakao");
  const [notice, setNotice] = useState("");
  const errorText = (code: string | undefined) => (code ? (copy.errors as Record<string, string>)[code] || code : "");

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; if (["phone", "email", "kakaoId"].includes(key)) delete n.contact; return n; });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const issues = webinarErrors(form);
    if (Object.keys(issues).length) { setErrors(issues); return; }
    setStatus("sending"); setNotice("");
    try {
      const res = await registerForWebinar({ ...form, role: form.role as "PARENT" | "STUDENT" | "OTHER", consent: true });
      if (!res.success) {
        if (res.code === "closed") { setClosed(true); setLive(Boolean(res.live)); setStatus("idle"); return; }
        if (res.field) setErrors({ [res.field]: res.code });
        setNotice(errorText(res.code));
        setStatus("idle");
        return;
      }
      setResult(res); setStatus("done");
      if (!res.alreadyRegistered) {
        trackEvent("webinar_registered", { topic: WEBINAR.key, role: form.role.toLowerCase() });
        metaTrack("Lead", res.tracking, res.eventId);
      }
    } catch { setNotice(copy.errors.failed); setStatus("idle"); }
  }

  const registerHref = `/auth/register?role=${form.role === "STUDENT" ? "STUDENT" : "PARENT"}${form.email ? `&email=${encodeURIComponent(form.email)}` : ""}`;

  const facts = [
    { icon: CalendarDays, text: copy.facts.date },
    { icon: Clock, text: copy.facts.length },
    { icon: Video, text: copy.facts.place },
    { icon: Gift, text: copy.facts.fee },
  ];
  const tabClass = (on: boolean) => `flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition ${on ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 pt-28 sm:pt-32">
      {/* Title, then the sign-up box, then the details: on phones in that order; on wide screens the box is the right column. */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-10">
        <header className="lg:col-start-1 lg:row-start-1">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-700">{copy.eyebrow}</p>
          <h1 className="text-[2rem] font-black leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl">{copy.title}</h1>
          <ul className="mt-5 flex flex-wrap gap-2">
            {facts.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800">
                <Icon className="h-4 w-4 text-blue-700" aria-hidden />{text}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gray-500">{copy.audience}</p>
        </header>

        <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-[0_20px_40px_rgb(0,0,0,0.05)] sm:p-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          {closed && live ? (
            <KakaoSignupCard place="live" className="-mx-1 sm:mx-0" />
          ) : closed ? (
            <div className="py-10 text-center">
              <Clock className="mx-auto h-10 w-10 text-gray-300" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">{copy.closedTitle}</h2>
              <p className="mt-2 text-gray-600">{copy.closedBody}</p>
              <Link href="/contact" className="mt-6 inline-flex rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white">{copy.contactAdmissions}</Link>
            </div>
          ) : status === "done" && result?.success ? (
            <div role="status" className="py-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">{result.alreadyRegistered ? copy.alreadyTitle : copy.successTitle}</h2>
              <p className="mt-3 text-gray-600">{result.alreadyRegistered ? copy.alreadyBody : copy.successBody}</p>
              {result.kakaoNotices === "ask" && result.phoneToken && <div className="mt-6"><WebinarPhoneForm id={result.eventId} token={result.phoneToken} place="success" /></div>}
              {result.kakaoNotices === "channel" && <div className="mt-6"><KakaoChannelNudge /></div>}
              {result.kakaoNotices === null && !form.email && <p className="mt-4 rounded-xl bg-yellow-50 px-4 py-3 text-left text-sm font-semibold text-gray-800">{copy.linkViaKakao}</p>}
              <div className="mt-6"><KakaoSignupCard place="success" className="-mx-3 sm:mx-0" /></div>
              {!user && (
                <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left">
                  <p className="font-bold text-gray-900">{copy.nextTitle}</p>
                  <p className="mt-1 text-sm text-gray-600">{copy.nextBody}</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Link href={registerHref} className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white">{copy.createAccount}</Link>
                    <Link href="/research" className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-800">{copy.browsePrograms}</Link>
                  </div>
                </div>
              )}
              {user && <Link href="/research" className="mt-8 inline-flex rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white">{copy.browsePrograms}</Link>}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-black text-gray-900">{copy.formTitle}</h2>
              <div role="tablist" aria-label={copy.formTitle} className="mt-4 flex gap-1 rounded-2xl bg-gray-100 p-1">
                <button type="button" role="tab" id="tab-kakao" aria-controls="panel-kakao" aria-selected={tab === "kakao"} onClick={() => setTab("kakao")} className={tabClass(tab === "kakao")}>
                  <MessageCircle className="h-4 w-4" aria-hidden />{copy.tabKakao}
                </button>
                <button type="button" role="tab" id="tab-form" aria-controls="panel-form" aria-selected={tab === "form"} onClick={() => setTab("form")} className={tabClass(tab === "form")}>
                  <PencilLine className="h-4 w-4" aria-hidden />{copy.tabForm}
                </button>
              </div>
              <div role="tabpanel" id="panel-kakao" aria-labelledby="tab-kakao" hidden={tab !== "kakao"} className="mt-6">
                <KakaoSignupCard place="page" />
              </div>
            <form role="tabpanel" id="panel-form" aria-labelledby="tab-form" hidden={tab !== "form"} onSubmit={submit} aria-busy={status === "sending"} noValidate className="mt-6 space-y-5">
              {notice && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{notice}</div>}
              <div>
                <label htmlFor="webinar-name" className="mb-2 block text-sm font-bold text-gray-700">{copy.name}</label>
                <input id="webinar-name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} autoComplete="name" className={input} aria-invalid={Boolean(errors.name)} />
                {errors.name && <p className="mt-1 text-sm text-red-700">{errorText(errors.name)}</p>}
              </div>
              <fieldset>
                <legend className="mb-2 block text-sm font-bold text-gray-700">{copy.role}</legend>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {(["PARENT", "STUDENT", "OTHER"] as const).map((value) => (
                    <label key={value} className="inline-flex items-center gap-2 text-sm text-gray-800">
                      <input type="radio" name="webinar-role" value={value} checked={form.role === value} onChange={() => set("role", value)} className="h-4 w-4 accent-blue-600" />{copy.roles[value]}
                    </label>
                  ))}
                </div>
                {errors.role && <p className="mt-1 text-sm text-red-700">{errorText(errors.role)}</p>}
              </fieldset>
              <div className={`rounded-2xl border p-4 ${errors.contact ? "border-red-300 bg-red-50/40" : "border-gray-200"}`}>
                <p className="mb-3 text-sm text-gray-600">{copy.contactHint}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="webinar-phone" className="mb-1 block text-xs font-bold text-gray-600">{copy.phone}</label>
                    <input id="webinar-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010-1234-5678" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={40} className={input} aria-invalid={Boolean(errors.phone)} aria-describedby={noticesOpen ? "webinar-phone-note" : undefined} />
                    {errors.phone && <p className="mt-1 text-xs text-red-700">{errorText(errors.phone)}</p>}
                  </div>
                  <div>
                    <label htmlFor="webinar-email" className="mb-1 block text-xs font-bold text-gray-600">{copy.email}</label>
                    <input id="webinar-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={254} className={input} aria-invalid={Boolean(errors.email)} />
                    {errors.email && <p className="mt-1 text-xs text-red-700">{errorText(errors.email)}</p>}
                  </div>
                </div>
                {noticesOpen && <p id="webinar-phone-note" className="mt-2 text-xs text-gray-500">{copy.phoneNote}</p>}
                {errors.contact && <p className="mt-2 text-sm font-medium text-red-700">{errorText(errors.contact)}</p>}
              </div>
              <div>
                <label htmlFor="webinar-question" className="mb-2 block text-sm font-bold text-gray-700">{copy.question}</label>
                <textarea id="webinar-question" rows={3} value={form.question} onChange={(e) => set("question", e.target.value)} maxLength={1000} className={input} />
              </div>
              <label className="flex items-start gap-3 text-sm text-gray-600">
                <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 h-4 w-4 accent-blue-600" aria-invalid={Boolean(errors.consent)} />
                <span>{copy.consent}<Link href="/privacy" className="text-blue-700 underline">{copy.consentLink}</Link></span>
              </label>
              {errors.consent && <p className="-mt-3 text-sm text-red-700">{errorText(errors.consent)}</p>}
              <p className="text-xs text-gray-500">{copy.adsNote}</p>
              <button type="submit" disabled={status === "sending"} className="w-full rounded-xl bg-black py-4 font-bold text-white shadow-md transition-all hover:bg-gray-900 disabled:opacity-70">
                {status === "sending" ? copy.submitting : copy.submit}
              </button>
              <p className="text-center text-xs text-gray-500">{copy.joinNote}</p>
            </form>
            </div>
          )}
        </div>
        <div className="lg:col-start-1 lg:row-start-2">
          <p className="text-lg leading-relaxed text-gray-600">{copy.intro}</p>
          <p className="mt-5 border-l-4 border-blue-700 pl-4 text-lg font-bold leading-relaxed text-gray-900">{copy.conclusion}</p>
          <h2 className="mt-10 text-xl font-black text-gray-900">{copy.agendaTitle}</h2>
          <ol className="mt-4 space-y-3">
            {copy.agenda.map((item, i) => (
              <li key={item} className="flex gap-3 text-gray-700"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">{i + 1}</span><span>{item}</span></li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  );
}
