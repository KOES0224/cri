"use client";

import { useState, useTransition } from "react";
import { createPaymentLink, type PaymentLinkFormState } from "@/app/actions/paymentLinks";
import { formatWon } from "@/lib/payment-links";

const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const label = "mb-1 block text-xs font-semibold text-slate-600";

/** The link with a copy button. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <a href={url} target="_blank" rel="noopener noreferrer" className="max-w-[16rem] truncate font-mono text-xs text-blue-700 underline">{url}</a>
      <button type="button" onClick={() => { void navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} className="shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700">{copied ? "복사됨" : "복사"}</button>
    </div>
  );
}

/** Admin form for a new payment link. Submitted by hand so a refused entry keeps what was typed. */
export default function PaymentLinkForm({ site }: { site: string }) {
  const [state, setState] = useState<PaymentLinkFormState>({});
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      try {
        const result = await createPaymentLink(data);
        setState(result);
        if (result.created) form.reset();
      } catch { setState({ error: "저장하지 못했습니다. 다시 시도해 주세요." }); }
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">새 결제 링크</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pl-student" className={label}>학생 이름</label>
          <input id="pl-student" name="studentName" required maxLength={40} placeholder="예: 홍길동" className={input} />
          <p className="mt-1 text-xs text-slate-500">결제 페이지와 토스 결제창 주문명에 표시됩니다.</p>
        </div>
        <div>
          <label htmlFor="pl-amount" className={label}>금액 (원)</label>
          <input id="pl-amount" name="amount" required inputMode="numeric" placeholder="예: 11,475,750" className={input} />
        </div>
        <div>
          <label htmlFor="pl-purpose" className={label}>결제 항목 (선택)</label>
          <input id="pl-purpose" name="purpose" maxLength={60} placeholder="비워 두면 'CRI 프로그램 비용'" className={input} />
        </div>
        <div>
          <label htmlFor="pl-note" className={label}>메모 (관리자만 보임, 선택)</label>
          <input id="pl-note" name="note" maxLength={500} placeholder="예: 겨울 프로그램 잔금, 어머님께 카톡 전달" className={input} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">{pending ? "만드는 중…" : "링크 만들기"}</button>
        {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      </div>
      {state.created && (
        <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">{state.created.studentName} 학생 · {formatWon(state.created.amount)} 결제 링크를 만들었습니다. 이 링크를 보내 주세요.</p>
          <div className="mt-2"><CopyLink url={`${site}/pay/${state.created.token}`} /></div>
        </div>
      )}
    </form>
  );
}
