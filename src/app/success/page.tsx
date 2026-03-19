"use server";
import { prisma } from "@/lib/prisma";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
export default async function SuccessPage() {
  const stories = await prisma.successStory.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">Student Success</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Meet our scholars who have transformed their curiosity into accepted publications and elite university admissions.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stories.map((student: { id: string; name: string; imageUrl: string | null; university: string; major: string; projectTitle: string; externalLink: string | null }, i: number) => (
            <div key={student.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative">
              <div className="h-48 bg-gray-200 relative overflow-hidden flex items-center justify-center">
                {student.imageUrl ? (
                  <Image src={student.imageUrl} className="object-cover group-hover:scale-105 transition-transform duration-500" alt={student.name} fill />
                ) : (
                  <Image src={`https://api.dicebear.com/7.x/notionists/svg?seed=${student.name}&backgroundColor=e2e8f0`} className="object-cover group-hover:scale-105 transition-transform duration-500" alt={student.name} fill />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">{student.name}</h3>
                <p className="text-blue-600 font-semibold text-sm mb-4 flex items-center"><GraduationCap className="w-4 h-4 mr-1"/> {student.university}</p>
                <div className="mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Major</span>
                  <p className="text-gray-900 font-medium text-sm">{student.major}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Research</span>
                  <p className="text-gray-600 text-sm leading-relaxed">{student.projectTitle}</p>
                </div>

                {student.externalLink && (
                  <Link href={student.externalLink} target="_blank" className="absolute inset-0 cursor-pointer" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
