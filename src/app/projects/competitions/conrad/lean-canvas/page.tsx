"use client";
import React from "react";
import { Info } from "lucide-react";

interface CanvasBoxProps {
  title: string;
  hint: string;
  tall?: boolean;
  children?: React.ReactNode;
  extraTitle?: string | null;
  extraDesc?: string | null;
}

const CanvasBox = ({ title, hint, tall = false, children, extraTitle = null, extraDesc = null }: CanvasBoxProps) => (
  <div className={`bg-[#14141c]/80 backdrop-blur-xl border border-white/10 rounded-xl p-5 relative group hover:border-[#f42c40] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-[1.02] hover:z-10 transition-all duration-300 flex flex-col ${tall ? 'row-span-2 min-h-[500px]' : 'min-h-[240px]'}`}>
    <div className="flex justify-between items-start mb-4">
      <h4 className="text-white font-bold text-lg">{title}</h4>
      <div className="relative">
        <div className="w-6 h-6 rounded-full bg-[#f42c40] flex justify-center items-center cursor-help">
          <Info size={14} className="text-white"/>
        </div>
        {/* Tooltip */}
        <div className="absolute top-8 right-0 w-64 bg-[#0a0a0e] border border-[#f42c40] p-4 rounded-lg hidden group-hover:block z-50 shadow-2xl text-sm text-gray-300 leading-relaxed font-medium">
          {hint}
        </div>
      </div>
    </div>
    
    {children}

    {extraTitle && (
      <div className="mt-auto pt-6 border-t border-dashed border-white/10">
        <h4 className="text-white font-semibold text-sm">{extraTitle}</h4>
        <p className="text-gray-500 text-sm mt-2">{extraDesc}</p>
      </div>
    )}
  </div>
);

