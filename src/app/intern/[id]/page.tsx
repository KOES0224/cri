"use client";
import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Briefcase, MapPin, CheckCircle2, ChevronRight } from "lucide-react";
import { internships } from "@/data/internships";

export default function InternshipDetailsPage({ params }: { params: { id: string } }) {
  // Use React.use to unwrap params per Next 15 guidelines
  const unwrappedParams = React.use(params);
  const internship = internships.find(i => i.id === unwrappedParams.id);

  if (!internship) {
    notFound();
  }

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/intern" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Internships
        </Link>
        
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full">
              {internship.term}
            </span>
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full flex items-center">
              <MapPin className="w-3 h-3 mr-1" /> {internship.location}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-6 leading-tight">
            {internship.title}
          </h1>
          
          <div className="prose prose-lg prose-gray max-w-none">
            <p className="text-xl text-gray-600 leading-relaxed font-medium mb-10">
              {internship.fullDescription}
            </p>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Prerequisites & Requirements</h3>
            <div className="bg-gray-50 rounded-3xl p-8 mb-10 border border-gray-100">
              <ul className="space-y-4 m-0 p-0 list-none text-gray-700 text-lg">
                {internship.requirements.map((req, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-12 flex justify-center">
              <Link href="/auth/login" className="w-full md:w-auto px-12 py-5 bg-black text-white rounded-2xl text-center font-bold text-lg hover:bg-gray-900 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center group/btn hover-lift">
                Apply via Portal
                <ChevronRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
