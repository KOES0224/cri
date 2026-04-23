import Link from "next/link";

export default function Week1() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <span className="inline-block px-3 py-1 bg-red-500/10 text-[#f42c40] font-bold text-xs uppercase tracking-wider rounded-md border border-red-500/20">MODULE 01</span>
          <span className="text-gray-400 font-medium text-sm">Conrad Activation Stage</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-6">Customer vs. Builder Mindset</h1>
        <p className="text-xl text-gray-400 max-w-3xl leading-relaxed">
          Why most start-ups fail, and why most students lose their pitch before it begins. Learn to fall in love with the problem, not your solution.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#14141c]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4 text-white">The &quot;Builder&apos;s Trap&quot;</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">Many students enter the Conrad Challenge saying: <em className="text-white">&quot;I want to build a drone that plants trees!&quot;</em></p>
            <p className="text-gray-300 mb-8 leading-relaxed">This is the <strong>Builder&apos;s Trap</strong>. You have invented a solution looking for a problem. When the judges ask you <em>&quot;Who is going to pay for this drone?&quot;</em> or <em>&quot;Is this more cost-effective than humans planting trees?&quot;</em>, the project falls apart.</p>
            
            <div className="bg-[#00e5ff]/5 border-l-4 border-[#00e5ff] p-6 rounded-r-xl">
              <h4 className="text-[#00e5ff] font-bold mb-2 flex items-center gap-2 text-lg">💡 The Winning Approach</h4>
              <p className="text-gray-300">Instead of locking onto a solution immediately, we must first deeply understand an agonizing, costly problem for a specific group of people.</p>
            </div>
          </div>

          <div className="bg-[#14141c]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4 text-white">Customer-Centric Problem Finding</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">To win the Conrad Challenge, you must prove that your innovation is desperately needed. Ask yourselves these three questions:</p>
            <ul className="space-y-4 text-gray-300 list-decimal pl-6 mb-8 marker:text-[#f42c40] marker:font-bold">
              <li><strong className="text-white">Who is suffering?</strong> (Specific Customer Segment)</li>
              <li><strong className="text-white">What is the financial or human cost of their problem?</strong> (The stakes)</li>
              <li><strong className="text-white">How are they trying to solve it right now?</strong> (Current alternatives)</li>
            </ul>
            <p className="text-gray-400 italic">If you can answer those three things clearly, your Lean Canvas &quot;Problem&quot; section is already 90% complete.</p>
          </div>

          <div className="bg-gradient-to-br from-[#14141c] to-[#1f0a0d] border border-[#f42c40]/30 rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-4 text-[#f42c40]">Assignment: The Problem Statement</h3>
            <p className="text-gray-300 leading-relaxed">For your chosen category (e.g., Aerospace, Health, Environment), identify 3 specific, painful problems. Do NOT think about the solution yet. For each problem, identify who the &quot;Early Adopter&quot; would be—the person so desperate they would try a half-finished prototype.</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-[#14141c]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
            <h4 className="font-bold text-lg mb-6 border-b border-white/10 pb-4">Week 1 Checklist</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-5 h-5 rounded border-2 border-gray-600 flex-shrink-0 mt-1 hover:border-[#f42c40] transition-colors cursor-pointer"></div>
                <div>
                  <strong className="block text-white mb-1">Form Teams</strong>
                  <span className="text-gray-500 text-sm leading-snug block">2-5 students per team. Assign roles (CEO, CTO, Design).</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 rounded border-2 border-gray-600 flex-shrink-0 mt-1 hover:border-[#f42c40] transition-colors cursor-pointer"></div>
                <div>
                  <strong className="block text-white mb-1">Identify 3 Core Problems</strong>
                  <span className="text-gray-500 text-sm leading-snug block">Focus strictly on problems, no solutions yet.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 rounded border-2 border-gray-600 flex-shrink-0 mt-1 hover:border-[#f42c40] transition-colors cursor-pointer"></div>
                <div>
                  <strong className="block text-white mb-1">Define Target Audience</strong>
                  <span className="text-gray-500 text-sm leading-snug block">Who is your Early Adopter?</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 rounded border-2 border-gray-600 flex-shrink-0 mt-1 hover:border-[#f42c40] transition-colors cursor-pointer"></div>
                <div>
                  <strong className="block text-white mb-1">Draft Canvas (Section 1)</strong>
                  <span className="text-gray-500 text-sm leading-snug block">Draft the Problem & Customer Segments on the Lean Canvas.</span>
                </div>
              </li>
            </ul>
            <Link href="/projects/competitions/conrad/week2" className="block w-full py-3 mt-8 bg-gradient-to-r from-[#f42c40] to-[#b91d2d] text-white font-bold text-center rounded-lg hover:shadow-[0_4px_15px_rgba(244,44,64,0.4)] transition-all">
              Next: Week 2 Module
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
