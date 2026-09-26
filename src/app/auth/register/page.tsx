"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { safeCallbackUrl } from "@/lib/auth-input";
import { applicantRoleFromParam } from "@/lib/applicant";
import { PASSWORD_MIN_LENGTH } from "@/lib/password-policy";
import { signIn } from "next-auth/react";
import { trackEvent } from "@/lib/analytics";
import { useT } from "@/i18n/client";
import { metaTrack, newEventId } from "@/lib/meta/pixel";
import type { Dictionary } from "@/i18n/config";

/** Maps the stable codes returned by /api/auth/register to the visitor's language; unknown codes fall back to the raw text. */
function registerErrorMessage(code: string, t: Dictionary): string {
  const errors = t.auth.register.errors;
  const known: Record<string, string> = {
    name: errors.name,
    nameLong: errors.nameLong,
    email: errors.email,
    password: errors.password(PASSWORD_MIN_LENGTH),
    role: errors.role,
    form: errors.form,
    rate: errors.rate,
    exists: errors.exists,
    server: errors.server,
  };
  return known[code] ?? (code || t.auth.register.generic);
}

function ErrorAlert() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const { t } = useT();

  if (!authError) return null;

  let errorMessage = t.auth.oauthError.default;
  if (authError === "OAuthAccountNotLinked") {
    errorMessage = t.auth.register.notLinked;
  } else if (authError === "AccessDenied") {
    errorMessage = t.auth.oauthError.accessDenied;
  }

  return (
    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm font-medium text-center shadow-sm">
      {errorMessage}
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Preselected by the application start page (?role=PARENT) so parents are not registered as students by default.
  const [role, setRole] = useState<"STUDENT" | "PARENT">(() => applicantRoleFromParam(searchParams.get("role")));
  const applying = callbackUrl.startsWith("/apply");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const eventId = newEventId();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, eventId }),
      });

      if (!res.ok) {
        const code = (await res.text()).trim();
        setError(registerErrorMessage(code, t));
        setLoading(false);
        return;
      }

      trackEvent("sign_up", { role, method: "credentials" });
      const created = await res.json().catch(() => ({}));
      metaTrack("CompleteRegistration", created.tracking || { content_name: role.toLowerCase() }, eventId);
      // Auto login after successful registration
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setError(t.auth.register.autoLoginFailed);
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(t.auth.register.unexpected);
      setLoading(false);
    }
  }

  const handleOAuthSignIn = (provider: string) => {
    // Google accounts choose their role on the onboarding page, then continue to the same destination.
    signIn(provider, { callbackUrl: `/onboarding?role=${role}&callbackUrl=${encodeURIComponent(callbackUrl)}` });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center pt-44 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-28 left-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.auth.backToSite}
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {applying ? t.auth.register.titleApplying : t.auth.register.title}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {applying ? t.auth.register.subtitleApplying : t.auth.register.subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 shadow-sm rounded-2xl sm:px-10 border border-gray-200">

          <Suspense fallback={null}>
            <ErrorAlert />
          </Suspense>

          {!applying && <p className="text-sm text-gray-600 mb-6">{t.auth.newApplicant.a}<Link href="/admissions" className="text-blue-700 underline">{t.auth.newApplicant.link}</Link>{t.auth.newApplicant.b}</p>}
          <form aria-busy={loading} className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t.auth.register.roleLabel}</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={role === "STUDENT"} onClick={() => setRole("STUDENT")}
                  className={`border rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium transition-colors ${role === "STUDENT" ? "border-black bg-gray-50 text-black" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  {t.auth.register.student}
                </button>
                <button
                  type="button"
                  aria-pressed={role === "PARENT"} onClick={() => setRole("PARENT")}
                  className={`border rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium transition-colors ${role === "PARENT" ? "border-black bg-gray-50 text-black" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  {t.auth.register.parent}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t.auth.register.name}</label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder={t.auth.register.namePlaceholder}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t.auth.email}</label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={t.auth.emailPlaceholder}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t.auth.password}</label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={PASSWORD_MIN_LENGTH} maxLength={72} aria-describedby="password-help"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <p id="password-help" className="text-sm text-gray-600">{t.auth.register.passwordHelp(PASSWORD_MIN_LENGTH)}<Link href="/privacy" className="text-blue-700 underline">{t.auth.register.privacyLink}</Link></p>
            {error && (
              <div role="alert" className="text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-50"
              >
                {loading ? t.auth.register.submitting : applying ? t.auth.register.submitApplying : t.auth.register.submit}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-col space-y-3">
             <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t.auth.register.google}
              </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
             {t.auth.register.haveAccount}{" "}
             <Link
               href={callbackUrl !== "/dashboard" ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/login"}
               className="font-medium text-black hover:underline"
             >
               {t.auth.register.logIn}
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-black animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
