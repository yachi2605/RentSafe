# RentPilot

A renter-safety platform for students and early-career renters. Four high-friction renter jobs in one product: lease review, scam detection, tenant-rights guidance, and roommate matching.

**Live app → [rent-safe-rose.vercel.app](https://rent-safe-rose.vercel.app)**

---

## What It Does

**Lease Analyzer** — Upload a lease PDF. Get a plain-English summary, red flags by risk level, negotiation tips, a tenant-friendliness score (1–10), a Q&A chat grounded in your actual lease, and a move-out protection checklist. No account required.

**Scam Detector** — Paste any rental listing (Craigslist, Facebook Marketplace, email, text). Get a scam risk score, verdict, red flags, and hidden fee warnings before you hand over any money. No account required.

**Tenant Rights Bot** — Ask renter questions and get source-backed answers. Currently covers California and Illinois. Outside that scope the bot refuses instead of guessing. No account required.

**Roommate Match** — Browse spaces and seekers, post your own listing, see compatibility scores with factor-by-factor explanations, and message matches on-platform. Requires account (contact details redacted until both parties agree).

**Dashboard + History** — Logged-in users get persistent history of all analyses, a personal dashboard, and cross-device access. Anonymous users get the last 3 results per tool stored locally for 7 days.

---

## Auth Model

The tools are free and work without an account. Authentication is only required for:

- Dashboard
- Roommate Match social features (posting, messaging, profile, my matches)

Creating an account adds persistent history, cross-device access, and unlocks Match. It does not gate the AI tools.

---

## Architecture

```
Browser
  → Next.js 14 frontend (Vercel)
  → Supabase Auth (session management)
  → FastAPI backend (Render)
      → optional_user() — returns user ID or None, never blocks anonymous
      → enforce_quota() — only for authenticated users
      → LLM cache — SHA-256 hash of input, applies to all users
      → OpenAI structured outputs
      → Supabase Postgres (history, profiles, matches, rights sources, cache)
```

### Key engineering decisions

- **Anonymous-first tools**: core AI endpoints use `optional_user()` — they accept both anonymous and authenticated requests. Quota enforcement only kicks in for logged-in users.
- **LLM caching**: every AI request is keyed on a SHA-256 hash of the input content. Repeat queries return cached results instantly with no OpenAI spend.
- **No IP-based rate limiting for anonymous users**: university campuses share IPs. Upstream OpenAI rate limits and the content hash cache handle volume abuse instead.
- **Explainable matching**: roommate compatibility is computed from structured signals (budget, timing, preferences) and returned with per-factor reasoning, not a black-box score.
- **Grounded rights answers**: the tenant rights bot retrieves curated legal sources from Supabase before calling OpenAI, so answers cite real statutes and refuse when coverage is missing.
- **localStorage fallback**: anonymous users get recent results persisted to localStorage (7-day TTL, 3 items max). History pages detect auth state and show local results or backend history accordingly.

### Feature pipelines

**Lease Analyzer**
1. User uploads PDF (no login required)
2. Backend extracts text with PyMuPDF, scrubs PII
3. Cache check — if hit, returns immediately
4. OpenAI returns structured red flags, score, summary, tips
5. If authenticated: saved to Supabase + quota incremented
6. If anonymous: saved to localStorage

**Scam Detector**
1. User pastes listing text (no login required)
2. Cache check on SHA-256 of input
3. OpenAI returns scam score, verdict, red flags, hidden fees, tips
4. If authenticated: saved to Supabase history
5. If anonymous: saved to localStorage

**Tenant Rights Bot**
1. User submits question + state (no login required)
2. Backend checks if state is in supported coverage
3. Matching legal sources pulled from Supabase rights registry
4. Sources passed to OpenAI as grounding context
5. Returns answer with citations, or refusal if coverage is missing

**Roommate Matching** (requires account)
1. Users create seeker or space posts
2. Backend normalizes location, redacts contact details
3. Compatibility scores computed from structured preference signals
4. Scores returned with per-factor breakdowns
5. On-platform chat with contact redaction until mutual reveal

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Pydantic |
| Auth + DB | Supabase (Auth, Postgres, RLS) |
| AI | OpenAI structured outputs |
| Hosting | Vercel (frontend), Render (backend) |

---

## Repo Layout

```
frontend/   Next.js app, components, pages
backend/    FastAPI routers, services, scripts
database/   Schema, RLS policies, cache/quota SQL, rights seed data
DEMO.md     Demo runbook
DEPLOY.md   Deployment notes
render.yaml Render backend config
```

---

## Run Locally

### 1. Database

Run in Supabase SQL Editor in order:

```
database/schema.sql
database/rls_policies.sql
database/api_protection.sql
database/rights_sources_seed.sql
```

If the DB predates week 2: also run `database/manual_migration_weeks_2_to_5.sql`

### 2. Backend

```bash
cp backend/.env.example backend/.env
# fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY
python3 -m pip install -r backend/requirements.txt
npm run backend:dev
```

### 3. Frontend

```bash
cp frontend/.env.local.example frontend/.env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL
npm install
npm run frontend:dev
```

### 4. Verify

```bash
npm run backend:check
npm run build
```

Full walkthrough: [DEMO.md](DEMO.md)

---

## Deployment

- Frontend → Vercel (auto-deploy from main)
- Backend → Render (config in `render.yaml`)
- Database → Supabase

Details: [DEPLOY.md](DEPLOY.md)

---

> RentPilot is informational software, not legal advice. Always verify listings, landlords, and lease terms independently before signing or paying anything.

Built by Yachi Darji.
