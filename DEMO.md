# RentPilot — Demo Runbook

## 1. One-time setup (do once, ~3 min)

1. Supabase → SQL Editor → run, in order:
   - `database/schema.sql`
   - `database/rls_policies.sql`
   - `database/api_protection.sql`
   - `database/rights_sources_seed.sql`
2. Supabase → Authentication → Sign In / Up → **disable "Confirm email"** (demo accounts skip the inbox).

## 2. Start the app

```bash
npm install
python3 -m pip install -r backend/requirements.txt

# Terminal 1
npm run backend:dev

# Terminal 2
npm run frontend:dev
```

## 3. Seed demo data (backend must be running)

```bash
cd backend && python scripts/seed_demo.py
```

Creates 4 confirmed accounts (password `RentPilotDemo1!`) and 2 spaces + 2 seekers
in Chicago that match each other, so match cards are populated immediately.

## 4. Verify everything

```bash
cd backend && python scripts/smoke_test.py            # free checks
cd backend && python scripts/smoke_test.py --with-llm  # + OpenAI endpoints (costs cents)
```

All lines should say PASS.

## 5. Demo walkthrough (~3 min)

1. **Sign up** a fresh account → lands on accept-terms → dashboard.
2. **Match** → browse seeded spaces/seekers → **Post a seeker** (Chicago, Illinois,
   budget 800–1200, early bird, tidy) → instantly see matches on My Matches.
3. **Scam Detector** → paste: "Luxury 3BR downtown $500/mo! Wire first month via
   Western Union. No viewings." → high scam score + red flags.
4. **Lease Analyzer** → upload any lease PDF → red flags, tips, score.
5. **Tenant Rights** → state Illinois → "How much notice before my landlord can enter?"
