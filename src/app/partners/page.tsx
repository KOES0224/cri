export const metadata = {
  title: 'B2B Partnership | CRI Global',
  description: 'Premium B2B Academic Infrastructure Partnership',
};

import HeroSection from "@/components/HeroSection";
import DilemmaSection from "@/components/DilemmaSection";
import CoreEngineSection from "@/components/CoreEngineSection";
import TrackRecordSection from "@/components/TrackRecordSection";
import PipelineSection from "@/components/PipelineSection";
import EcosystemSection from "@/components/EcosystemSection";
import WorkflowCTASection from "@/components/WorkflowCTASection";

export default function PartnersPage() {
  return (
    <main className="w-full min-h-screen bg-deepNavy overflow-x-hidden pt-0 selection:bg-champagneGold selection:text-obsidianBlack">
      <HeroSection />
      <DilemmaSection />
      <CoreEngineSection />
      <TrackRecordSection />
      <PipelineSection />
      <EcosystemSection />
      <WorkflowCTASection />
    </main>
  );
}
