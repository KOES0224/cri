import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** One application as the full-screen admin sheet shows it: pipeline fields plus the parsed form. */
export type SheetRow = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  stage: string | null;
  finalRegisteredCourse: string | null;
  interviewDate: string | null;
  paymentDeadline: string | null;
  interviewComments: string | null;
  generalComments: string | null;
  user: { id: string; name: string | null; email: string; studentCode: string | null };
  program: { id: string; title: string; category: string };
  form: Record<string, unknown>;
};

/**
 * Every real application (the payment-review account's test submissions are left out), newest first,
 * with the form JSON already parsed, plus the program titles offered in the "final course" selector.
 */
export async function getApplicationsSheetData(): Promise<{ rows: SheetRow[]; programs: string[] }> {
  await requireAdmin();
  const [applications, programs] = await Promise.all([
    prisma.application.findMany({
      where: { user: { paymentReviewer: false } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true, createdAt: true, updatedAt: true, status: true, stage: true, finalRegisteredCourse: true,
        interviewDate: true, paymentDeadline: true, interviewComments: true, generalComments: true, content: true,
        user: { select: { id: true, name: true, email: true, studentCode: true } },
        program: { select: { id: true, title: true, category: true } },
      },
    }),
    prisma.program.findMany({ where: { isPublished: true }, orderBy: { title: "asc" }, select: { title: true } }),
  ]);
  const rows: SheetRow[] = applications.map((a) => {
    let form: Record<string, unknown> = {};
    try { const parsed = JSON.parse(a.content || "{}"); if (parsed && typeof parsed === "object") form = parsed; } catch {}
    return {
      id: a.id,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      status: a.status,
      stage: a.stage,
      finalRegisteredCourse: a.finalRegisteredCourse,
      interviewDate: a.interviewDate ? a.interviewDate.toISOString() : null,
      paymentDeadline: a.paymentDeadline ? a.paymentDeadline.toISOString() : null,
      interviewComments: a.interviewComments,
      generalComments: a.generalComments,
      user: a.user,
      program: a.program,
      form,
    };
  });
  const titles = new Set(programs.map((p) => p.title));
  for (const r of rows) { titles.add(r.program.title); if (r.finalRegisteredCourse) titles.add(r.finalRegisteredCourse); }
  return { rows, programs: Array.from(titles) };
}
