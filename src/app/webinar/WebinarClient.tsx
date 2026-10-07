"use client";

import { useState } from "react";
import Link from "@/i18n/link";
import { CalendarDays, CheckCircle2, Clock, Video } from "lucide-react";
import { useT } from "@/i18n/client";
import { registerForWebinar, type WebinarResult } from "@/app/actions/webinar";
import { webinarErrors } from "@/lib/webinar-validation";
import { trackEvent } from "@/lib/analytics";
import { metaTrack } from "@/lib/meta/pixel";
import { WEBINAR } from "@/lib/webinar";

type Form = { name: string; role: "" | "PARENT" | "STUDENT" | "OTHER"; phone: string; email: string; kakaoId: string; question: string; consent: boolean };
const input = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-500";

export default function WebinarClient({ open, user }: { open: boolean; user: { name: string; email: string; role: string } | null }) {
  const { t } = useT();
  const copy = t.webinar;
  const [form, setForm] = useState<Form>({ name: user?.name || "", role: (user?.role as Form["role"]) || "", phone: "", email: user?.email || "", kakaoId: "", question: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [closed, setClosed] = useState(!open);
  const [result, setResult] = useState<WebinarResult | null>(null);
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
        if (res.code === "closed") { setClosed(true); setStatus("idle"); return; }
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 pt-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-700">{copy.eyebrow}</p>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl">{copy.title}</h1>
          <p className="mt-5 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{copy.when}</span>
          </p>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">{copy.intro}</p>
          <h2 className="mt-10 text-xl font-black text-gray-900">{copy.agendaTitle}</h2>
          <ol className="mt-4 space-y-3">
            {copy.agenda.map((item, i) => (
              <li key={item} className="flex gap-3 text-gray-700"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">{i + 1}</span><span>{item}</span></li>
            ))}
          </ol>
          <p className="mt-8 inline-flex items-start gap-2 text-sm text-gray-500"><Video className="mt-0.5 h-4 w-4 shrink-0" />{copy.joinNote}</p>
        </div>

        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-[0_20px_40px_rgb(0,0,0,0.04)] sm:p-10">
          {closed ? (
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
            <form onSubmit={submit} aria-busy={status === "sending"} noValidate className="space-y-5">
              <h2 className="text-2xl font-bold text-gray-900">{copy.formTitle}</h2>
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
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="webinar-phone" className="mb-1 block text-xs font-bold text-gray-600">{copy.phone}</label>
                    <input id="webinar-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={40} className={input} aria-invalid={Boolean(errors.phone)} />
                    {errors.phone && <p className="mt-1 text-xs text-red-700">{errorText(errors.phone)}</p>}
                  </div>
                  <div>
                    <label htmlFor="webinar-email" className="mb-1 block text-xs font-bold text-gray-600">{copy.email}</label>
                    <input id="webinar-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={254} className={input} aria-invalid={Boolean(errors.email)} />
                    {errors.email && <p className="mt-1 text-xs text-red-700">{errorText(errors.email)}</p>}
                  </div>
                  <div>
                    <label htmlFor="webinar-kakao" className="mb-1 block text-xs font-bold text-gray-600">{copy.kakao}</label>
                    <input id="webinar-kakao" value={form.kakaoId} onChange={(e) => set("kakaoId", e.target.value)} maxLength={60} className={input} aria-invalid={Boolean(errors.kakaoId)} />
                    {errors.kakaoId && <p className="mt-1 text-xs text-red-700">{errorText(errors.kakaoId)}</p>}
                  </div>
                </div>
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
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
