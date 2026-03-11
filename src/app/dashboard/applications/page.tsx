import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Normally we would fetch applications from Prisma here
  const applications: any[] = []; // Using empty array for mock UI

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Applications</h1>
          <p className="mt-1 text-sm text-gray-500">Track the status of your research program applications.</p>
        </div>
        <Link href="/research" className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors">
          Browse Programs
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No applications yet</h3>
          <p className="mt-1 text-gray-500">Get started by browsing our available research programs.</p>
          <div className="mt-6">
            <Link href="/research" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
              Find a Program
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
          <ul role="list" className="divide-y divide-gray-100">
            {/* List rendered here if applications array had items */}
          </ul>
        </div>
      )}
    </div>
  );
}

// Needed because BookOpen wasn't imported in the mockup state above, adding it globally to this block
import { BookOpen } from "lucide-react";
