# RentSafe — Free Production Deployment

Total cost: **$0/month** (Vercel Hobby + Render Free + Supabase Free).
Only real spend is OpenAI usage, which is capped by per-user daily quotas.

## 0. One-time database setup

In the Supabase SQL editor run, in order (skip any you've already run):

1. `database/schema.sql`
2. `database/rls_policies.sql`
3. `database/api_protection.sql`  ← new (quotas + LLM cache)

## 1. Push the repo to GitHub

Render and Vercel both deploy from a GitHub repo. Private repo is fine.

## 2. Backend → Render (free)

1. render.com → New → Blueprint → pick your repo (it reads `render.yaml`).
2. Fill in the env vars when prompted: `OPENAI_API_KEY`, `OPENAI_MODEL`,
   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (the `sb_secret_...` one),
   and leave `FRONTEND_ORIGIN` empty until step 3 gives you the Vercel URL.
3. Deploy → note the URL, e.g. `https://rentsafe-api.onrender.com`.

Free-tier behavior: the service sleeps after 15 min idle and takes ~30s to
wake on the first request. Acceptable for a campus launch; upgrade later if
it bothers users.

## 3. Frontend → Vercel (free)

1. vercel.com → Add New Project → import the repo.
2. Set **Root Directory** to `frontend`.
3. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the `sb_publishable_...` key
   - `NEXT_PUBLIC_BACKEND_URL` = the Render URL from step 2
4. Deploy → note the URL, e.g. `https://rentsafe.vercel.app`.

## 4. Connect them

1. Back in Render → Environment → set `FRONTEND_ORIGIN` to the Vercel URL
   (no trailing slash) → redeploy.
2. Supabase → Authentication → URL Configuration → set Site URL to the
   Vercel URL and add it to Redirect URLs.

## 5. Verify production

```bash
BACKEND_URL=https://rentsafe-api.onrender.com python backend/scripts/smoke_test.py
```

(or just open the Vercel URL and run through the demo flow in DEMO.md).

## Cost controls already built in

| Control | Where | Default |
|---|---|---|
| Login required for all LLM features | backend `usage_service.require_user` | always on |
| Daily quota per user | `QUOTA_LEASE_PER_DAY` / `QUOTA_SCAM_PER_DAY` / `QUOTA_RIGHTS_PER_DAY` env vars | 3 / 5 / 10 |
| Response cache (repeat inputs free) | `llm_cache` table | always on |
| Model choice | `OPENAI_MODEL` env var | set to the cheapest tier that works |

Worst-case daily spend ≈ active_users × (3 lease + 5 scam + 10 rights) calls,
minus cache hits. For a campus pilot this is dollars, not hundreds.
