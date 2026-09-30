# Google Sheet + Drive sync for applications

Every submitted application is posted to the Apps Script web app in `GOOGLE_SHEET_WEBHOOK_URL` (`src/lib/googleSheets.ts`). The script:

- appends one row per application, or updates the existing row with the same Application ID (so "Sync all" never duplicates);
- files the resume PDF in Google Drive under `ROOT_FOLDER_ID / <program title> / <student> - <date> - <id>.pdf` and answers with the Drive link, which the site stores on the application as `resumeDriveUrl` (shown as "Drive" in the admin views and in the admissions email).

The sync runs after the applicant's response is sent (`after()` in `src/app/actions/payment.ts`), so filing the PDF never slows down the submission. The payment-review account is skipped.

## Updating the script

1. Open the admissions Google Sheet → Extensions → Apps Script.
2. Replace the code with the script shown on `/dashboard/applications-admin/sheet` ("Copy Apps Script"), which is `GOOGLE_APPS_SCRIPT_TEMPLATE` in `src/lib/google-apps-script.ts`. `ROOT_FOLDER_ID` is the Drive folder for resumes.
3. Save, then Deploy → Manage deployments → pencil → Version: **New version** → Deploy. The web app URL does not change, so Vercel needs no edit.
4. The first request triggers a permission prompt for Drive; run `doPost` once from the editor (or authorise when prompted) to grant it.

## Backfill

"Sync all to Google Sheet" on the spreadsheet page re-sends every application with its PDF; rows are updated in place and missing Drive files are created.
