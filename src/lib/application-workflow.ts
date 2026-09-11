import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
  stage: z.enum(["REVIEW", "INTERVIEW", "PAYMENT", "ENROLLED", "REJECTED"]).optional(),
  finalRegisteredCourse: z.string().max(500).optional(),
  interviewDate: z.coerce.date().nullable().optional(),
  paymentDeadline: z.coerce.date().nullable().optional(),
  interviewComments: z.string().max(20000).optional(),
  generalComments: z.string().max(20000).optional(),
}).strict();

// All administrator application editors share this atomic transition path.
export async function changeApplication(id: string, input: unknown, actor: { id: string; name: string }, expectedUpdatedAt?: Date | string, enrollmentConfirmed = false) {
  const parsed = patchSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid application update. Check the entered values.");
  if (!expectedUpdatedAt || !Number.isFinite(new Date(expectedUpdatedAt).getTime())) throw new Error("Refresh this record before saving changes.");
  const patch = parsed.data;
  return prisma.$transaction(async tx => {
    const current = await tx.application.findUnique({ where: { id } });
    if (!current) throw new Error("Application not found.");
    if (current.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) throw new Error("This record changed since you opened it. Refresh before saving again.");
    const enrollment = await tx.enrollment.findUnique({ where: { userId_programId: { userId: current.userId, programId: current.programId } } });
    let status = patch.status ?? current.status;
    let stage = patch.stage ?? current.stage;
    if (patch.status && patch.status !== current.status) stage = status === "ACCEPTED" ? "PAYMENT" : status === "REJECTED" ? "REJECTED" : "REVIEW";
    if (patch.stage === "REJECTED") status = "REJECTED";
    if ((current.stage === "ENROLLED" || enrollment?.status === "ONGOING" || enrollment?.status === "PAST") && (status !== "ACCEPTED" || (stage !== current.stage && stage !== "ENROLLED"))) {
      throw new Error("An active or completed enrollment exists. Review the student's enrollment before changing this decision or stage.");
    }
    if ((stage === "PAYMENT" || stage === "ENROLLED") && status !== "ACCEPTED") throw new Error("Accept the application before moving it to payment or enrollment.");
    if (patch.stage && ["REVIEW", "INTERVIEW"].includes(stage) && status !== "PENDING") throw new Error("Return the decision to pending review before reopening review or interview.");
    if (stage === "ENROLLED" && current.stage !== "ENROLLED" && !enrollmentConfirmed) throw new Error("Confirm tuition arrangements and registration before enrolling this student. The application fee is separate.");
    const next = { ...patch, status, stage, updatedAt: new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1)) };
    const changed = await tx.application.updateMany({ where: { id, updatedAt: current.updatedAt }, data: next });
    if (changed.count !== 1) throw new Error("Another administrator updated this record. Refresh before saving again.");
    if (status === "ACCEPTED" && (!enrollment || enrollment.status === "ACCEPTED")) {
      await tx.enrollment.upsert({ where: { userId_programId: { userId: current.userId, programId: current.programId } }, create: { userId: current.userId, programId: current.programId, status: stage === "ENROLLED" ? "ONGOING" : "ACCEPTED" }, update: { status: stage === "ENROLLED" ? "ONGOING" : "ACCEPTED" } });
    } else if (status !== "ACCEPTED") {
      await tx.enrollment.deleteMany({ where: { userId: current.userId, programId: current.programId, status: "ACCEPTED" } });
    }
    const before = Object.fromEntries(Object.keys(next).filter(key => key !== "updatedAt").map(key => [key, current[key as keyof typeof current]]));
    const { updatedAt, ...after } = next;
    await tx.userActivity.create({ data: { userId: current.userId, adminName: actor.name, action: "STATUS_CHANGE", content: `Application ${id} updated by ${actor.name} (${actor.id}).\nBefore: ${JSON.stringify(before)}\nAfter: ${JSON.stringify(after)}` } });
    return { updatedAt, status, stage };
  });
}
