"use client";

import Link from "@/i18n/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/i18n/client";

export default function NotFound() {
  const { t } = useT();
  const copy = t.system.notFound;
  return (
    <div className="bg-[#FAFAFA] min-h-[80vh] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-9xl font-black text-gray-200 tracking-tighter mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">{copy.title}</h2>
        <p className="text-lg text-gray-600 mb-8">{copy.body}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-black hover:bg-gray-800 transition-colors shadow-sm">
            {copy.home} <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link href="/research" className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            {copy.programs}
          </Link>
        </div>
      </div>
    </div>
  );
}
