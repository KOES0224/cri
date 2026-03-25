import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Briefcase, MapPin, CheckCircle2, ChevronRight, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function InternshipDetailsPage({ params }: { params: { id: string } }) {
  const unwrappedParams = await params;
  
  const internship = await prisma.program.findUnique({
    where: { id: unwrappedParams.id }
  });

  if (!internship || internship.category !== "Internship") {
    notFound();
  }

  // Generate dynamic requirements based on internship string (split by newlines if applicable)
  // or default generic requirements if short description provided
  const reqs = internship.description.length > 50 
               ? ["Currently enrolled in a relevant degree program.", "Strong analytical and problem-solving skills.", "Ability to commit to the designated timeline."] 
               : ["Passion for research", "High academic standing"];

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
            <span className="inline-block px-3 py-1 bg-pink-50 text-pink-700 text-xs font-bold uppercase tracking-wider rounded-lg">
              {internship.status === "OPEN" ? "Accepting Applications" : internship.status}
            </span>
            {internship.subCategory && (
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center">
                <Building2 className="w-3 h-3 mr-1" /> {internship.subCategory}
              </span>
            )}
            {(internship.startDate || internship.endDate) && (
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center">
                <Calendar className="w-3 h-3 mr-1" /> 
                {internship.startDate ? new Date(internship.startDate).toLocaleDateString() : 'TBD'} 
                {internship.endDate ? ` - ${new Date(internship.endDate).toLocaleDateString()}` : ''}
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-6 leading-tight">
            {internship.title}
          </h1>
          
          <div className="prose prose-lg prose-gray max-w-none">
            <p className="text-xl text-gray-600 leading-relaxed font-medium mb-10 whitespace-pre-line">
              {internship.description}
            </p>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Prerequisites & Requirements</h3>
            <div className="bg-gray-50 rounded-3xl p-8 mb-10 border border-gray-100">
              <ul className="space-y-4 m-0 p-0 list-none text-gray-700 text-lg">
                {reqs.map((req, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-12 flex justify-center">
              <Link href="/auth/login" className="w-full md:w-auto px-12 py-5 bg-gray-900 text-white rounded-2xl text-center font-bold text-lg hover:bg-blue-600 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center group/btn hover-lift click-press cursor-pointer">
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
