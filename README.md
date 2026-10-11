# Draven Intel

Next.js 14 (App Router) + Supabase. Private beta: evaluations run on sample data until the live engine ships.

## Deploy (Vercel)
- Framework preset: **Next.js** · Root directory: **empty** · Build/Install/Output: **defaults**
- Environment variables (Production, Preview, Development) — set BEFORE the first build:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Never add a `service_role` key to Vercel or to this repo.

## Repo root must contain
`app/ components/ lib/ public/ middleware.ts next.config.js package.json package-lock.json postcss.config.js tailwind.config.js tsconfig.json .gitignore .env.example README.md`

## Architecture
- The browser reads its own rows. Every change to credits, tracking, outcomes, referrals goes through a Postgres function (`lib/api.ts`).
- See the "Draven Intel v5.2 — Amendments & Production Framework" document for the full design.
