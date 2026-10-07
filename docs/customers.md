# Customer directory (`/dashboard/contacts`)

Everyone who enrolled in a CRI program, with or without a portal account. One `Contact` per person
(matched by student email), one `ContactProgram` per cohort they joined. Repeat customers and siblings
are not stored as labels: "Repeat" is simply more than one program row, "Family" is a confirmed
`householdId` (the page suggests matches on parent email or parent phone and an admin confirms them).

## Segments
Computed from `studentLevel` (SCHOOL / UNIVERSITY) and `gradYear` against the current calendar year
(`src/lib/contacts.ts`, `segmentOf`). Nothing to update when the year changes. Records whose level or
year could not be determined are flagged `reviewNeeded`; open the row, set the values once, and the
flag clears (`levelSource` becomes MANUAL and later imports never overwrite it).

## Data sources
- `scripts/import-contacts.ts <workbook.xlsx> [--apply]` imports the consolidated enrolment workbook
  (sheet `전체 고객 리스트`). The workbook holds personal data and stays outside the repository.
- Portal applications: a submitted application is mirrored as an APPLIED program row
  (`cohortKey = program:<programId>`), ENROLLED when admissions enrol it, CANCELLED when it is rejected
  first. The page shows customers (enrolled) by default; switch "Show" to applicants or everyone.
- Accounts: on sign-up and sign-in (`linkContactToUser`) the account is attached to the record with the
  same student email (`userId`) or parent email (`parentUserId`). The People page shows the customer
  record and the Customers page links back to the account. `scripts/link-contacts-to-accounts.ts`
  backfills both for accounts and applications that already existed.

## Email
The directory does not send email. "Send to Resend audience" creates a Resend Audience from the
current filter (opted-out and bounced people excluded, one contact per address) and the email is
written and sent from Resend → Broadcasts, which delivers one copy per person with an unsubscribe link.
Unsubscribes and bounces come back through `POST /api/webhooks/resend` and mark the contact, so the
next audience skips them. Setup: in Resend add a webhook for `contact.updated`, `email.bounced`,
`email.complained` pointing at `https://criglobal.org/api/webhooks/resend`, and put its signing
secret in Vercel as `RESEND_WEBHOOK_SECRET`. `RESEND_API_KEY` must allow audiences ("full access").

Promotional email to Korean recipients needs the `(광고)` subject prefix, sender identification and an
unsubscribe method; operational notices (certificates, paper status) do not.
