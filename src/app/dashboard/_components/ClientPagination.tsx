"use client";
export default function ClientPagination({ page, total, pageSize = 25, onChange }: { page: number; total: number; pageSize?: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm"><p className="text-slate-500">{total === 0 ? "0 results" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}</p><nav aria-label="List pagination" className="flex items-center gap-3"><button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button><span className="text-xs text-slate-500">Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button></nav></div>;
}
