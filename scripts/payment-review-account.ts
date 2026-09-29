/**
 * Creates and manages the payment-gateway review account (Toss Payments' reviewers walk the paid checkout with it).
 * The account is a PARENT account flagged `paymentReviewer`: it sees the paid checkout while applications are free for
 * everyone else, opens every application pre-filled on the final step, and its submissions are labelled as tests and
 * kept out of Meta, GA/GTM and the admissions sheet. It can only see its own records, like any applicant.
 *
 *   npx tsx scripts/payment-review-account.ts --out ~/cri-pg-review.txt              preview, no writes
 *   npx tsx scripts/payment-review-account.ts --out ~/cri-pg-review.txt --apply      create it (or reset its password)
 *   npx tsx scripts/payment-review-account.ts --cleanup --apply                      after the review, first: delete the account's test applications, drafts and checkouts
 *   npx tsx scripts/payment-review-account.ts --disable --apply                      then: flag off, password scrambled, sessions ended
 *
 * Options: --email <address> (default support+tosspg@cri.kr, delivered to the support inbox).
 * The password is written only to the --out file (mode 600) and is never printed.
 * Uses DATABASE_URL from .env, i.e. the live database.
 */
import { randomBytes } from "node:crypto";
import { chmodSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { homedir } from "node:os";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { REVIEW_DOCUMENT_FILENAME } from "../src/lib/payment-review-draft";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const apply = flag("apply");
const email = (option("email") || "support+tosspg@cri.kr").trim().toLowerCase();
const out = option("out")?.replace(/^~(?=\/)/, homedir());

/** A one-page PDF saying it is a sample, so the review application carries a valid "CV" without a real person's data. */
function samplePdf(): Buffer {
  const text = "BT /F1 16 Tf 72 720 Td (CRI - sample CV for the payment gateway review) Tj 0 -26 Td /F1 11 Tf (This is a test document. It does not belong to a real applicant.) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, paymentReviewer: true, _count: { select: { applications: true } } } });
  // Never turn a real person's account into the review account.
  // (After --disable the flag is off, so re-running setup on the same address is refused on purpose: pick a new --email.)
  if (existing && !existing.paymentReviewer && !flag("disable") && !flag("cleanup")) {
    throw new Error(`${email} already belongs to a ${existing.role} account that is not the review account. Choose another --email.`);
  }
  if (existing?.role === "ADMIN") throw new Error("Refusing to touch an ADMIN account.");

  if (flag("cleanup")) {
    if (!existing?.paymentReviewer) throw new Error(`${email} is not the review account.`);
    const where = { userId: existing.id };
    console.log(`${apply ? "Deleting" : "Would delete"} the review account's applications (${existing._count.applications}), drafts and checkouts.`);
    if (apply) {
      await prisma.$transaction([
        prisma.application.deleteMany({ where }),
        prisma.applicationDraft.deleteMany({ where }),
        prisma.applicationCheckout.deleteMany({ where }),
      ]);
      console.log("Done.");
    }
    return;
  }

  if (flag("disable")) {
    if (!existing?.paymentReviewer) throw new Error(`${email} is not the review account.`);
    console.log(`${apply ? "Disabling" : "Would disable"} ${email}: reviewer flag off, password scrambled, sessions ended.`);
    if (apply) {
      await prisma.user.update({ where: { id: existing.id }, data: { paymentReviewer: false, password: await bcrypt.hash(randomBytes(32).toString("base64url"), 12), sessionVersion: { increment: 1 } } });
      console.log("Done.");
    }
    return;
  }

  if (!out) throw new Error("Pass --out <file> (outside the repository) to receive the login details.");
  // The repository is public: the password file must never sit where `git add` could pick it up.
  if (!relative(process.cwd(), resolve(out)).startsWith("..")) throw new Error("--out must point outside the repository (e.g. ~/cri-pg-review.txt).");
  console.log(`${apply ? "Setting up" : "Would set up"} ${email} as the payment review account (${existing ? "reset password" : "new PARENT account"}); login details → ${out}`);
  if (!apply) return;

  const password = randomBytes(18).toString("base64url");
  const hash = await bcrypt.hash(password, 12);
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { password: hash, paymentReviewer: true, sessionVersion: { increment: 1 } }, select: { id: true } })
    : await prisma.user.create({ data: { email, name: "Payment Review (Toss)", role: "PARENT", password: hash, emailVerified: new Date(), paymentReviewer: true }, select: { id: true } });

  const sample = await prisma.applicationDocument.findFirst({ where: { userId: user.id, filename: REVIEW_DOCUMENT_FILENAME }, select: { id: true } });
  if (!sample) await prisma.applicationDocument.create({ data: { userId: user.id, filename: REVIEW_DOCUMENT_FILENAME, data: samplePdf() } });

  writeFileSync(out, [
    "CRI payment review account (for Toss Payments' review of the checkout path)",
    "",
    "Login:    https://criglobal.org/auth/login",
    `Email:    ${email}`,
    `Password: ${password}`,
    "",
    "Path: Research → any program open for applications → Apply → the form opens pre-filled on the last step → Pay and submit → Toss payment window.",
    "Submissions from this account are labelled [TEST · payment review]. Share the password by phone or message, not in the same email as the login.",
    "After the review: npx tsx scripts/payment-review-account.ts --cleanup --apply, then --disable --apply.",
    "",
  ].join("\n"), { mode: 0o600 });
  chmodSync(out, 0o600);
  console.log(`Done. Account ${existing ? "updated" : "created"}; sample CV ${sample ? "already present" : "added"}. Login details written to ${out} (mode 600).`);
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
