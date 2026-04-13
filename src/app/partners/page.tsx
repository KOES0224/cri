import HeroSection from "@/components/HeroSection";
import CoreEngineSection from "@/components/CoreEngineSection";
import TrackRecordSection from "@/components/TrackRecordSection";
import PipelineSection from "@/components/PipelineSection";
import EcosystemSection from "@/components/EcosystemSection";
import WorkflowCTASection from "@/components/WorkflowCTASection";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-deepNavy overflow-x-hidden pt-0 selection:bg-champagneGold selection:text-obsidianBlack">
      <HeroSection />
      <CoreEngineSection />
      <TrackRecordSection />
      <PipelineSection />
      <EcosystemSection />
      <WorkflowCTASection />
      
      {/* Footer */}
      <footer className="w-full bg-obsidianBlack border-t border-white/5 py-8 text-center">
        <p className="text-gray-600 text-sm font-sans tracking-widest">
          © {new Date().getFullYear()} CRI GLOBAL. All Rights Reserved. Private B2B Partnership.
        </p>
      </footer>
    </main>
  );
}
