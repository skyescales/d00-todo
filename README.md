# Gym Lead Tracker

A single-user CRM for cold outreach to independently-owned gyms, CrossFit boxes,
martial arts/boxing gyms, and personal training studios across Florida — the
kind of businesses that show weak marketing (no website, stale Instagram, thin
Google Business Profile) but plausibly have a $1,000–$2,000/month budget.

Built with Next.js (App Router) + TypeScript + Tailwind CSS + Prisma/Postgres.

## Features

- **Table view** — search by business name, filter by status/city, sort by any column.
- **Kanban board** — drag-and-drop (or dropdown) cards across the full pipeline.
- **Dashboard** — total leads, per-status counts, response rate, conversion rate, 30-day trend.
- **Add/edit form** covering every field in the data model, plus a **bulk CSV import** (paste or upload) with duplicate detection.
- **Quick actions** — `tel:` click-to-call, Instagram click-to-DM, inline status dropdown, append-only timestamped notes log.
- **Dedup** — Business Name + City is unique; duplicates are rejected/skipped with a clear message.
- **Automated daily sourcing** — a cron route sweeps a rotating Florida metro area every day via the Google Places API, applies weak-marketing + affordability heuristics, and inserts qualifying leads with `Status = New`.
- **Daily email summary** of newly-added leads via Resend (optional — skipped gracefully if not configured).
- **Single-user password gate** — no accounts, just one shared password behind signed-cookie middleware.

## Tech stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Prisma ORM + PostgreSQL (works with Vercel Postgres, Supabase, Neon, Railway, etc.)
- Resend for the daily email summary (optional)
- Google Places API for automated lead sourcing (optional but required for the sourcing job to find leads)

## Local development

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL, APP_PASSWORD, AUTH_SECRET at minimum
npx prisma db push      # create tables in your Postgres database
npm run seed             # optional: adds 2 sample leads
npm run dev
```

Visit `http://localhost:3000`, log in with `APP_PASSWORD`.

## Deploying to Vercel

1. **Push this repo to GitHub** (already done if you're reading this from the repo).
2. **Create a Postgres database.** Easiest options:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) — click "Storage" → "Create Database" in your Vercel project, it wires `DATABASE_URL` in automatically.
   - [Supabase](https://supabase.com) — create a project, copy the connection string (use the "Transaction" pooler URL, port 6543, and append `?pgbouncer=true` for serverless).
   - [Neon](https://neon.tech) — also serverless-Postgres-friendly, free tier works fine.
3. **Import the project into Vercel** ([vercel.com/new](https://vercel.com/new)), pointing at this GitHub repo.
4. **Set environment variables** in the Vercel project settings (see `.env.example` for the full list):
   - `DATABASE_URL` — your Postgres connection string
   - `APP_PASSWORD` — the password you'll use to log in
   - `AUTH_SECRET` — any long random string (`openssl rand -hex 32`)
   - `CRON_SECRET` — any long random string (`openssl rand -hex 32`); Vercel Cron sends this automatically once set
   - `GOOGLE_PLACES_API_KEY` — optional, needed for automated lead sourcing to actually find leads (see below)
   - `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO` — optional, needed for the daily email summary
5. **Push the schema to your database.** After the first deploy, run once from your machine (with `DATABASE_URL` pointed at the production database):
   ```bash
   npx prisma db push
   ```
6. **Deploy.** Vercel will pick up `vercel.json`, which schedules `/api/cron/source-leads` to run daily at 12:00 UTC. Adjust the cron schedule in `vercel.json` if you want a different time.

### Google Places API setup (for automated sourcing)

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a project (or reuse one) and enable the **Places API**.
2. Create an API key and restrict it to the Places API.
3. Set `GOOGLE_PLACES_API_KEY` in your Vercel env vars.

The daily job rotates through ~60 Florida metro areas (`src/lib/sourcing/regions.ts`), picking whichever region hasn't been searched in the longest time, so the whole state gets covered over time instead of the same cities repeating. For each candidate it fetches Places details (website, phone, rating, review count), applies a qualification heuristic (`src/lib/sourcing/qualify.ts`) — excludes known national chains, requires a gym/fitness/martial-arts keyword match, requires a weak-marketing signal (no real website or a thin review profile) *and* an affordability signal (15–500 reviews, 3.7+ rating) — and best-effort scrapes the business's own website for an Instagram link.

These are heuristics, not guarantees — skim new auto-sourced leads before diving into outreach, same as you would a manually-researched one.

### Resend setup (for the daily email summary)

1. Create a free account at [resend.com](https://resend.com), verify a sending domain (or use their test domain for personal use).
2. Create an API key, set `RESEND_API_KEY`.
3. Set `EMAIL_FROM` (must be on your verified domain) and `EMAIL_TO` (your inbox).

If these aren't set, the cron job still runs and adds leads — it just skips sending an email.

### Running the sourcing job manually

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/source-leads
```

## Data model

Each lead has: business name, city/area, website (or social-only flag), Instagram, phone, owner/manager name, marketing weakness notes, size/credibility signals (review count, rating, years in business, estimated members), source, date added, status, last contact date, and an append-only notes/activity log.

Status pipeline: `New → DM Sent / Called → Left Voicemail / No Answer / Replied / Left on Read / Ghosted → Follow Up Scheduled → Not Interested / Not a Fit / Dead → Closed–Won / Closed–Lost`.

## Project structure

```
prisma/schema.prisma        Lead, Note, SourcingRun models
src/middleware.ts           password-gate auth
src/lib/                    db client, status config, dedupe, csv mapping, email, sourcing
src/app/api/                leads CRUD + bulk import + notes + status, stats, cron, auth
src/app/(app)/              dashboard, leads table, board, lead detail/edit — all behind auth
src/app/login/              password gate UI
src/components/             table, kanban, forms, notes log, bulk import modal, etc.
```
