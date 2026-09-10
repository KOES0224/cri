"use client";
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
function RecoveryForm() {
  const params = useSearchParams();
  const token = params.get('token');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget);
    if (token && data.get('password') !== data.get('confirm')) { setError('The passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token ? { token, password: data.get('password') } : { email: data.get('email') }) });
      const result = await response.json();
      if (!response.ok) setError(result.error); else setMessage(result.message);
    } catch { setError('Check your connection and try again.'); } finally { setBusy(false); }
  }
  return <div className="max-w-lg mx-auto px-6 pt-40 pb-24"><h1 className="text-3xl font-bold text-gray-900">{token ? 'Set a new password' : 'Recover your account'}</h1>
    <p className="text-gray-600 mt-4 mb-6">{token ? 'Choose a unique password with at least 12 characters. The link expires after 30 minutes and works once.' : 'Enter your account email to request a reset link. If you joined using Google, use Google sign-in instead.'}</p>
    {message ? <p role="status" className="rounded-2xl bg-blue-50 p-5 text-blue-900">{message}</p> : <form onSubmit={submit} aria-busy={busy} className="space-y-5">
      {token ? <>{['password','confirm'].map(name=><div key={name}><label htmlFor={name} className="block font-semibold mb-2">{name==='password' ? 'New password' : 'Confirm password'}</label><input id={name} name={name} type="password" autoComplete="new-password" minLength={12} maxLength={72} required className="w-full border border-gray-300 rounded-xl p-3" /></div>)}</> : <div><label htmlFor="email" className="block font-semibold mb-2">Email address</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className="w-full border border-gray-300 rounded-xl p-3" /></div>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button disabled={busy} className="w-full bg-gray-900 text-white font-semibold rounded-xl p-3 disabled:opacity-50">{busy ? 'Please wait…' : token ? 'Update password' : 'Send reset link'}</button>
    </form>}
    <Link href="/auth/login" className="block mt-6 text-blue-700 underline">Back to sign in</Link><p className="text-sm text-gray-600 mt-6">Need help? Email <a href="mailto:support@cri.kr" className="underline">support@cri.kr</a>. Never send your password or reset link.</p>
  </div>;
}
export default function RecoveryPage() { return <Suspense fallback={<p className="pt-40 text-center">Loading account recovery…</p>}><RecoveryForm /></Suspense>; }
