/**
 * One-off backfill after the customer directory launch, safe to re-run:
 *  1. links existing portal accounts to directory records by student email (students) or parent email (guardians);
 *  2. mirrors existing portal applications into the directory (ENROLLED stage → enrolled, REJECTED → cancelled, else applied).
 *
 *   npx tsx scripts/link-contacts-to-accounts.ts            preview
 *   npx tsx scripts/link-contacts-to-accounts.ts --apply    write
 * Uses DATABASE_URL from .env, i.e. the live database.
 */
import { PrismaClient } from "@prisma/client";
import { linkContactToUser, syncContactFromApplication } from "../src/lib/contact-sync";

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { role: { in: ["STUDENT", "PARENT"] }, paymentReviewer: false }, select: { id: true, email: true, role: true, name: true } });
  const emails = users.map(u => u.email.toLowerCase());
  const [students, parents] = await Promise.all([
    prisma.contact.findMany({ where: { email: { in: emails }, userId: null }, select: { email: true } }),
    prisma.contact.findMany({ where: { parentEmail: { in: emails }, parentUserId: null }, select: { parentEmail: true } }),
  ]);
  console.log(`Accounts: ${users.length}. Directory records to link → students ${students.length}, guardians ${parents.length}`);
  const apps = await prisma.application.findMany({ where: { user: { paymentReviewer: false } }, select: { id: true, stage: true, user: { select: { email: true } } } });
  console.log(`Applications to mirror: ${apps.length} (${apps.filter(a => a.stage === "ENROLLED").length} enrolled, ${apps.filter(a => a.stage === "REJECTED").length} rejected)`);
  if (!apply) { console.log("Preview only. Add --apply to write."); return; }
  for (const u of users) await linkContactToUser(u.email, u.id, u.role);
  let mirrored = 0;
  for (const a of apps) { await syncContactFromApplication(a.id, a.stage === "ENROLLED" ? "ENROLLED" : a.stage === "REJECTED" ? "CANCELLED" : "APPLIED"); mirrored++; }
  const linked = await prisma.contact.count({ where: { OR: [{ userId: { not: null } }, { parentUserId: { not: null } }] } });
  console.log(`Done. Applications mirrored ${mirrored}; directory records with an account: ${linked}.`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
