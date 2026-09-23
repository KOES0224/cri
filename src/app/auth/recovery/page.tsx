"use client";
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/i18n/client';
import type { Dictionary } from '@/i18n/config';

type RecoveryResponse = { code?: string; error?: string; message?: string };

/** Maps the `code` returned by /api/auth/recovery to the visitor's language; unknown codes fall back to the API text. */
function recoveryText(result: RecoveryResponse, t: Dictionary): string {
  const known: Record<string, string> = { ...t.auth.recovery.messages, ...t.auth.recovery.errors };
  return (result.code && known[result.code]) || result.error || result.message || t.auth.recovery.errors.generic;
}

function RecoveryForm() {
  const params = useSearchParams();
  const { t } = useT();
  const token = params.get('token');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget);
    if (token && data.get('password') !== data.get('confirm')) { setError(t.auth.recovery.mismatch); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token ? { token, password: data.get('password') } : { email: data.get('email') }) });
      const result: RecoveryResponse = await response.json();
      if (!response.ok) setError(recoveryText(result, t)); else setMessage(recoveryText(result, t));
    } catch { setError(t.auth.recovery.network); } finally { setBusy(false); }
  }
  return <div className="max-w-lg mx-auto px-6 pt-40 pb-24"><h1 className="text-3xl font-bold text-gray-900">{token ? t.auth.recovery.titleReset : t.auth.recovery.title}</h1>
    <p className="text-gray-600 mt-4 mb-6">{token ? t.auth.recovery.introReset : t.auth.recovery.intro}</p>
    {message ? <p role="status" className="rounded-2xl bg-blue-50 p-5 text-blue-900">{message}</p> : <form onSubmit={submit} aria-busy={busy} className="space-y-5">
      {token ? <>{['password','confirm'].map(name=><div key={name}><label htmlFor={name} className="block font-semibold mb-2">{name==='password' ? t.auth.recovery.newPassword : t.auth.recovery.confirmPassword}</label><input id={name} name={name} type="password" autoComplete="new-password" minLength={12} maxLength={72} required className="w-full border border-gray-300 rounded-xl p-3" /></div>)}</> : <div><label htmlFor="email" className="block font-semibold mb-2">{t.auth.email}</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className="w-full border border-gray-300 rounded-xl p-3" /></div>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button disabled={busy} className="w-full bg-gray-900 text-white font-semibold rounded-xl p-3 disabled:opacity-50">{busy ? t.auth.recovery.wait : token ? t.auth.recovery.update : t.auth.recovery.send}</button>
    </form>}
    <Link href="/auth/login" className="block mt-6 text-blue-700 underline">{t.auth.recovery.backToSignIn}</Link><p className="text-sm text-gray-600 mt-6">{t.auth.recovery.help.a}<a href="mailto:support@cri.kr" className="underline">support@cri.kr</a>{t.auth.recovery.help.b}</p>
  </div>;
}
function RecoveryFallback() { const { t } = useT(); return <p className="pt-40 text-center">{t.auth.recovery.loading}</p>; }
export default function RecoveryPage() { return <Suspense fallback={<RecoveryFallback />}><RecoveryForm /></Suspense>; }
