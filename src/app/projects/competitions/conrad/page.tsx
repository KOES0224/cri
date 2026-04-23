import Link from "next/link";

export default function ConradDashboard() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="text-center mb-20 relative">
        <span className="inline-block px-4 py-2 bg-red-500/10 text-[#f42c40] font-bold text-sm tracking-wider uppercase rounded-full border border-red-500/20 mb-6 shadow-[0_0_15px_rgba(244,44,64,0.15)]">Conrad Challenger Program</span>
        <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent tracking-tighter">Welcome to the Winning Plan</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          10 weeks to transform from an idea to a Pete Conrad Scholar. Follow the roadmap, trust the process, and focus on the customer.
        </p>
        <Link href="/projects/competitions/conrad/week1" className="inline-flex px-8 py-4 bg-gradient-to-r from-[#f42c40] to-[#b91d2d] text-white font-bold rounded-xl hover:shadow-[0_4px_20px_rgba(244,44,64,0.5)] transition-all hover:-translate-y-1 text-lg">
          Start Module 1
        </Link>
      </section>

      <section className="mb-20">
        <h2 className="text-3xl font-bold mb-10 text-center tracking-tight">Your Curriculum Roadmap</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Week 1 */}
          <Link href="/projects/competitions/conrad/week1" className="bg-[#14141c]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:-translate-y-2 hover:border-[#f42c40]/50 transition-all duration-300 group shadow-xl relative overflow-hidden flex flex-col items-start leading-relaxed">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#f42c40] transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
            <span className="text-[#f42c40] font-bold text-sm tracking-wider mb-2">WEEK 01</span>
            <h3 className="text-2xl font-bold text-white mb-3">Customer vs. Builder</h3>
            <p className="text-gray-400 mb-6">Why most ideas fail before they start. Master the art of finding a bleeding-neck problem before building a solution.</p>
            <span className="mt-auto px-4 py-2 border border-white/20 rounded-lg text-sm group-hover:bg-white/5 transition-colors">View Module</span>
          </Link>

          {/* Week 2 */}
          <Link href="/projects/competitions/conrad/week2" className="bg-[#14141c]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:-translate-y-2 hover:border-[#f42c40]/50 transition-all duration-300 group shadow-xl relative overflow-hidden flex flex-col items-start leading-relaxed">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#f42c40] transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
            <span className="text-[#f42c40] font-bold text-sm tracking-wider mb-2">WEEK 02</span>
            <h3 className="text-2xl font-bold text-white mb-3">Deconstructing Winners</h3>
            <p className="text-gray-400 mb-6">Analyze past Pete Conrad Scholars like Aquaneer Vietnam. Formulate your Unique Value Proposition (UVP).</p>
            <span className="mt-auto px-4 py-2 border border-white/20 rounded-lg text-sm group-hover:bg-white/5 transition-colors">View Module</span>
          </Link>

          {/* Week 3 */}
          <Link href="/projects/competitions/conrad/lean-canvas" className="bg-[#14141c]/60 backdrop-blur-xl border border-[#00e5ff]/30 rounded-2xl p-8 hover:-translate-y-2 hover:border-[#00e5ff] transition-all duration-300 group shadow-xl relative overflow-hidden flex flex-col items-start leading-relaxed">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/10 blur-2xl rounded-full"></div>
            <span className="text-[#00e5ff] font-bold text-sm tracking-wider mb-2">WEEK 03 (SUBMISSION)</span>
            <h3 className="text-2xl font-bold text-white mb-3">Business Economics</h3>
            <p className="text-gray-400 mb-6">Mapping revenue streams, channels, and finalizing the 12-question Lean Canvas for Stage 1 Submission.</p>
            <span className="mt-auto px-4 py-2 bg-[#00e5ff]/10 text-[#00e5ff] rounded-lg text-sm group-hover:bg-[#00e5ff]/20 transition-colors">View Lean Canvas</span>
          </Link>

          {/* Locked Weeks */}
          {[
            { w: "04", title: "The Team Story & Impact", desc: "Drafting the Innovation Brief. Communicating your founding narrative and societal impact." },
            { w: "05", title: "Financial Validation", desc: "Sizing the market (TAM/SAM/SOM) and detailing the Go-To-Market strategy." },
            { w: "06", title: "Prototyping & Models", desc: "Building 3D CAD models, wireframes, or physical prototypes needed for the video." },
            { w: "07", title: "The Digital Footprint", desc: "Building the team website and finalizing the 3,000-word Innovation Brief." },
            { w: "08", title: "Scripting the Video", desc: "Storyboarding the 3-5 minute Innovation video pitch. Master visual storytelling." },
            { w: "09", title: "Video Production", desc: "Recording day. Focus on vocal delivery, presence, and showcasing the prototype." },
            { w: "10", title: "The Grilling (Live Pitch)", desc: "Simulating the judge panels. Q&A defense practice to handle tough technical questions." },
          ].map((col) => (
            <div key={col.w} className="bg-[#14141c]/30 backdrop-blur-sm border border-white/5 rounded-2xl p-8 opacity-50 select-none cursor-not-allowed grayscale">
              <span className="text-gray-600 font-bold text-sm tracking-wider mb-2 block">WEEK {col.w}</span>
              <h3 className="text-xl font-bold text-gray-500 mb-3">{col.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{col.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
