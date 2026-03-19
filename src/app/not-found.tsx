import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-[#FAFAFA] min-h-[80vh] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-9xl font-black text-gray-200 tracking-tighter mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">Page Not Found</h2>
        <p className="text-lg text-gray-600 mb-8">
          We couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <Link href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-black hover:bg-gray-800 transition-colors shadow-sm">
          Go back home <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
