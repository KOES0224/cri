"use client";

import { useActionState, useRef, useState } from "react";
import { createFeeCode, type FeeCodeFormState } from "@/app/actions/feeCodes";

const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const label = "mb-1 block text-xs font-semibold text-slate-600";

/** A random code that is easy to read aloud: no 0/O or 1/I. */
function suggestion() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = crypto.getRandomValues(new Uint8Array(6));
  return `CRI-${Array.from(values, (value) => alphabet[value % alphabet.length]).join("")}`;
}

/** Admin form for a new referral code. `normalFee` is the application fee without a code, in US dollars. */
export default function FeeCodeForm({ normalFee }: { normalFee: number }) {
  const [state, action, pending] = useActionState<FeeCodeFormState, FormData>(createFeeCode, {});
  const [kind, setKind] = useState<"waive" | "reduce">("waive");
  const code = useRef<HTMLInputElement>(null);
  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">New code</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fee-code" className={label}>Code</label>
          <div className="flex gap-2">
            <input ref={code} id="fee-code" name="code" required maxLength={32} placeholder="e.g. ABC-EDU" autoComplete="off" spellCheck={false} className={`${input} uppercase`} />
            <button type="button" onClick={() => { if (code.current) code.current.value = suggestion(); }} className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700">Suggest</button>
          </div>
          <p className="mt-1 text-xs text-slate-500">4 to 32 letters, digits or hyphens. This is what the applicant types.</p>
        </div>
        <div>
          <label htmlFor="fee-partner" className={label}>Given to</label>
          <input id="fee-partner" name="partner" required maxLength={120} placeholder="Agency or school name" className={input} />
          <p className="mt-1 text-xs text-slate-500">Only admins see this.</p>
        </div>
        <fieldset>
          <legend className={label}>What the applicant pays</legend>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-800">
            <label className="inline-flex items-center gap-2"><input type="radio" name="kind" checked={kind === "waive"} onChange={() => setKind("waive")} className="h-4 w-4 accent-blue-600" />Nothing (fee waived)</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="kind" checked={kind === "reduce"} onChange={() => setKind("reduce")} className="h-4 w-4 accent-blue-600" />A reduced fee</label>
          </div>
          {kind === "reduce" ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-slate-600">$</span>
              <input name="feeAmount" type="number" min={1} max={normalFee - 1} step={1} required defaultValue={Math.floor(normalFee / 2)} aria-label="Reduced fee in US dollars" className={`${input} max-w-[7rem]`} />
              <span className="text-sm text-slate-600">USD instead of ${normalFee}</span>
            </div>
          ) : <input type="hidden" name="feeAmount" value="0" />}
        </fieldset>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fee-uses" className={label}>Uses allowed</label>
            <input id="fee-uses" name="maxUses" type="number" min={1} step={1} placeholder="No limit" className={input} />
          </div>
          <div>
            <label htmlFor="fee-expires" className={label}>Last valid day (KST)</label>
            <input id="fee-expires" name="expiresAt" type="date" className={input} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="fee-note" className={label}>Note (optional)</label>
          <input id="fee-note" name="note" maxLength={500} placeholder="e.g. winter 2026 cohort, agreed with Ms. Kim" className={input} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">{pending ? "Saving…" : "Create code"}</button>
        {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        {state.created && <p role="status" className="text-sm text-emerald-700">Created <span className="font-mono font-semibold">{state.created}</span>. It can be used right away.</p>}
      </div>
    </form>
  );
}
