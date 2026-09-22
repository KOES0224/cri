"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, MapPin, Users, MessageCircle } from "lucide-react";
import type { OpenProgramCard } from "@/lib/open-programs";
import { APPLICATION_FEE_ENABLED } from "@/lib/application-fee";
import { useT } from "@/i18n/client";
import { formatProgramDateRange, programFormatLocalized, programNameLocalized } from "@/lib/program-facts-i18n";

export default function OpenProgramsSection({
  programs,
  eyebrow,
  heading,
  intro,
  className = "",
}: {
  programs: OpenProgramCard[];
  eyebrow?: string;
  heading?: string;
  intro?: string;
  className?: string;
}) {
  const { t, locale } = useT();
  const copy = t.openPrograms;
  eyebrow ??= copy.eyebrow;
  heading ??= copy.heading;
  intro ??= copy.intro;
  return (
    <section id="open-programs" className={`relative z-10 scroll-mt-28 py-24 md:py-32 px-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12 md:mb-16">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            {eyebrow}
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-5">{heading}</h2>
          <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-medium">{intro}</p>
        </div>

        {programs.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10 md:p-14 grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{copy.emptyTitle}</h3>
              <p className="text-gray-500 text-lg leading-relaxed max-w-xl">
                {copy.emptyBody}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <Link href="/contact?topic=next-cohort" className="inline-flex items-center justify-center px-7 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-colors">
                {copy.askAdmissions} <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link href="/research/1-on-1" className="inline-flex items-center justify-center px-7 py-4 bg-white border border-gray-200 text-gray-800 font-bold rounded-2xl hover:bg-gray-50 transition-colors">
                {copy.oneOnOne}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {programs.map((program, i) => {
              const prof = program.professor;
              const initials = prof?.name ? prof.name.split(" ").map((n) => n[0]).slice(0, 2).join("") : "CRI";
              const season = programNameLocalized(program.kind, program.season, locale);
              const format = programFormatLocalized(program.kind, program.format, locale);
              const dateLabel = program.kind === "individual"
                ? t.facts.flexibleStart
                : program.startDate
                  ? formatProgramDateRange(program.startDate, program.endDate, locale)
                  : program.dateLabel;
              return (
                <motion.article
                  key={program.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.08 }}
                  className="group relative bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-2xl hover:border-blue-400/80 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div className="p-7 flex flex-col gap-5 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-3 py-1 rounded-full truncate">
                        {season}
                      </span>
                      <span className="inline-flex items-center text-[11px] font-black uppercase tracking-wider text-emerald-700 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        {copy.open}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {prof?.imageUrl ? (
                        <img src={prof.imageUrl} alt={prof.name} className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-900 text-white font-black flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">{prof?.name || copy.distinguishedFaculty}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {prof?.university || prof?.role || copy.facultyMentor}
                        </div>
                      </div>
                      {prof?.universityLogo && (
                        <img src={prof.universityLogo} alt={prof.university || copy.institution} className="ml-auto h-8 max-w-[80px] object-contain shrink-0" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-gray-900 tracking-tight leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        <Link href={`/research/program/${program.id}`} className="after:absolute after:inset-0">
                          {program.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{program.description}</p>
                    </div>

                    <ul className="mt-auto space-y-2 text-sm text-gray-700 font-medium">
                      {dateLabel && (
                        <li className="flex items-center"><Calendar className="w-4 h-4 mr-2.5 text-gray-400 shrink-0" />{dateLabel}</li>
                      )}
                      <li className="flex items-center"><MapPin className="w-4 h-4 mr-2.5 text-gray-400 shrink-0" />{format}</li>
                      {program.capacity != null && (
                        <li className="flex items-center"><Users className="w-4 h-4 mr-2.5 text-gray-400 shrink-0" />{copy.upTo(program.capacity)}</li>
                      )}
                    </ul>
                  </div>

                  <div className="px-7 py-5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-4">
                    <div className="text-sm">
                      {program.tuition ? (
                        <>
                          <span className="font-black text-gray-900 text-lg">${program.tuition.toLocaleString()}</span>
                          <span className="text-gray-500 font-semibold ml-1">{copy.usdTuition}</span>
                        </>
                      ) : (
                        <span className="text-gray-500 font-semibold">{copy.tuitionOnInquiry}</span>
                      )}
                    </div>
                    <span className="relative z-10 inline-flex items-center h-11 px-5 rounded-xl bg-gray-900 group-hover:bg-blue-600 text-white text-sm font-bold transition-colors shrink-0">
                      {copy.viewApply} <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm text-gray-500 font-medium">
          <span>{APPLICATION_FEE_ENABLED ? copy.reviewNote : copy.reviewNoteFree}</span>
          <div className="flex items-center gap-5 shrink-0">
            <Link href="/admissions" className="font-bold text-gray-900 hover:text-blue-600 transition-colors">{copy.howApplying}</Link>
            <Link href="/contact" className="inline-flex items-center font-bold text-gray-900 hover:text-blue-600 transition-colors">
              <MessageCircle className="w-4 h-4 mr-1.5" /> {copy.askQuestion}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
