import { getPrograms } from "@/app/actions/programs";
import ResearchProgramsClient from "../ResearchProgramsClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function WinterResearchPage() {
  const allPrograms: any = await getPrograms();
  
  // Filter for only Winter Research programs
  const programs = allPrograms.filter((p: any) => 
    p.category === "Research" && 
    p.subCategory === "Winter Online Research"
  );

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 pt-32 -mb-20 relative z-20">
        <Link 
          href="/research" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Research
        </Link>
      </div>
      <ResearchProgramsClient 
        programs={programs} 
        pageTitle="Winter Online Research"
        pageDescription="Structure your methodology and literature review during the winter break in a focused, remote group environment."
      />
    </>
  );
}