export default function LeanCanvas() {
  const [showEchoGym, setShowEchoGym] = React.useState(false);

  const echoGymData = {
    problem: "Visually impaired (VI) individuals lack independent access to standard gyms, relying on human guides or off-peak hours to avoid collisions. Sighted gym-goers lack affordable, real-time posture coaching, leading to injury risk.",
    alternatives: "1. Goalball or blind-specific sports (segregated). 2. Gym workouts only when accompanied by a designated guide or personal trainer.",
    solution: "A CCTV-based computer vision software module providing real-time machine occupancy maps, spatial audio navigation, and instant posture correction via smartphone-connected earbuds.",
    metrics: "Number of active partner gym locations, Monthly Active Users (MAU), average posture score improvement, and gym safety incident rate reduction.",
    uvp: "Complete autonomy for visually impaired athletes and real-time audio posture coaching for everyone, powered by existing gym CCTV cameras.",
    concept: "An AI personal trainer and navigation system powered by existing CCTV cameras.",
    advantage: "Proprietary computer vision models trained specifically on high-angle, multi-view gym CCTV feeds, offering a hardware-free, software-only retrofit.",
    channels: "Direct B2B sales to national gym franchises; partnerships with national associations for the blind; organic app store distribution for B2C users.",
    segments: "B2B: Mid-to-high-end gym franchises. B2C: Visually impaired individuals seeking independent workouts; sighted gym-goers wanting real-time posture feedback.",
    adopters: "VI individuals who currently work out at empty hours (4 AM - 6 AM) or pay for 1-on-1 guides, and fitness enthusiasts tracking lifting form.",
    cost: "Cloud server hosting and GPU processing fees; software engineering salaries for model training; marketing, sales commissions, and customer onboarding.",
    revenue: "B2B SaaS: Gyms pay a monthly subscription ($150-$300/mo) for safety and accessibility alerts. B2C Freemium: Premium subscription ($9.99/mo) for advanced coaching."
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-block px-3 py-1 bg-cyan-500/10 text-[#00e5ff] font-bold text-xs uppercase tracking-wider rounded-md border border-[#00e5ff]/20 mb-4">STAGE 1 REQUIREMENT</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">The Activation Canvas</h1>
          <p className="text-lg text-gray-400">Hover over the info icons to see exactly what judges look for. Max 40 words per section.</p>
        </div>
        <button
          onClick={() => setShowEchoGym(!showEchoGym)}
          className={`px-6 py-3 font-bold rounded-xl border transition-all duration-300 ${
            showEchoGym 
              ? "bg-[#f42c40] text-white border-[#f42c40] shadow-[0_0_15px_rgba(244,44,64,0.3)] hover:bg-[#b91d2d]" 
              : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20"
          }`}
        >
          {showEchoGym ? "Reset to Blank Canvas" : "Load Example: EchoGym AI"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Top Section */}
        <CanvasBox 
          title="1. Problem" 
          hint="List your top 1-3 problems. What is the fundamental pain point your customer is feeling right now?" 
          tall={true}
          extraTitle="Existing Alternatives"
          extraDesc={showEchoGym ? echoGymData.alternatives : "How are these problems being solved today?"}
        >
          {showEchoGym && (
            <p className="text-[#00e5ff] text-sm leading-relaxed animate-in fade-in duration-300 font-medium">
              {echoGymData.problem}
            </p>
          )}
        </CanvasBox>
        
        <div className="flex flex-col gap-4">
          <CanvasBox title="4. Solution" hint="Outline a possible solution for each problem. What are the top features of your product?">
            {showEchoGym && (
              <p className="text-cyan-400 text-sm leading-relaxed animate-in fade-in duration-300 font-medium">
                {echoGymData.solution}
              </p>
            )}
          </CanvasBox>
          <CanvasBox title="8. Key Metrics" hint="List the key numbers that tell you how your business is doing (e.g. daily active users, widgets sold).">
            {showEchoGym && (
              <p className="text-cyan-400 text-sm leading-relaxed animate-in fade-in duration-300 font-medium">
                {echoGymData.metrics}
              </p>
            )}
          </CanvasBox>
        </div>

        <CanvasBox 
          title="3. Unique Value Prop" 
          hint="Single, clear, compelling message that states why you are different and worth paying attention to." 
          tall={true}
          extraTitle="High-Level Concept"
          extraDesc={showEchoGym ? echoGymData.concept : "Your X for Y analogy. (e.g. YouTube for gamers)"}
        >
          {showEchoGym && (
            <p className="text-[#f42c40] text-sm leading-relaxed animate-in fade-in duration-300 font-bold">
              {echoGymData.uvp}
            </p>
          )}
        </CanvasBox>

        <div className="flex flex-col gap-4">
          <CanvasBox title="9. Unfair Advantage" hint="What is something about your team or product that cannot be easily copied or bought by competitors?">
            {showEchoGym && (
              <p className="text-cyan-400 text-sm leading-relaxed animate-in fade-in duration-300 font-medium">
                {echoGymData.advantage}
              </p>
            )}
          </CanvasBox>
          <CanvasBox title="5. Channels" hint="How will your product reach your customer segments? (e.g. App Store, direct sales, partnerships).">
            {showEchoGym && (
              <p className="text-cyan-400 text-sm leading-relaxed animate-in fade-in duration-300 font-medium">
                {echoGymData.channels}
              </p>
            )}
          </CanvasBox>
        </div>

        <CanvasBox 
          title="2. Customer Segments" 
          hint="List your target customers and users. Who specifically has the problem?" 
          tall={true}
          extraTitle="Early Adopters"
          extraDesc={showEchoGym ? echoGymData.adopters : "List the specific characteristics of your ideal early adopter."}
        >
          {showEchoGym && (
            <p className="text-[#00e5ff] text-sm leading-relaxed animate-in fade-in duration-300 font-medium">
              {echoGymData.segments}
            </p>
          )}
        </CanvasBox>

        {/* Bottom Section */}
        <div className="md:col-span-2 md:col-start-1">
          <CanvasBox title="7. Cost Structure" hint="List your fixed and variable costs. What does it cost to build and run this? (e.g. Server costs, raw materials).">
            {showEchoGym && (
              <p className="text-gray-300 text-sm leading-relaxed animate-in fade-in duration-300 font-medium">
                {echoGymData.cost}
              </p>
            )}
          </CanvasBox>
        </div>
        
        <div className="md:col-span-3">
          <CanvasBox title="6. Revenue Streams" hint="How will you make money? Subscription, direct sales, advertising? Include your pricing model.">
            {showEchoGym && (
              <p className="text-gray-300 text-sm leading-relaxed animate-in fade-in duration-300 font-medium">
                {echoGymData.revenue}
              </p>
            )}
          </CanvasBox>
        </div>

      </div>
    </div>
  );
}
