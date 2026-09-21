# CRI (criglobal.org)

Public website and student/admin portal for CRI student research programs: program listings and detail pages, the application flow with Toss checkout, admissions and contact pages, blog and success stories, and an admin dashboard.

## Stack

Next.js 16 (App Router), React 19, Tailwind 4, Prisma 5 on PostgreSQL (Supabase), next-auth 4, Toss Payments, Vercel Blob, Resend, Google Calendar and a Google Sheets mirror.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server. Uses `.env` `DATABASE_URL`, i.e. the live database; be careful with writes. |
| `npx next build` | Production compile check that does not touch the database. |
| `npm test` | Unit tests (`tests/*.test.ts`). |
| `npm run test:integration` | Integration tests; needs a disposable local PostgreSQL. |
| `npm run inventory:programs` / `npm run inventory:review` | Program and faculty data scripts (`--apply` to persist). |
| `npm run lint` | ESLint. |

`npm run build` runs `npx prisma db push` before `next build` and therefore mutates the database that `DATABASE_URL` points at. Only run it where that is intended (Vercel); use `npx next build` locally.

## Deploy

- GitHub `KOES0224/cri`; the `main` branch auto-deploys to the Vercel project `cri-portal` (criglobal.org).
- Secrets live in `.env` locally and in the Vercel project settings. Never commit `.env`.
- `src/app/sitemap.ts` and `src/app/robots.ts` generate `/sitemap.xml` and `/robots.txt`; the canonical origin is set in `src/lib/seo.ts`.

## Environment variables

Set these in `.env` locally and in Vercel. Values are never committed.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler; port 5432 is rewritten to the transaction pooler). |
| `NEXTAUTH_SECRET` | next-auth session signing secret. |
| `NEXTAUTH_URL` | Public origin used by next-auth and in emails. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for admin media uploads (`cri_READ_WRITE_TOKEN` is accepted as an alias). |
| `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN` | Google Calendar integration for consultation scheduling. |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` | Toss Payments keys for the application fee checkout. Missing keys fail closed. |
| `RESEND_API_KEY`, `AUTH_EMAIL_FROM` | Transactional email (password recovery, notifications). `AUTH_EMAIL_FROM` must be a verified sender. |
| `ADMISSIONS_NOTIFY_EMAIL` | Inbox that receives new-application notifications. |
| `GOOGLE_SHEET_WEBHOOK_URL` | Apps Script webhook that mirrors applications to a Google Sheet. |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | Optional analytics IDs; analytics are disabled when unset. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional Google sign-in provider for next-auth. |

## Key paths

- Public pages: `src/app/page.tsx` (home), `src/app/research/*` (programs), `src/app/research/program/[id]` (detail and Apply), `src/app/apply/*` (application and Toss checkout), `src/app/admissions`, `src/app/contact`
- Shared program facts: `src/lib/program-policy.ts`; application rules: `src/lib/application-*.ts`
- Auth: `src/lib/auth.ts`, `src/app/auth/*`
- Admin dashboard: `src/app/dashboard/*`
- Data model: `prisma/schema.prisma`
- Rollout notes from the last UX pass: `docs/program-ux-rollout.md`
