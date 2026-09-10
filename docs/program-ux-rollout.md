# Program UX and admissions update

Public program facts now come from `src/lib/program-policy.ts`. Summer cohorts are in person, have capacity 10 and 30 professor / 20 TA hours. Winter cohorts are online, have capacity 5 and 10 professor / 30 TA hours. Individual research has no displayed capacity and typically takes 2–4 months around the student's schedule. Student interests and student authorship are explained throughout.

Dates are inclusive in Asia/Seoul. An OPEN program becomes completed after its end date; unpublished and manually closed records cannot accept applications. This runs in page rendering and again before charging, without a scheduled job. The public listing checks the clock every 30 seconds. Set an end date for each seasonal cohort. A new season requires a new published cohort and its actual dates; the site never invents future recruitment dates. Student capacity is a published cohort limit, not an unverified live seat counter.

## Deployment

This branch has NOT modified the production database. The existing build command runs `prisma db push` before Next.js build. The schema adds `User.sessionVersion`, `RequestLimit`, `ApplicationDocument`, and `ApplicationCheckout`; it does not remove existing application fields. Use a separate preview database and preserve a production backup before rollout. Existing database contents and any legacy public CV URLs must be reviewed separately; new private uploads cannot revoke old blob links.

Configure `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`, and `TOSS_SECRET_KEY` using the deployment provider's secret settings. Missing payment keys now fail closed instead of silently switching to test credentials. `RESEND_API_KEY` and verified `AUTH_EMAIL_FROM` enable password recovery; otherwise the recovery page gives an honest support route. Never commit secrets. Public administrator media still uses `BLOB_READ_WRITE_TOKEN` or `cri_READ_WRITE_TOKEN`.

The existing charge remains KRW 68,000. The site distinguishes this checkout amount from the advertised USD 50 application fee and separate USD tuition. Confirm the desired merchant currency policy before changing the charge. No live charge, real email, or production export was performed during this work.

## Inventory updates

With the intended database selected, run `npm run inventory:programs` to review canonical program facts, then `npm run inventory:programs -- --apply` to persist them. Confirm which legacy Summer Camp records belong to Global before applying: no location or professor assignment is guessed from a university name. Public pages already use the shared facts regardless of stale legacy capacity/format fields.

Run `npm run inventory:review` to preview revised faculty bios, then `npm run inventory:review -- --apply` to update the inventory. The reviewed catalog includes 26 profiles and primary-source URLs. It corrects role wording, preserves relationships, course descriptions, photos and university fields, skips unmatched names, and refuses concurrent overwrites. The update is repeatable and does not run on every deployment, so later editorial changes are preserved. Historical appointments are explicitly historical where current status was not verified. Faculty availability and CRI teaching arrangements still require the organization's confirmation.

## Payment and data operations

Application data is held in an authenticated server-owned checkout, never trusted from browser storage or callback parameters. The order is bound to the user, program, amount and currency. The provider is checked before creating one application per student/program. Duplicate callbacks reuse the completed application. A confirmed charge can be reconciled after an interruption without charging again. Expired, unconfirmed orders require admissions review before another payment; do not delete an order until the provider status is reconciled. Saved pending forms are restored for the owner; revisions during an active checkout require admissions assistance.

PDF documents are downloaded only by their owner or an administrator with `private, no-store` and attachment headers. Account deletion cascades to its uploaded documents and checkout data. Define and implement the organization's retention schedule for abandoned uploads, expired checkout form data and CRM leads; this change does not invent legal retention periods. Expired `RequestLimit` rows and reset tokens can be removed periodically. Do not purge unresolved payment references. The privacy page is practical privacy information, not a substitute for the organization's approved legal policy or refund terms.

The external Google Sheets mirror is best effort after the application is committed. A sheet failure must be reconciled from the dashboard; it does not turn a completed charge into a second checkout. Success stories and gallery content remain an editorial task; the gallery now has its own genuine empty page.

## Verification

`npm test` covers Seoul date boundaries, program standards, manual closure, redirect restrictions, password limits, required application fields, essay limits, payment amount/currency/order checks and provider error sanitization.

`npm run test:integration` requires a disposable localhost PostgreSQL database with the schema applied. It creates synthetic fixtures, mocks only session context and external payment/spreadsheet calls, and checks real database access control, private documents, checkout reuse, amount tampering, duplicate callbacks, privilege escalation, one-use reset tokens and session revocation. It refuses a non-local database.

No live payment, OAuth-provider login, recovery email delivery or production data migration is certified by these local tests. Test those with the deployment's sandbox accounts and isolated preview data before opening admissions.

### Completed local checks (2026-09-11)

- Default Next.js production build passed; standalone TypeScript checking passed after removing stale generated development route types.
- Seven unit tests and the database integration suite passed with synthetic local fixtures.
- Browser verification at desktop and 390px mobile width: initial white navigation with intentional cursor reveal preserved; navigation closes after page change; View Gallery opens the real empty gallery; winter facts display correctly; filters respond; document width equals viewport width.
- Dependency updates remove the reported high and critical findings in the installed dependency tree. The final audit still reports moderate findings through the Google API dependency chain; these are not represented as resolved. No claim of a comprehensive security certification is made.
