import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, Clock, FileText, Users, CreditCard, Save, CheckCircle2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getProgramById } from "@/lib/public-data";
import { canApply } from "@/lib/applicant";
import { admissionState } from "@/lib/program-policy";
import { formatProgramDateRange, programFactsLocalized } from "@/lib/program-facts-i18n";
import { APPLICATION_CHARGE_LABEL, APPLICATION_FEE_ENABLED } from "@/lib/application-fee";
import { getDictionary, getLocale } from "@/i18n";
import StartOptions from "./StartOptions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Start your application | CRI" };

export default async function ApplyStartPage({ searchParams }: { searchParams: Promise<{ programId?: string }> }) {
  const { programId } = await searchParams;
  if (!programId) redirect("/research");

  const applyUrl = `/apply?programId=${encodeURIComponent(programId)}`;
  const session = await getServerSession(authOptions);
  if (session?.user?.id) redirect(canApply(session.user.role) ? applyUrl : "/dashboard");

  const program = await getProgramById(programId);
  if (!program || !program.isPublished || admissionState(program) !== "OPEN") redirect("/research");

  const locale = await getLocale();
  const t = getDictionary(locale).applyStart;
  const facts = programFactsLocalized(program, locale);
  const mentor = program.professors[0];
  const dates = program.startDate ? formatProgramDateRange(program.startDate, program.endDate, locale) : null;

  const checklist = [
    { icon: Clock, text: t.checklist.time },
    { icon: Users, text: t.checklist.details },
    { icon: FileText, text: t.checklist.resume },
    { icon: Save, text: t.checklist.essays },
    { icon: CreditCard, text: APPLICATION_FEE_ENABLED ? t.checklist.fee(APPLICATION_CHARGE_LABEL) : t.checklist.free },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href={`/research/program/${program.id}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t.back}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{t.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{program.title}</h1>
            <p className="mt-3 text-slate-600">
              {facts.name}{mentor ? t.ledBy(mentor.name, mentor.university) : ""}{dates ? ` · ${dates}` : ""}
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">{t.needHeading}</h2>
              <ul className="mt-5 space-y-4">
                {checklist.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Icon className="h-4 w-4" /></span>
                    <span className="leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex items-start gap-2 text-sm text-slate-500">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {t.noProposal}
              </p>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              {t.questionsFirst} <Link href={`/contact?programId=${encodeURIComponent(program.id)}`} className="text-blue-700 underline">{t.askAdmissions}</Link> · <Link href="/admissions" className="text-blue-700 underline">{t.stepsAndFees}</Link>
            </p>
          </div>

          <StartOptions applyUrl={applyUrl} />
        </div>
      </div>
    </div>
  );
}
