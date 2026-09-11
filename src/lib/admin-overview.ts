import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function getAdminOverview() {
  await requireAdmin();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const [pending, inquiries, published, reminders, applications, activity, followups, overduePayments, interviews] = await Promise.all([
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.program.count({ where: { isPublished: true } }),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.application.findMany({ take: 5, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, status: true, createdAt: true, user: { select: { id: true, name: true, email: true } }, program: { select: { title: true } } } }),
    prisma.leadActivity.findMany({ take: 6, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, action: true, content: true, adminName: true, createdAt: true, leadId: true, lead: { select: { name: true } } } }),
    prisma.notification.findMany({ take: 20, where: { isRead: false }, orderBy: [{ dueDate: "asc" }, { id: "asc" }], select: { id: true, dueDate: true, message: true, leadId: true, userId: true, lead: { select: { name: true } }, user: { select: { name: true, email: true } } } }),
    prisma.application.findMany({ take: 6, where: { stage: "PAYMENT", status: "ACCEPTED", paymentDeadline: { lt: now } }, orderBy: { paymentDeadline: "asc" }, select: { id: true, paymentDeadline: true, user: { select: { id: true, name: true, email: true } }, program: { select: { title: true } } } }),
    prisma.application.findMany({ take: 6, where: { stage: "INTERVIEW", interviewDate: { gte: now, lte: tomorrow } }, orderBy: { interviewDate: "asc" }, select: { id: true, interviewDate: true, user: { select: { id: true, name: true, email: true } }, program: { select: { title: true } } } }),
  ]);
  return { pending, inquiries, published, reminders, applications, activity, followups, overduePayments, interviews };
}
