import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary, getLocale } from "@/i18n";

export const dynamic = "force-dynamic";

/** Confirmation after a free (no-fee) submission. The paid path lands on /apply/payment-success instead. */
export default async function ApplicationSubmittedPage({ searchParams }: { searchParams: Promise<{ programId?: string }> }) {
  const { programId } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  const t = getDictionary(await getLocale()).applySubmitted;
  const application = programId
    ? await prisma.application.findUnique({ where: { userId_programId: { userId: session.user.id, programId } }, select: { id: true, program: { select: { title: true } } } })
    : null;
  if (!application) redirect("/dashboard/applications");

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">{t.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed">{t.body(application.program.title)}</p>
        <p className="text-sm text-gray-500 mt-3">{t.next}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/dashboard/applications" className="inline-flex items-center justify-center h-12 rounded-xl bg-gray-900 text-white font-bold hover:bg-black">
            {t.dashboard} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/research" className="text-sm font-semibold text-gray-500 hover:text-gray-900">{t.home}</Link>
        </div>
      </div>
    </div>
  );
}
