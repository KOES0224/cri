# CRI (criglobal.org)

Public site + student/admin portal for CRI student research programs.
Stack: Next.js 16 (App Router), React 19, Tailwind 4, Prisma 5 (PostgreSQL on Supabase), next-auth 4, Toss Payments, Vercel Blob, Resend, Google Sheets mirror.

## Deploy
- GitHub `KOES0224/cri`, branch `main` auto-deploys to Vercel project `cri-portal` (criglobal.org).
- Secrets live in `.env` locally and in Vercel project settings. Never commit `.env`.
- `npm run build` runs `npx prisma db push` first, which mutates the **production** database. For a local compile check use `npx next build` instead.

## Commands
- `npm run dev` — local dev server (uses `.env` DATABASE_URL, i.e. the live DB; be careful with writes)
- `npx next build` — production compile check without touching the DB
- `npm test` — unit tests (`tests/*.test.ts`)
- `npm run test:integration` — needs a disposable local PostgreSQL
- `npm run inventory:programs` / `inventory:review` — program/faculty data scripts (`--apply` to persist)

## Key paths
- Public pages: `src/app/page.tsx` (home), `src/app/research/*` (programs), `src/app/research/program/[id]` (detail + Apply), `src/app/apply/*` (application + Toss checkout), `src/app/admissions`, `src/app/contact`
- Shared program facts: `src/lib/program-policy.ts`; application rules: `src/lib/application-*.ts`
- Auth: `src/lib/auth.ts`, `src/app/auth/*`
- Admin dashboard: `src/app/dashboard/*`
- Data model: `prisma/schema.prisma`
- Rollout notes from the last UX pass: `docs/program-ux-rollout.md`

## Business priority
Visitor → program page → application. Public funnel work comes before admin tooling.
