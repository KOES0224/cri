import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, Clock, FileText, Users, CreditCard, Save, CheckCircle2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canApply } from "@/lib/applicant";
import { admissionState, programDate, programFacts } from "@/lib/program-policy";
import { APPLICATION_CHARGE_LABEL } from "@/lib/application-fee";
import StartOptions from "./StartOptions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Start your application | CRI" };

export default async function ApplyStartPage({ searchParams }: { searchParams: Promise<{ programId?: string }> }) {
  const { programId } = await searchParams;
  if (!programId) redirect("/research");

  const applyUrl = `/apply?programId=${encodeURIComponent(programId)}`;
  const session = await getServerSession(authOptions);
  if (session?.user?.id) redirect(canApply(session.user.role) ? applyUrl : "/dashboard");

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { professors: { select: { name: true, university: true }, take: 1 } },
  });
  if (!program || !program.isPublished || admissionState(program) !== "OPEN") redirect("/research");

  const facts = programFacts(program);
  const mentor = program.professors[0];
  const dates = program.startDate ? `${programDate(program.startDate)}${program.endDate ? ` – ${programDate(program.endDate)}` : ""}` : null;

  const checklist = [
    { icon: Clock, text: "About 20 minutes. Drafts save automatically, so you can stop and come back." },
    { icon: Users, text: "Student details and, for school students, a parent or guardian contact." },
    { icon: FileText, text: "The student's academic resume as a PDF (up to 5 MB)." },
    { icon: Save, text: "Two short written responses: why this program (up to 500 words) and research goals (up to 150 words)." },
    { icon: CreditCard, text: `Application fee ${APPLICATION_CHARGE_LABEL}, paid by card at the end. Tuition is separate and only due after admission.` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href={`/research/program/${program.id}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to program
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Start your application</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{program.title}</h1>
            <p className="mt-3 text-slate-600">
              {facts.name}{mentor ? ` · led by ${mentor.name}${mentor.university ? `, ${mentor.university}` : ""}` : ""}{dates ? ` · ${dates}` : ""}
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">What you will need</h2>
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
                A finished research proposal is not required. Tell us what you want to investigate; the mentor helps shape the question.
              </p>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Questions first? <Link href={`/contact?programId=${encodeURIComponent(program.id)}`} className="text-blue-700 underline">Ask admissions</Link> · <Link href="/admissions" className="text-blue-700 underline">Application steps and fees</Link>
            </p>
          </div>

          <StartOptions applyUrl={applyUrl} />
        </div>
      </div>
    </div>
  );
}
