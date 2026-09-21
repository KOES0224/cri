"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link2, Loader2, Users, GraduationCap } from "lucide-react";
import { adminSetGuardian, adminAddChild } from "@/app/actions/linking";

type Person = { id: string; name: string | null; email: string; studentCode?: string | null; isAgency?: boolean; agencyName?: string | null };

/** Admin controls for the guardian ↔ student relationship on a person's profile. */
export default function GuardianLinkPanel({ user, guardian, children }: { user: { id: string; role: string }; guardian: Person | null; children: Person[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(action: () => Promise<{ success: boolean; error?: string }>, okText: string) {
    setBusy(true); setMessage(null);
    const result = await action();
    setBusy(false);
    if (result.success) { setMessage({ ok: true, text: okText }); setValue(""); router.refresh(); }
    else setMessage({ ok: false, text: result.error || "Something went wrong." });
  }

  if (user.role === "STUDENT") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50"><h3 className="text-lg font-bold text-gray-900 flex items-center"><Users className="w-5 h-5 mr-2 text-purple-600" /> Guardian</h3></div>
        <div className="p-6 space-y-4 text-sm">
          {guardian ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/dashboard/users/${guardian.id}`} className="font-semibold text-gray-900 hover:text-blue-600">{guardian.name || guardian.email}</Link>
                <p className="text-xs text-gray-500">{guardian.email}{guardian.isAgency ? ` · Agency: ${guardian.agencyName || "unnamed"}` : " · Parent"}</p>
              </div>
              <button type="button" disabled={busy} onClick={() => { if (confirm("Remove the guardian link?")) void run(() => adminSetGuardian(user.id, null), "Guardian link removed."); }} className="text-xs font-semibold text-gray-400 hover:text-red-600 disabled:opacity-50">Unlink</button>
            </div>
          ) : (
            <p className="text-gray-500">No parent or agency is linked to this student.</p>
          )}
          <form onSubmit={(event) => { event.preventDefault(); void run(() => adminSetGuardian(user.id, value), "Guardian linked."); }} className="flex gap-2">
            <input type="email" required value={value} onChange={(event) => setValue(event.target.value)} placeholder="guardian@example.com" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            <button type="submit" disabled={busy} className="inline-flex items-center rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Link2 className="h-3.5 w-3.5 mr-1" /> {guardian ? "Change" : "Link"}</>}</button>
          </form>
          <p className="text-xs text-gray-400">The guardian must already have a parent / agency account with this email.</p>
          {message && <p role="status" className={message.ok ? "text-emerald-700" : "text-red-700"}>{message.text}</p>}
        </div>
      </div>
    );
  }

  if (user.role === "PARENT") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50"><h3 className="text-lg font-bold text-gray-900 flex items-center"><GraduationCap className="w-5 h-5 mr-2 text-purple-600" /> Linked students <span className="ml-2 text-xs font-semibold text-gray-400">{children.length}</span></h3></div>
        <div className="p-6 space-y-4 text-sm">
          {children.length === 0 ? <p className="text-gray-500">No students linked to this account yet.</p> : (
            <ul className="divide-y divide-gray-100">
              {children.map((child) => (
                <li key={child.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <Link href={`/dashboard/users/${child.id}`} className="font-semibold text-gray-900 hover:text-blue-600">{child.name || child.email}</Link>
                    <p className="text-xs text-gray-500">{child.email}{child.studentCode ? <span className="ml-2 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{child.studentCode}</span> : null}</p>
                  </div>
                  <button type="button" disabled={busy} onClick={() => { if (confirm(`Unlink ${child.name || child.email} from this guardian?`)) void run(() => adminSetGuardian(child.id, null), "Student unlinked."); }} className="text-xs font-semibold text-gray-400 hover:text-red-600 disabled:opacity-50">Unlink</button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={(event) => { event.preventDefault(); void run(() => adminAddChild(user.id, value), "Student linked."); }} className="flex gap-2">
            <input required value={value} onChange={(event) => setValue(event.target.value)} placeholder="Student code or email" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            <button type="submit" disabled={busy} className="inline-flex items-center rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Link2 className="h-3.5 w-3.5 mr-1" /> Add</>}</button>
          </form>
          {message && <p role="status" className={message.ok ? "text-emerald-700" : "text-red-700"}>{message.text}</p>}
        </div>
      </div>
    );
  }
  return null;
}
