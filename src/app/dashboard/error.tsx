"use client";
export default function DashboardError({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-8"><h2 className="text-xl font-bold">This page could not be loaded</h2><p className="mt-2 text-sm text-slate-600">Please try again. If the issue continues, return to the overview and reopen this page.</p><button onClick={reset} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Try again</button></div>;
}
