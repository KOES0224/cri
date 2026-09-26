"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { safeCallbackUrl } from "@/lib/auth-input";
import { applicantRoleFromParam } from "@/lib/applicant";
import { useT } from "@/i18n/client";
import { metaTrack } from "@/lib/meta/pixel";
import { trackEvent } from "@/lib/analytics";
import type { Dictionary } from "@/i18n/config";

/** Maps the stable codes returned by /api/auth/onboard to the visitor's language; unknown codes fall back to the raw text. */
function onboardErrorMessage(code: string, t: Dictionary): string {
  const known: Record<string, string> = t.auth.onboarding.errors;
  return known[code] ?? (code || t.auth.onboarding.generic);
}

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const { data: session, status, update } = useSession();
  // Where to go after the role is saved: the application the person started, or the dashboard.
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [role, setRole] = useState<"STUDENT" | "PARENT">(() => applicantRoleFromParam(searchParams.get("role")));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Accounts that already chose a role (returning Google users, parents, admins) skip straight to their destination.
  const onboarded = status === "authenticated" && (session?.user?.role !== "STUDENT" || Boolean(session?.user?.studentCode));
  useEffect(() => {
    if (onboarded) router.replace(callbackUrl);
  }, [onboarded, callbackUrl, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const code = (await res.text()).trim();
        setError(onboardErrorMessage(code, t));
        setLoading(false);
        return;
      }

      const data = await res.json();
      trackEvent("sign_up", { role, method: "google" });
      if (data.eventId) metaTrack("CompleteRegistration", data.tracking || { content_name: role.toLowerCase() }, data.eventId);

      // Update NextAuth session state locally to avoid needing a hard refresh
      await update({
        ...session,
        user: { ...session?.user, role: data.role, studentCode: data.studentCode }
      });

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(t.auth.onboarding.unexpected);
      setLoading(false);
    }
  }

  const applying = callbackUrl.startsWith("/apply");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {t.auth.onboarding.title}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {applying ? t.auth.onboarding.subtitleApplying : t.auth.onboarding.subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t.auth.onboarding.roleLabel}</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={role === "STUDENT"}
                  onClick={() => setRole("STUDENT")}
                  className={`border rounded-md py-4 px-4 flex flex-col items-center justify-center text-sm font-medium transition-colors ${role === "STUDENT" ? "border-black bg-gray-50 text-black shadow-sm" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  <span className="text-lg mb-1">🎓</span>
                  {t.auth.onboarding.student}
                </button>
                <button
                  type="button"
                  aria-pressed={role === "PARENT"}
                  onClick={() => setRole("PARENT")}
                  className={`border rounded-md py-4 px-4 flex flex-col items-center justify-center text-sm font-medium transition-colors ${role === "PARENT" ? "border-black bg-gray-50 text-black shadow-sm" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  <span className="text-lg mb-1">👨‍👩‍👧</span>
                  {t.auth.onboarding.parent}
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500">{t.auth.onboarding.note}</p>
            </div>

            {error && (
              <div role="alert" className="text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || onboarded}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-50"
              >
                {loading ? t.auth.onboarding.submitting : applying ? t.auth.onboarding.continueApply : t.auth.onboarding.continueDashboard}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-black animate-spin" /></div>}>
      <OnboardingForm />
    </Suspense>
  );
}
