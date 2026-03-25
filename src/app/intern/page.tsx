import { Briefcase, Network, Sparkles, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import InternshipListClient from "./_components/InternshipListClient";
import { getSiteContent } from "@/app/actions/siteContent";

// Revalidate this page every hour (or use dynamic rendering if you prefer real-time updates)
export const revalidate = 3600;

export default async function InternPage() {
  const contentReq = await getSiteContent("landing");
  const content = contentReq.data || {};
  const partners = [
    { name: "Seoul National University", type: "Academic" },
    { name: "UN Habitat", type: "NGO" },
    { name: "KAIST", type: "Academic" },
    { name: "CRI Labs", type: "Research" },
    { name: "World Bank Institute", type: "NGO" },
    { name: "Samsung Research", type: "Corporate" },
  ];

  // Fetch internships from the database where category is "Internship"
  const dbPrograms = await prisma.program.findMany({
    where: { category: "Internship" },
    orderBy: { createdAt: "desc" }
  });

  const programs = dbPrograms.map(p => ({
    ...p,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    endDate: p.endDate ? p.endDate.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-32">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-950 border-b border-gray-900 pt-32 pb-24 px-6 md:pt-40 md:pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-blue-900/40 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-purple-900/30 via-transparent to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center fade-in-up">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold text-white bg-white/10 border border-white/20 mb-8 shadow-lg backdrop-blur-md uppercase tracking-wider">
            <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
            {content.intern_pill_badge || "CRI Scholar Network"}
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-tight drop-shadow-xl">
            {content.intern_hero_title || "Elite"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{content.intern_hero_highlight || "Internships"}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
            {content.intern_hero_subtitle || "Exclusive access to industry and laboratory internships for qualified CRI scholars. Bridge the gap between academic theory and real-world impact."}
          </p>
        </div>
      </div>

      {/* Premium Apple Flex-Pillars Section */}
      <div className="py-24 md:py-32 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center md:text-left mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-4">Why Intern Through CRI?</h2>
            <p className="text-xl text-gray-500 max-w-2xl font-medium">We don't do generic intern pools. Every placement is a hand-selected trajectory into top-tier labs and NGOs.</p>
          </div>

          {/* Interactive Flex-Grow Pillars */}
          <div className="flex flex-col lg:flex-row gap-4 lg:min-h-[480px]">
            
            {/* Pillar 1 */}
            <div className="flex-1 bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:flex-[1.4] transition-[flex] duration-700 ease-out flex flex-col justify-start min-h-[400px] lg:min-h-[480px]">
              {/* Image Underlay with Gradient Fade */}
              <div className="absolute inset-0 z-0">
                <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000" alt="Global Network" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
              </div>
              
              <div className="relative z-10 mt-auto">
                <h3 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight whitespace-nowrap drop-shadow-sm">Unrivaled Network</h3>
                <p className="text-base md:text-lg text-gray-700 font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-500 line-clamp-3 group-hover:line-clamp-none">
                  Gain immediate access to a closed network of leading academic labs and corporate research divisions globally.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex-1 bg-gray-900 text-white rounded-[2.5rem] p-8 md:p-10 border border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden group hover:flex-[1.4] transition-[flex] duration-700 ease-out flex flex-col justify-start min-h-[400px] lg:min-h-[480px]">
              {/* Image Underlay with Gradient Fade */}
              <div className="absolute inset-0 z-0">
                <img src="https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 group-hover:scale-105 transition-all duration-1000 mix-blend-screen" alt="Tailored Paths" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent"></div>
              </div>
              
              <div className="relative z-10 mt-auto">
                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight whitespace-nowrap drop-shadow-sm">Tailored Paths</h3>
                <p className="text-base md:text-lg text-gray-300 font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-500 line-clamp-3 group-hover:line-clamp-none">
                  Matches perfectly to your specific academic ambitions and research trajectory. Zero generic assignments.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex-1 bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:flex-[1.4] transition-[flex] duration-700 ease-out flex flex-col justify-start min-h-[400px] lg:min-h-[480px]">
              {/* Image Underlay with Gradient Fade */}
              <div className="absolute inset-0 z-0">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000" alt="Tangible Impact" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
              </div>
              
              <div className="relative z-10 mt-auto">
                <h3 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight whitespace-nowrap drop-shadow-sm">Tangible Impact</h3>
                <p className="text-base md:text-lg text-gray-700 font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-500 line-clamp-3 group-hover:line-clamp-none">
                  Our interns co-author papers alongside tenured professors, train actual models, and draft live NGO policies.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Partner Network Marquee (Simulated) */}
      <div className="py-12 bg-gray-50 border-y border-gray-200 overflow-hidden shadow-inner">
        <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Our Global Placement Partners</p>
        </div>
        <div className="flex justify-center gap-4 md:gap-8 flex-wrap max-w-5xl mx-auto px-6">
          {partners.map((partner, i) => (
            <div key={i} className="px-6 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-600 font-bold text-sm flex items-center hover-lift hover:border-blue-200 transition-colors cursor-default">
               <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-3 animate-pulse"></span>
               {partner.name}
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities Database / Client Component */}
      <div className="max-w-5xl mx-auto px-6 py-24 fade-in-up" style={{ animationDelay: "0.4s" }}>
        <div className="flex flex-col mb-12">
           <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4 text-center md:text-left">Open Opportunities</h2>
           <p className="text-lg md:text-xl text-gray-500 font-medium text-center md:text-left">Search and apply for our active internship placements below.</p>
        </div>

        <InternshipListClient initialPrograms={programs} />
      </div>
    </div>
  );
}
