/**
 * Google Apps Script for the admissions sheet. Shown (with a copy button) on /dashboard/applications-admin/sheet.
 * It appends or updates one row per application (matched by Application ID) and files the resume PDF in the Drive
 * folder ROOT_FOLDER_ID under a subfolder named after the program, answering with the Drive link.
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = String.raw`// CRI application sync. In the Google Sheet: Extensions > Apps Script, replace the code with this file, save,
// then Deploy > Manage deployments > pencil icon > Version: "New version" > Deploy (the web app URL stays the same).
// The first run asks for permission to edit the sheet and Google Drive.
var ROOT_FOLDER_ID = "1WT8LCPjQvY2q-OX38qGFYBf3gzHyO8z6"; // Drive folder for resumes; one subfolder per program is created automatically.

var HEADERS = ["Submitted At", "Application ID", "Status", "Fee Status", "Fee Amount", "Receipt URL", "Order ID",
  "Student Name", "Email", "Phone", "Country", "Gender", "School", "Grad Year", "T-Shirt",
  "Program", "Category", "1st Choice Professor", "2nd Choice Professor", "3rd Choice Professor",
  "Area of Interest", "Topic Ideas", "Essay", "Short Answer", "Previous Research",
  "Resume (Drive)", "Resume (Site)", "Parent Name", "Parent Email", "Parent Phone", "Photo Consent", "How Learned"];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var driveUrl = data.resumeDriveUrl || "";
    if (data.resumeFile && data.resumeFile.contentBase64) driveUrl = saveResume(data) || driveUrl;

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = ensureHeaders(sheet);
    var values = {
      "Submitted At": data.submittedAt, "Application ID": data.applicationId, "Status": data.status,
      "Fee Status": data.feeStatus, "Fee Amount": data.feeAmount, "Receipt URL": data.receiptUrl, "Order ID": data.orderId,
      "Student Name": data.studentName, "Email": data.studentEmail, "Phone": data.studentPhone, "Country": data.residenceCountry,
      "Gender": data.gender, "School": data.school, "Grad Year": data.gradYear, "T-Shirt": data.tShirtSize,
      "Program": data.programTitle, "Category": data.programCategory,
      "1st Choice Professor": data.firstChoiceProfessor, "2nd Choice Professor": data.secondChoiceProfessor, "3rd Choice Professor": data.thirdChoiceProfessor,
      "Area of Interest": data.areaOfInterest, "Topic Ideas": data.initialTopicIdeas, "Essay": data.essay, "Short Answer": data.shortAnswer,
      "Previous Research": data.previousResearch, "Resume (Drive)": driveUrl, "Resume (Site)": data.resumeUrl, "Resume Link": data.resumeUrl,
      "Parent Name": data.parentName, "Parent Email": data.parentEmail, "Parent Phone": data.parentPhone,
      "Photo Consent": data.photoConsent, "How Learned": data.howLearned
    };
    var row = headers.map(function (h) { return values[h] === undefined || values[h] === null ? "" : values[h]; });

    // One row per application: a re-sync updates the existing row instead of adding a duplicate.
    var idCol = headers.indexOf("Application ID") + 1;
    var existingRow = findRow(sheet, idCol, data.applicationId);
    if (existingRow) sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);

    return json({ status: "success", driveUrl: driveUrl });
  } catch (err) {
    return json({ status: "error", message: String(err) });
  }
}

// Keeps whatever columns the sheet already has and adds any new ones at the end.
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#f3f4f6");
    sheet.setFrozenRows(1);
    return HEADERS.slice();
  }
  var current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(String);
  HEADERS.forEach(function (h) {
    if (current.indexOf(h) === -1) {
      current.push(h);
      sheet.getRange(1, current.length).setValue(h).setFontWeight("bold").setBackground("#f3f4f6");
    }
  });
  return current;
}

function findRow(sheet, idCol, id) {
  if (!id || idCol < 1 || sheet.getLastRow() < 2) return 0;
  var ids = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

// Files the PDF as "<Student> - <date> - <id>.pdf" inside <root>/<program title>/, reusing the file if it already exists.
function saveResume(data) {
  var root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  var folder = childFolder(root, safeName(data.programTitle || "Other programs"));
  var name = safeName((data.studentName || "Applicant") + " - " + String(data.submittedAt || "").slice(0, 10) + " - " + String(data.applicationId || "").slice(-6)) + ".pdf";
  var existing = folder.getFilesByName(name);
  if (existing.hasNext()) return existing.next().getUrl();
  var blob = Utilities.newBlob(Utilities.base64Decode(data.resumeFile.contentBase64), "application/pdf", name);
  return folder.createFile(blob).getUrl();
}

function childFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function safeName(s) {
  return String(s).replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim().slice(0, 100);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;
