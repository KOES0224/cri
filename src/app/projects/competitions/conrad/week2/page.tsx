import Link from "next/link";

export default function Week2() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <span className="inline-block px-3 py-1 bg-red-500/10 text-[#f42c40] font-bold text-xs uppercase tracking-wider rounded-md border border-red-500/20">MODULE 02</span>
          <span className="text-gray-400 font-medium text-sm">Conrad Activation Stage</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-6">Deconstructing Winners & UVP</h1>
        <p className="text-xl text-gray-400 max-w-3xl leading-relaxed">
          Learn what a winning submission looks like by analyzing past Pete Conrad Scholars. Formulate your Unique Value Proposition (UVP).
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#14141c]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl relative overflow-hidden">
             {/* Glow for Case Study */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
            <h3 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4 text-white">Case Study 1: Aquaneer Vietnam</h3>
            <p className="text-gray-400 mb-4 text-sm font-medium uppercase tracking-wider">2024-2025 Scholarship Winner</p>
            <p className="text-gray-300 mb-4 leading-relaxed"><strong className="text-white font-semibold">The Wrong Approach:</strong> "We want to make a cool water filter using chemistry."</p>
            <p className="text-gray-300 mb-8 leading-relaxed"><strong className="text-white font-semibold">The Winning Approach:</strong> This team identified a very specific local problem—shrimp waste abundance causing poor water quality. They developed a sustainable water filtration system using chitosan extracted from the exact shrimp waste polluting their local environment.</p>
            
            <div className="bg-[#00e5ff]/5 border-l-4 border-[#00e5ff] p-6 rounded-r-xl">
              <h4 className="text-[#00e5ff] font-bold mb-2 flex items-center gap-2 text-lg">🏆 Why They Won</h4>
              <p className="text-gray-300">Their solution was deeply rooted in a tangible problem. It was culturally relevant, environmentally sustainable, and highly cost-effective because the raw material (shrimp waste) was fundamentally free and abundant.</p>
            </div>
          </div>

          <div className="bg-[#14141c]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl relative overflow-hidden">
            {/* Glow for Case Study */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 blur-3xl rounded-full"></div>
            <h3 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4 text-white">Case Study 2: Pollution Patrol</h3>
            <p className="text-gray-300 mb-4 leading-relaxed"><strong className="text-white font-semibold">The Wrong Approach:</strong> "Let's build an awesome drone."</p>
            <p className="text-gray-300 mb-8 leading-relaxed"><strong className="text-white font-semibold">The Winning Approach:</strong> This team developed an environmental drone specifically to analyze air quality and identify pollutants in regions suffering from severe wildfires. They tied the technology directly to a tangible health crisis.</p>
            
            <div className="bg-red-500/5 border-l-4 border-[#f42c40] p-6 rounded-r-xl">
              <h4 className="text-[#f42c40] font-bold mb-2 flex items-center gap-2 text-lg">🏆 Why They Won</h4>
              <p className="text-gray-300">They didn't just build hardware; they proved that their drone provided real-time, life-saving analytics on public health risks, converting "drone tech" into "medical prevention tech".</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#14141c] to-[#1f0a0d] border border-[#f42c40]/30 rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-4 text-[#f42c40]">The Unique Value Proposition (UVP)</h3>
            <p className="text-gray-300 leading-relaxed mb-6">Now that you have your Problem (Week 1), what makes your solution better than anything else in the world? Your UVP must state clearly why a user should choose you over the current alternatives.</p>
            <div className="p-4 border-l-2 border-gray-500 bg-white/5 rounded-r-md">
              <em className="text-gray-300 block">Formula: We help [Target Audience] solve [Specific Problem] by doing [Our Unique Solution], so they can [End Benefit].</em>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-[#14141c]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
            <h4 className="font-bold text-lg mb-6 border-b border-white/10 pb-4">Week 2 Checklist</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-5 h-5 rounded border-2 border-gray-600 flex-shrink-0 mt-1 hover:border-[#f42c40] transition-colors cursor-pointer"></div>
                <div>
                  <strong className="block text-white mb-1">Analyze Competitors</strong>
                  <span className="text-gray-500 text-sm leading-snug block">List 3 existing solutions to your problem and why they fail.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 rounded border-2 border-gray-600 flex-shrink-0 mt-1 hover:border-[#f42c40] transition-colors cursor-pointer"></div>
                <div>
                  <strong className="block text-white mb-1">Draft the UVP</strong>
                  <span className="text-gray-500 text-sm leading-snug block">Write a 1-sentence UVP using the formula.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 rounded border-2 border-gray-600 flex-shrink-0 mt-1 hover:border-[#f42c40] transition-colors cursor-pointer"></div>
                <div>
                  <strong className="block text-white mb-1">Define the Solution</strong>
                  <span className="text-gray-500 text-sm leading-snug block">What are the top 3 features of your innovation?</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 rounded border-2 border-gray-600 flex-shrink-0 mt-1 hover:border-[#f42c40] transition-colors cursor-pointer"></div>
                <div>
                  <strong className="block text-white mb-1">Update Canvas</strong>
                  <span className="text-gray-500 text-sm leading-snug block">Fill in Solution, UVP, and Alternatives blocks.</span>
                </div>
              </li>
            </ul>
            <div className="flex gap-4 mt-8">
              <Link href="/projects/competitions/conrad/week1" className="flex-1 py-3 border border-white/20 text-white font-bold text-center rounded-lg hover:bg-white/5 transition-all">Back</Link>
              <Link href="/projects/competitions/conrad/lean-canvas" className="flex-1 py-3 bg-[#00e5ff]/20 text-[#00e5ff] font-bold text-center rounded-lg hover:bg-[#00e5ff]/30 border border-[#00e5ff]/50 transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)]">Next</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
