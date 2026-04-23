import Link from "next/link";

export default function ConradLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0e] text-[#f8f8fb] font-sans selection:bg-[#f42c40] selection:text-white pb-20">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-10 w-96 h-96 bg-[#f42c40] rounded-full mix-blend-screen filter blur-[150px] opacity-10 blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-[#00e5ff] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.03] blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Embedded internal navigation for the portal */}
      <nav className="sticky top-0 z-50 px-6 py-4 bg-[#0a0a0e]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
        <div className="text-xl font-black tracking-tight flex items-center gap-2">
          <span className="text-[#f42c40]">CRI</span> Catalyst
        </div>
        <div className="flex gap-8 text-sm font-medium">
          <Link href="/projects/competitions/conrad" className="text-gray-400 hover:text-white transition-colors hover:border-b-2 hover:border-[#f42c40] pb-1">Dashboard</Link>
          <Link href="/projects/competitions/conrad/week1" className="text-gray-400 hover:text-white transition-colors hover:border-b-2 hover:border-[#f42c40] pb-1">Modules</Link>
          <Link href="/projects/competitions/conrad/lean-canvas" className="text-gray-400 hover:text-white transition-colors hover:border-b-2 hover:border-[#f42c40] pb-1">Lean Canvas</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pt-12">
        {children}
      </main>
    </div>
  );
}
