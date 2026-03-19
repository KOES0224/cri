"use client";

import { useEffect } from "react";
import { AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error("Global crash caught:", error);
  }, [error]);

  return (
    <div className="bg-[#FAFAFA] min-h-[80vh] flex flex-col items-center justify-center px-6">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-xl w-full text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-3">Something went wrong!</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          An unexpected server error occurred while loading this page. Our engineering team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => reset()} 
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Try again
          </button>
          <Link href="/" className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-black hover:bg-gray-800 transition-colors shadow-sm">
            <Home className="mr-2 w-4 h-4" /> Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
