"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Link2, Loader2, Copy } from "lucide-react";
import { adminCreateStudentFromApplication, adminLinkApplicationStudent } from "@/app/actions/linking";

type Props = { application: { id: string; studentId: string | null; student: { id: string; name: string | null; studentCode: string | null } | null; user: { role: string } } };

/**
 * Shown under the applicant when a parent or agency applied: lets admissions create the student's
 * account from the application (or link an existing one) so the enrollment lands on the student.
 */
export default function StudentAccountControl({ application }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [linking, setLinking] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string; tempPassword?: string | null } | null>(null);

  if (application.user.role !== "PARENT" && !application.studentId) return null;

  if (application.student) {
    return (
      <div className="mt-1.5 text-[11px] text-gray-500">
        Student: <Link href={`/dashboard/users/${application.student.id}`} className="font-semibold text-purple-700 hover:underline">{application.student.name || "account"}</Link>
        {application.student.studentCode && <span className="ml-1 font-mono">{application.student.studentCode}</span>}
      </div>
    );
  }

  async function create() {
    setBusy(true); setResult(null);
    const res = await adminCreateStudentFromApplication(application.id);
    setBusy(false);
    if (res.success) {
      setResult({ ok: true, text: res.created ? `Student account created for ${res.studentName}${res.emailed ? " and a welcome email was sent." : ". Email is not configured, so pass on the temporary password below."}` : `Linked existing student account ${res.studentName}.`, tempPassword: res.tempPassword });
      router.refresh();
    } else setResult({ ok: false, text: res.error });
  }

  async function link(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setResult(null);
    const res = await adminLinkApplicationStudent(application.id, identifier);
    setBusy(false);
    if (res.success) { setResult({ ok: true, text: `Linked to ${res.student?.name || "student account"}.` }); setLinking(false); router.refresh(); }
    else setResult({ ok: false, text: res.error });
  }

  return (
    <div className="mt-1.5 text-[11px] whitespace-normal max-w-[260px]">
      <span className="text-amber-700 font-semibold">Guardian applied · no student account</span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <button type="button" disabled={busy} onClick={() => void create()} className="inline-flex items-center rounded-md bg-purple-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <><UserPlus className="h-3 w-3 mr-1" /> Create student account</>}
        </button>
        <button type="button" disabled={busy} onClick={() => setLinking((v) => !v)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50">
          <Link2 className="h-3 w-3 mr-1" /> Link existing
        </button>
      </div>
      {linking && (
        <form onSubmit={link} className="mt-1.5 flex gap-1">
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="Student code or email" className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] outline-none focus:border-purple-500" />
          <button type="submit" disabled={busy} className="rounded-md bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white">Link</button>
        </form>
      )}
      {result && (
        <div className={`mt-1.5 rounded-md p-2 ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          <p>{result.text}</p>
          {result.tempPassword && (
            <p className="mt-1 flex items-center gap-1 font-mono text-xs text-gray-900">
              {result.tempPassword}
              <button type="button" title="Copy" onClick={() => { void navigator.clipboard?.writeText(result.tempPassword || ""); }} className="text-gray-500 hover:text-gray-900"><Copy className="h-3 w-3" /></button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
