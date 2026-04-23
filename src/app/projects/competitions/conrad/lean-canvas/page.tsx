"use client";
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-10 max-w-4xl">
        <div className="inline-block px-3 py-1 bg-cyan-500/10 text-[#00e5ff] font-bold text-xs uppercase tracking-wider rounded-md border border-[#00e5ff]/20 mb-4">STAGE 1 REQUIREMENT</div>
        <h1 className="text-4xl md:text-5xl font-black mb-4">The Activation Canvas</h1>
        <p className="text-xl text-gray-400">Hover over the info icons to see exactly what judges look for. Max 40 words per section.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Top Section */}
        <CanvasBox 
          title="1. Problem" 
          hint="List your top 1-3 problems. What is the fundamental pain point your customer is feeling right now?" 
          tall={true}
          extraTitle="Existing Alternatives"
          extraDesc="How are these problems being solved today?"
        />
        
        <div className="flex flex-col gap-4">
          <CanvasBox title="4. Solution" hint="Outline a possible solution for each problem. What are the top features of your product?" />
          <CanvasBox title="8. Key Metrics" hint="List the key numbers that tell you how your business is doing (e.g. daily active users, widgets sold)." />
        </div>

        <CanvasBox 
          title="3. Unique Value Prop" 
          hint="Single, clear, compelling message that states why you are different and worth paying attention to." 
          tall={true}
          extraTitle="High-Level Concept"
          extraDesc="Your X for Y analogy. (e.g. YouTube for gamers)"
        />

        <div className="flex flex-col gap-4">
          <CanvasBox title="9. Unfair Advantage" hint="What is something about your team or product that cannot be easily copied or bought by competitors?" />
          <CanvasBox title="5. Channels" hint="How will your product reach your customer segments? (e.g. App Store, direct sales, partnerships)." />
        </div>

        <CanvasBox 
          title="2. Customer Segments" 
          hint="List your target customers and users. Who specifically has the problem?" 
          tall={true}
          extraTitle="Early Adopters"
          extraDesc="List the specific characteristics of your ideal early adopter."
        />

        {/* Bottom Section */}
        <div className="md:col-span-2 md:col-start-1">
          <CanvasBox title="7. Cost Structure" hint="List your fixed and variable costs. What does it cost to build and run this? (e.g. Server costs, raw materials)." />
        </div>
        
        <div className="md:col-span-3">
          <CanvasBox title="6. Revenue Streams" hint="How will you make money? Subscription, direct sales, advertising? Include your pricing model." />
        </div>

      </div>
    </div>
  );
}
