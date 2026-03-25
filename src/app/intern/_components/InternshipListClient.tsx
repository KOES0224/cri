"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Building, Calendar, ArrowRight } from "lucide-react";

type Program = {
  id: string;
  title: string;
  description: string;
  category: string;
  subCategory: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

export default function InternshipListClient({ initialPrograms }: { initialPrograms: Program[] }) {
  const [search, setSearch] = useState("");

  const filteredPrograms = initialPrograms.filter(prog => 
    prog.title.toLowerCase().includes(search.toLowerCase()) || 
    prog.description.toLowerCase().includes(search.toLowerCase()) ||
    (prog.subCategory && prog.subCategory.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-12 relative max-w-2xl mx-auto md:mx-0">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search internships by role, company, or keyword..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-gray-900 placeholder-gray-400"
        />
      </div>

      <div className="space-y-6">
        {filteredPrograms.length > 0 ? (
          filteredPrograms.map((internship) => (
            <div key={internship.id} className="group relative bg-white border border-gray-100 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 premium-card">
              <div className="absolute top-0 left-0 w-1 h-0 bg-pink-500 group-hover:h-full transition-all duration-500 rounded-l-3xl"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-pink-50 text-pink-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                      {internship.status === "OPEN" ? "Accepting Applications" : internship.status}
                    </span>
                    {internship.subCategory && (
                       <span className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 text-xs font-semibold rounded-lg uppercase tracking-wider">
                         {internship.subCategory}
                       </span>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {internship.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm md:text-base mb-4 max-w-3xl line-clamp-2">
                    {internship.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {internship.subCategory && (
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-1.5 text-gray-400" />
                      {internship.subCategory}
                    </div>
                    )}
                    {(internship.startDate || internship.endDate) && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                        {internship.startDate ? new Date(internship.startDate).toLocaleDateString() : 'TBD'} 
                        {internship.endDate ? ` - ${new Date(internship.endDate).toLocaleDateString()}` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  <Link href={`/intern/${internship.id}`} className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-900 hover:text-white transition-all click-press">
                    Apply Now
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1" />
                  </Link>
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="w-6 h-6 text-gray-400" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">No roles found</h3>
             <p className="text-gray-500">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
