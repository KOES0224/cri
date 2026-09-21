"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { GraduationCap, Users, ArrowRight } from "lucide-react";
import type { ApplicantRole } from "@/lib/applicant";
import { useT } from "@/i18n/client";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/** Account gate for the application: pick who is applying, then create an account or sign in and land straight back in the form. */
export default function StartOptions({ applyUrl }: { applyUrl: string }) {
  const { t } = useT();
  const copy = t.applyStart;
  const [role, setRole] = useState<ApplicantRole>("STUDENT");
  const [busy, setBusy] = useState(false);
  const registerUrl = `/auth/register?role=${role}&callbackUrl=${encodeURIComponent(applyUrl)}`;
  const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(applyUrl)}`;
  // Google sign-ups pass through onboarding so the chosen role is saved, then continue to the application.
  const googleCallback = `/onboarding?role=${role}&callbackUrl=${encodeURIComponent(applyUrl)}`;

  return (
    <aside className="lg:sticky lg:top-28 self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-slate-900">{copy.who}</h2>
      <p className="mt-1 text-sm text-slate-500">{copy.whyAccount}</p>

      <div className="mt-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label={copy.applicantType}>
        {([
          ["STUDENT", copy.student, GraduationCap],
          ["PARENT", copy.parent, Users],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={role === value}
            onClick={() => setRole(value)}
            className={`flex flex-col items-center justify-center rounded-xl border px-3 py-4 text-sm font-semibold transition-colors ${role === value ? "border-slate-900 bg-slate-50 text-slate-900 shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          >
            <Icon className="mb-2 h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        {role === "PARENT"
          ? copy.parentNote
          : copy.studentNote}
      </p>

      <div className="mt-6 space-y-3">
        <Link href={registerUrl} className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white hover:bg-black">
          {copy.createAccount} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => { setBusy(true); void signIn("google", { callbackUrl: googleCallback }); }}
          className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
        >
          <GoogleIcon /> {copy.google}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        {copy.already} <Link href={loginUrl} className="font-semibold text-slate-900 underline">{copy.signIn}</Link>
      </p>
    </aside>
  );
}
