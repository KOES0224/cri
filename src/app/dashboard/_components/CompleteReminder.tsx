"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { markNotificationRead } from "@/app/actions/crm";
export default function CompleteReminder({ id }: { id: string }) {
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const router = useRouter();
  return <><button disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await markNotificationRead(id); router.refresh(); } catch { setError("Could not complete this reminder. Please retry."); } finally { setBusy(false); } }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">{busy ? "Saving…" : "Mark complete"}</button>{error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}</>;
}
