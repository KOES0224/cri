export default function DashboardLoading() {
  return <div role="status" aria-label="Loading dashboard" className="space-y-6 p-4 motion-safe:animate-pulse"><span className="sr-only">Loading dashboard…</span><div className="h-8 w-48 rounded-lg bg-slate-200" /><div className="grid gap-4 sm:grid-cols-3">{[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white" />)}</div><div className="h-72 rounded-2xl border border-slate-200 bg-white" /></div>;
}
