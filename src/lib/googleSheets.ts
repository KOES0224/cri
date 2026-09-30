import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

export interface ApplicationSyncPayload {
  applicationId: string;
  submittedAt: string;
  feeStatus: string;
  feeAmount: string;
  receiptUrl: string;
  orderId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  residenceCountry: string;
  gender: string;
  school: string;
  gradYear: string;
  tShirtSize: string;
  programTitle: string;
  programCategory: string;
  status: string;
  firstChoiceProfessor: string;
  secondChoiceProfessor: string;
  thirdChoiceProfessor: string;
  areaOfInterest: string;
  initialTopicIdeas: string;
  essay: string;
  shortAnswer: string;
  previousResearch: string;
  /** Absolute link to the PDF on the site (admin login required). */
  resumeUrl: string;
  /** Google Drive link written back by the Apps Script after it saved the PDF. */
  resumeDriveUrl: string;
  /** The PDF itself, so the Apps Script can file it in the Drive folder for the program. */
  resumeFile?: { filename: string; contentBase64: string };
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  photoConsent: string;
  howLearned: string;
}

/** The site stores the PDF path as /api/documents/<id>; the sheet and emails need a full address. */
export function absoluteResumeUrl(resumeUrl: unknown): string {
  const value = typeof resumeUrl === "string" ? resumeUrl.trim() : "";
  if (!value) return "";
  return value.startsWith("/") ? `${SITE_URL}${value}` : value;
}

/** Document id from the stored path, or null for anything else. */
export function resumeDocumentId(resumeUrl: unknown): string | null {
  const match = typeof resumeUrl === "string" ? /^\/api\/documents\/([a-z0-9]+)$/.exec(resumeUrl.trim()) : null;
  return match ? match[1] : null;
}

/**
 * Transforms application DB record and JSON formData into flat row payload
 */
export function formatApplicationForSheet(
  application: any,
  user: any,
  program: any,
  formData: Record<string, any>
): ApplicationSyncPayload {
  const studentName = (
    formData.studentFirstName || formData.studentLastName
      ? `${formData.studentFirstName || ""} ${formData.studentLastName || ""}`.trim()
      : user?.name || "N/A"
  );

  const parentName = (
    formData.parentFirstName || formData.parentLastName
      ? `${formData.parentFirstName || ""} ${formData.parentLastName || ""}`.trim()
      : ""
  );

  const payment = formData.payment || {};
  const feeStatus = payment.feeStatus || (formData.paymentKey ? "PAID" : "PAID ($50 USD)");
  const feeAmount = payment.feeStatus === "WAIVED" ? "Waived" : payment.amount ? `${payment.amount.toLocaleString()} ${payment.currency || "USD"}` : "$50.00 USD";
  const receiptUrl = payment.receiptUrl || "";
  const orderId = payment.orderId || "";

  return {
    applicationId: application.id,
    submittedAt: format(new Date(application.createdAt || new Date()), "yyyy-MM-dd HH:mm:ss"),
    feeStatus,
    feeAmount,
    receiptUrl,
    orderId,
    studentName,
    studentEmail: formData.studentEmail || user?.email || "",
    studentPhone: formData.studentPhone || "",
    residenceCountry: formData.residenceCountry || "",
    gender: formData.gender || "",
    school: formData.school || "",
    gradYear: formData.gradYear || "",
    tShirtSize: formData.tShirtSize || "",
    programTitle: program?.title || "Research Program",
    programCategory: program?.category || "Online",
    status: application.status || "PENDING",
    firstChoiceProfessor: formData.firstChoiceProfessor || "",
    secondChoiceProfessor: formData.secondChoiceProfessor || "",
    thirdChoiceProfessor: formData.thirdChoiceProfessor || "",
    areaOfInterest: formData.areaOfInterest || "",
    initialTopicIdeas: formData.initialTopicIdeas || "",
    essay: formData.essay || "",
    shortAnswer: formData.shortAnswer || "",
    previousResearch: formData.previousResearch || "",
    resumeUrl: absoluteResumeUrl(formData.resumeUrl),
    resumeDriveUrl: formData.resumeDriveUrl || "",
    parentName,
    parentEmail: formData.parentEmail || "",
    parentPhone: formData.parentPhone || "",
    photoConsent: formData.photoConsent || "",
    howLearned: formData.howLearned || "",
  };
}

/**
 * Sends one application to the Google Sheet through the Apps Script webhook, with the resume PDF attached so the
 * script can file it in the Drive folder for the program. The script answers with the Drive link, which is stored
 * on the application as `resumeDriveUrl`. Re-sending the same application updates its row instead of adding one.
 */
export async function syncApplicationToGoogleSheet({
  application,
  user,
  program,
  formData,
}: {
  application: any;
  user: any;
  program: any;
  formData: Record<string, any>;
}): Promise<{ synced: boolean; error?: string; driveUrl?: string }> {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("ℹ️ GOOGLE_SHEET_WEBHOOK_URL not configured. Skipping live Google Sheet stream.");
    return { synced: false, error: "GOOGLE_SHEET_WEBHOOK_URL not set" };
  }

  try {
    const payload = formatApplicationForSheet(application, user, program, formData);
    // Attach the PDF only when it belongs to the applicant's account (the same check the download route makes).
    const documentId = resumeDocumentId(formData.resumeUrl);
    if (documentId) {
      const document = await prisma.applicationDocument.findFirst({ where: { id: documentId, userId: application.userId }, select: { filename: true, data: true } });
      if (document) payload.resumeFile = { filename: document.filename, contentBase64: Buffer.from(document.data).toString("base64") };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      // Saving a PDF to Drive takes a few seconds on the Apps Script side.
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      console.error("Google Sheet webhook returned error status:", response.status, errText);
      return { synced: false, error: `HTTP ${response.status}` };
    }
    const body = (await response.json().catch(() => null)) as { status?: string; message?: string; driveUrl?: string } | null;
    if (body?.status === "error") {
      console.error("Google Sheet script reported an error:", body.message);
      return { synced: false, error: body.message || "script error" };
    }

    const driveUrl = typeof body?.driveUrl === "string" ? body.driveUrl : "";
    if (driveUrl && driveUrl !== formData.resumeDriveUrl && application.id) {
      try {
        await prisma.application.update({ where: { id: application.id }, data: { content: JSON.stringify({ ...formData, resumeDriveUrl: driveUrl }) } });
      } catch (error) { console.error("Drive link not stored on the application:", error instanceof Error ? error.message : error); }
    }

    console.log(`✅ Successfully synced application ${application.id} to Google Sheet.`);
    return { synced: true, driveUrl: driveUrl || undefined };
  } catch (error: any) {
    console.error("Error streaming application to Google Sheet webhook:", error?.message || error);
    return { synced: false, error: error?.message || "Failed to post to Google Sheets" };
  }
}
