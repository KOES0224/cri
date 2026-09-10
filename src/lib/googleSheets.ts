import { format } from "date-fns";

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
  resumeUrl: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  photoConsent: string;
  howLearned: string;
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
  const feeAmount = payment.amount ? `$${payment.amount} ${payment.currency || "USD"}` : "$50.00 USD";
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
    resumeUrl: formData.resumeUrl || "",
    parentName,
    parentEmail: formData.parentEmail || "",
    parentPhone: formData.parentPhone || "",
    photoConsent: formData.photoConsent || "",
    howLearned: formData.howLearned || "",
  };
}

/**
 * Sends single application row to Google Spreadsheet via Apps Script Webhook
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
}): Promise<{ synced: boolean; error?: string }> {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("ℹ️ GOOGLE_SHEET_WEBHOOK_URL not configured. Skipping live Google Sheet stream.");
    return { synced: false, error: "GOOGLE_SHEET_WEBHOOK_URL not set" };
  }

  try {
    const payload = formatApplicationForSheet(application, user, program, formData);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      console.error("Google Sheet webhook returned error status:", response.status, errText);
      return { synced: false, error: `HTTP ${response.status}` };
    }

    console.log(`✅ Successfully synced application ${application.id} to Google Sheet.`);
    return { synced: true };
  } catch (error: any) {
    console.error("Error streaming application to Google Sheet webhook:", error?.message || error);
    return { synced: false, error: error?.message || "Failed to post to Google Sheets" };
  }
}

/**
 * The 5-line Google Apps Script template for admins to paste into their Google Sheet
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// 1. In your Google Sheet, click Extensions > Apps Script
// 2. Paste this code and click Deploy > New deployment
// 3. Select type "Web app", execute as "Me", who has access "Anyone"
// 4. Copy the Web app URL and paste it into GOOGLE_SHEET_WEBHOOK_URL in .env

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Auto-create bold headers on empty sheet
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Submitted At", "Application ID", "Status", "Fee Status", "Fee Amount", "Receipt URL", "Order ID",
        "Student Name", "Email", "Phone", "Gender", "School", "Grad Year", "T-Shirt",
        "Program", "Category", "1st Choice Professor", "2nd Choice Professor", "3rd Choice Professor",
        "Area of Interest", "Topic Ideas", "Essay", "Short Answer", "Previous Research",
        "Resume Link", "Parent Name", "Parent Email", "Parent Phone", "How Learned"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
    }
    
    sheet.appendRow([
      data.submittedAt,
      data.applicationId,
      data.status,
      data.feeStatus,
      data.feeAmount,
      data.receiptUrl,
      data.orderId,
      data.studentName,
      data.studentEmail,
      data.studentPhone,
      data.gender,
      data.school,
      data.gradYear,
      data.tShirtSize,
      data.programTitle,
      data.programCategory,
      data.firstChoiceProfessor,
      data.secondChoiceProfessor,
      data.thirdChoiceProfessor,
      data.areaOfInterest,
      data.initialTopicIdeas,
      data.essay,
      data.shortAnswer,
      data.previousResearch,
      data.resumeUrl,
      data.parentName,
      data.parentEmail,
      data.parentPhone,
      data.howLearned
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
