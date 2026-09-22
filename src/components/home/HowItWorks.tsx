"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { useT } from "@/i18n/client";
import { APPLICATION_FEE_ENABLED } from "@/lib/application-fee";

/** Three steps from choosing a cohort to a decision, so a family knows how light the process is before starting. */
export default function HowItWorks() {
  const { t } = useT();
  const icons = [Search, FileText, CheckCircle2];
  return (
    <section className="relative z-10 bg-white py-24 md:py-28 px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-14">
          <p className="text-xs font-black uppercase tracking-widest text-blue-700 mb-4">{t.home.howItWorks.eyebrow}</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">{t.home.howItWorks.title}</h2>
          <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">{t.home.howItWorks.intro}</p>
        </div>
        <ol className="grid md:grid-cols-3 gap-6">
          {t.home.howItWorks.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-3xl border border-gray-200/90 bg-[#FAFAFA] p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-gray-200 text-blue-700 shadow-sm"><Icon className="h-5 w-5" /></span>
                  <span className="text-5xl font-black text-gray-200 leading-none">{i + 1}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.body}</p>
                <p className="mt-4 text-sm font-semibold text-gray-500">{i === 1 && !APPLICATION_FEE_ENABLED ? t.home.howItWorks.applyMetaFree : step.meta}</p>
              </motion.li>
            );
          })}
        </ol>
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <Link href="#open-programs" className="inline-flex items-center justify-center px-7 py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-colors">
            {t.home.howItWorks.cta} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/admissions" className="text-sm font-bold text-gray-700 hover:text-blue-700 underline-offset-4 hover:underline">{t.home.howItWorks.details}</Link>
        </div>
      </div>
    </section>
  );
}
