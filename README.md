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
- **Automated daily sourcing** — a cron route hands Claude a rotating Florida metro area every day and lets it actually research the web (search + read gym websites, Google Business Profiles, Instagram) the way a human prospector would, judge weak-marketing + affordability signals itself, and insert qualifying leads with `Status = New`. It actively searches for each lead's real Instagram handle and flags whether it found one (`verified`) or not (`not_found`) — unfound ones get a one-click "Search Instagram" button in the UI instead of a guess.
- **Daily email summary** of newly-added leads via Resend (optional — skipped gracefully if not configured).
- **Single-user password gate** — no accounts, just one shared password behind signed-cookie middleware.

## Tech stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Prisma ORM + PostgreSQL (works with Vercel Postgres, Supabase, Neon, Railway, etc.)
- Resend for the daily email summary (optional)
- Anthropic API (Claude + the web search / web fetch tools) for automated lead sourcing — required for the sourcing job to find leads; see [Cost](#automated-sourcing-claude--web-search) below before turning it on

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
   - `ANTHROPIC_API_KEY` — **leave this unset until you've read the cost section below.** Without it, the cron job runs on schedule but is a harmless no-op (it logs "not configured" and exits — no research, no cost). Add the key only once you're ready to start spending.
   - `SOURCING_MODEL` — optional, defaults to `claude-opus-5`; set to `claude-sonnet-5` for roughly half the cost (see below)
   - `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO` — optional, needed for the daily email summary
5. **Push the schema to your database.** After the first deploy, run once from your machine (with `DATABASE_URL` pointed at the production database):
   ```bash
   npx prisma db push
   ```
6. **Deploy.** Vercel will pick up `vercel.json`, which schedules `/api/cron/source-leads` to run daily at 12:00 UTC. Adjust the cron schedule in `vercel.json` if you want a different time.
7. **Function duration.** Claude's research for one region can involve dozens of web searches/fetches and take a few minutes wall-clock. `maxDuration` is set to 300s in the cron route (`src/app/api/cron/source-leads/route.ts`) — the maximum allowed on Vercel's free **Hobby** plan, so the default works with no paid plan required. If runs are regularly getting cut off mid-research, upgrade to **Pro** and enable **Fluid Compute** (Project Settings → Functions), which allows up to 800s — raise `maxDuration` accordingly once that's on.

### Automated sourcing (Claude + web search)

1. Get an API key at [console.anthropic.com](https://console.anthropic.com) → API Keys.
2. Set `ANTHROPIC_API_KEY` in your Vercel env vars once you're ready to turn sourcing on.

The daily job rotates through ~60 Florida metro areas (`src/lib/sourcing/regions.ts`), picking whichever region hasn't been searched in the longest time so the whole state gets covered over time instead of the same cities repeating. For that region, `src/lib/sourcing/research.ts` gives Claude the `web_search` and `web_fetch` tools and a detailed brief: survey roughly 50-100 candidate gyms/studios, judge each against the independently-owned / weak-marketing / affordability criteria itself (reading actual websites, reviews, and social activity rather than scoring a fixed data structure), and actively search for each qualifier's real Instagram handle rather than guessing one. A small local safety net (`src/lib/sourcing/qualify.ts`) still rejects anything matching a known national-chain name before insertion.

This is model judgment, not a guarantee — skim new auto-sourced leads before diving into outreach, same as you would a manually-researched one. Every field it filled in (weakness notes, size signals, source notes) is there so you can sanity-check its reasoning at a glance.

#### Cost

Web search costs **$10 per 1,000 searches** plus standard token costs for search-generated content; web fetch has no extra charge beyond token costs. One daily run budgets up to 30 searches and 20 fetches surveying ~50-100 businesses. Based on that budget:

| Model | Est. cost / day | Est. cost / month (30 runs) |
|---|---|---|
| `claude-opus-5` (default) | ~$0.50–$2.00 | ~$15–$60 |
| `claude-sonnet-5` (`SOURCING_MODEL=claude-sonnet-5`) | ~$0.25–$1.00 | ~$8–$30 |

These are estimates, not guarantees — actual spend depends on how much the model decides to search and read on a given day. Real numbers are logged per run (tokens, search count, estimated cost) to the `SourcingRun` table and shown on the dashboard under "Latest auto-sourcing runs", including a rolling 30-day total. For billing-accurate numbers, check the [Anthropic Console usage page](https://console.anthropic.com/settings/usage). If cost matters more than thoroughness, lower `MAX_WEB_SEARCHES`/`MAX_WEB_FETCHES` in `src/lib/sourcing/research.ts` or switch to `claude-sonnet-5`.

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

Each lead has: business name, city/area, website (or social-only flag), Instagram (plus a confidence flag — `verified` when auto-research found and matched a real profile or a human entered it, `not_found` when auto-research looked and couldn't confirm one), phone, owner/manager name, marketing weakness notes, size/credibility signals (review count, rating, years in business, estimated members), source, date added, status, last contact date, and an append-only notes/activity log.

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
