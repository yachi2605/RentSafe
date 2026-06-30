# RentPilot

RentPilot is a renter-safety platform for students and early-career renters. It combines four high-friction renter jobs in one product:

- lease review
- rental scam detection
- grounded tenant-rights guidance
- roommate / room matching

The goal is not to be a legal service or a listing marketplace. The goal is to give renters better decision support before they sign, pay, or message.

## Try It

- Live app: [https://rent-safe-rose.vercel.app/login](https://rent-safe-rose.vercel.app/login)

## What It Does

### Current launch scope

- **Lease Analyzer**: upload a lease PDF and get a plain-English summary, red flags, negotiation tips, and a tenant-friendliness score.
- **Scam Detector**: paste a listing and get a scam score, red flags, and likely fee issues.
- **Tenant Rights Bot**: ask renter questions and get source-backed answers for the current launch states.
- **Roommate Match**: browse spaces and seekers, post your own listing, and see compatibility breakdowns instead of black-box matches.
- **Match Chat + Safety Rails**: on-platform chat, contact-detail redaction, moderation reports, and trust messaging.
- **History + Dashboard**: saved lease analyses, saved scam checks, and quick-return navigation.

### Current rights coverage

The grounded rights bot currently ships with launch coverage for:

- California
- Illinois

Outside that scope, the bot refuses instead of pretending to know the law.

## Architecture

```text
User
  -> Next.js frontend on Vercel
  -> Supabase Auth for login/session
  -> FastAPI backend on Render with bearer token
  -> Backend verifies user + applies quotas/cache/safety rails
  -> Backend either:
       - reads/writes Supabase Postgres
       - calls OpenAI for structured analysis/generation
       - combines both for grounded rights answers
  -> Frontend renders saved history, match results, and AI output
```

### How the system works

- **Frontend**: Next.js handles the UI, protected routes, form flows, and browser-side session handling through Supabase.
- **Authentication**: users log in with Supabase Auth. The frontend sends the session token to the FastAPI backend on protected requests.
- **Backend API**: FastAPI is the trusted server layer. It validates requests, enforces daily usage quotas, checks cache hits, applies safety filters, and decides whether a request needs OpenAI or only database reads/writes.
- **Database**: Supabase Postgres stores profiles, posts, matches, reports, lease/scam history, cached responses, quotas, and curated tenant-rights sources.
- **LLM layer**: OpenAI is used for lease analysis, scam detection, lease Q&A, negotiation drafting, move-out checklists, and source-grounded tenant-rights answers. Structured outputs are used where possible so the frontend receives predictable JSON.

### Feature pipelines

- **Lease Analyzer**
  - User uploads PDF in the frontend
  - Backend extracts PDF text with PyMuPDF
  - PII is scrubbed before LLM use
  - OpenAI returns structured lease summary, red flags, tips, and score
  - Result is saved to Supabase and shown in the UI

- **Scam Detector**
  - User submits listing text
  - Backend requires login, checks quota/cache, and guards against prompt injection
  - OpenAI returns a structured scam score, verdict, red flags, hidden fees, and tips
  - Result is stored in history and rendered in the dashboard/history views

- **Tenant Rights Bot**
  - User submits a question plus state
  - Backend checks whether the state is in supported launch coverage
  - Matching legal sources are selected from the curated rights registry in Supabase
  - Source summaries are passed to OpenAI as context
  - Backend returns a grounded answer with source links, or a refusal if coverage is missing

- **Roommate Matching**
  - Users create seeker or space posts
  - Backend normalizes location fields, redacts contact details, and saves posts
  - Matching logic runs in Python on renter preferences, budget, move-in timing, and home features
  - The API returns compatibility scores plus factor-by-factor explanations

### Key engineering decisions

- **Cost-bounded AI**: paid AI endpoints require login, enforce per-user quotas, and cache repeat inputs.
- **Explainable matching**: compatibility is computed from renter and apartment signals, then returned with factor-by-factor reasoning.
- **Safer failure modes**: the rights bot refuses outside supported coverage; backend errors return CORS-safe JSON; public text is moderated before reuse.
- **Lean launch runtime**: the default backend requirements only include packages needed to run the launch product.

### Diagram-friendly summary

If you want to draw this as a graph, use this shape:

```text
Browser
  -> Next.js frontend
  -> Supabase Auth
  -> FastAPI backend
FastAPI backend
  -> Usage quota + cache + moderation/safety layer
  -> OpenAI API
  -> Supabase Postgres
Supabase Postgres
  -> profiles / posts / matches / reports / history / rights_sources / llm_cache
```

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Pydantic
- **Data/Auth**: Supabase Postgres + Auth + RLS
- **AI**: OpenAI structured outputs

Optional heavier local dependencies such as Presidio-based PII tooling are separated from the default launch runtime.

## Repository Layout

```text
frontend/   Next.js app and UI components
backend/    FastAPI API, services, scripts, and env examples
database/   schema, RLS, cache/quota SQL, and rights-source seed data
DEMO.md     demo runbook
DEPLOY.md   deployment notes
render.yaml Render backend deployment config
```

## Run Locally

### 1. Database setup

Run these in Supabase SQL Editor:

1. `database/schema.sql`
2. `database/rls_policies.sql`
3. `database/api_protection.sql`
4. `database/rights_sources_seed.sql`

If the database was created before the later weeks landed, also run:

5. `database/manual_migration_weeks_2_to_5.sql`

### 2. Backend

```bash
python3 -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
npm run backend:dev
```

### 3. Frontend

```bash
npm install
cp frontend/.env.local.example frontend/.env.local
npm run frontend:dev
```

### 4. Verification

```bash
npm run backend:check
npm run build
```

For a fuller walkthrough, use [DEMO.md](DEMO.md).

## GitHub / Portfolio Review Strategy

This repository is intentionally the **source-of-truth project repo**, not a permanently open public demo.

Reason: the AI features use paid API credits. If a public live URL is shared broadly, strangers can consume real backend and OpenAI usage.

### Recommended way to present it

- keep the GitHub repo clean and public
- use this README to explain scope and architecture
- add screenshots or a short screen-recorded walkthrough in the repo or project post
- only share a live deployment privately, temporarily, or with demo accounts if you are comfortable with the spend

If you want a truly public live showcase later, the right next step is a **mock/demo mode** or a **read-only hosted demo** that does not hit your paid AI stack.

## Deployment

Reference deployment notes live in [DEPLOY.md](DEPLOY.md). The project is set up for:

- Vercel for the frontend
- Render for the backend
- Supabase for database and auth

## Important Notes

- RentPilot is informational software, not legal advice.
- The project should never expose real secret keys in tracked files.
- `.env` files stay local and are ignored by git.

---

Built by Yachi Darji.
