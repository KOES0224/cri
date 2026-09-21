"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";
import { linkStudentByCode, unlinkStudent } from "@/app/actions/linking";

export function LinkStudentForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(null);
    const result = await linkStudentByCode(code);
    setBusy(false);
    if (result.success) {
      setMessage({ ok: true, text: result.already ? `${result.studentName} is already linked to your account.` : `${result.studentName} is now linked to your account.` });
      setCode("");
      router.refresh();
    } else {
      setMessage({ ok: false, text: result.error });
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-purple-100 bg-purple-50/60 p-5">
      <label htmlFor="student-code" className="block text-sm font-semibold text-gray-900">Link a student by code</label>
      <p className="mt-1 text-xs text-gray-600">Ask your student for the 8-digit code on their Profile page. Linking lets you see their programs, assignments and feedback.</p>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          id="student-code"
          inputMode="numeric"
          pattern="[0-9 -]*"
          maxLength={10}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="12345678"
          className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 font-mono text-sm tracking-widest outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          required
        />
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Link2 className="mr-1.5 h-4 w-4" /> Link student</>}
        </button>
      </div>
      {message && <p role="status" className={`mt-3 text-sm ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
    </form>
  );
}

export function UnlinkStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function onClick() {
    if (!confirm(`Remove the link to ${studentName}? You will no longer see their program progress.`)) return;
    setBusy(true);
    const result = await unlinkStudent(studentId);
    setBusy(false);
    if (result.success) router.refresh(); else alert(result.error);
  }
  return <button type="button" onClick={onClick} disabled={busy} className="text-xs font-semibold text-gray-400 hover:text-red-600 disabled:opacity-50">Unlink</button>;
}
