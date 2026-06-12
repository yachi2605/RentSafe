# LinkedIn Post Drafts — RentSafe

Pick one, attach the demo GIF/video as the visual, and put the live URL + repo
link in the FIRST comment (LinkedIn suppresses posts with links in the body).

---

## Version A — Story-led (recommended: best reach)

Last semester, a student I know wired a $1,200 deposit for an apartment near campus.

The apartment didn't exist.

Rental scam reports targeting students rose 22% last year — and international students, racing to find housing before classes start in a country whose rental laws they don't know, are the easiest targets.

So I built RentSafe 🏠 — a renter-safety platform for students:

📄 Upload a lease → AI flags risky clauses and scores how tenant-friendly it is
🚨 Paste a listing → scam score with specific red flags and hidden fees
⚖️ Ask a tenant-rights question → state-specific answers that refuse to guess
🤝 Find a roommate → explainable compatibility matching, verified .edu badges, built-in chat

The engineering I'm most proud of isn't the AI — it's making it affordable to run as a student: every AI endpoint sits behind login, per-user daily quotas, and a response cache, so identical questions cost $0. The whole stack (Next.js, FastAPI, Supabase) deploys for free.

Try it / roast it — links in the comments. Feedback welcome, especially from anyone who's survived a student housing search.

#BuildInPublic #FullStack #AI #StudentHousing #FastAPI #NextJS

---

## Version B — Technical (best for engineering audience)

I shipped RentSafe — an AI renter-safety platform — and the hardest problems had nothing to do with prompts.

The product: lease red-flag analysis, rental scam detection, a state-aware tenant-rights bot, and explainable roommate matching for students.

The engineering that actually mattered:

🔒 Postgres row-level security with a trusted service-role backend — and a signup trigger that auto-creates profiles (client-side inserts under RLS are a trap)
💸 Cost-bounded AI: JWT-verified endpoints + atomic per-user daily quotas (Postgres RPC) + a response cache. Two students asking the same Illinois question = one OpenAI call
🤝 Roommate matching as an 11-dim lifestyle vector with cosine similarity behind hard city/budget filters — plus a per-factor breakdown API so matches are explainable, not a black box
🛡️ Presidio PII scrubbing before lease text hits the LLM, prompt-injection delimiters, toxicity gating on user content
🐛 Custom middleware that returns crashes as CORS-safe JSON — because browsers mask uncorsed 500s as "Failed to fetch", the most misleading error in web dev

Stack: Next.js 14 / FastAPI / Supabase / OpenAI structured outputs. Deploys free on Vercel + Render.

Links in comments. Happy to go deep on any of these in the replies.

#SoftwareEngineering #FastAPI #NextJS #Postgres #AI

---

## Version C — Short (best if you post rarely)

Students lose thousands every year to rental scams and predatory leases.

I built RentSafe to fix that: AI lease analysis, scam detection, a tenant-rights bot, and explainable roommate matching — with verified .edu badges and built-in chat.

Full-stack: Next.js 14 + FastAPI + Supabase + OpenAI. Runs on $0/month infrastructure with per-user quotas keeping AI costs bounded.

Demo + repo in the comments 👇

#AI #FullStack #StudentHousing

---

## Posting tips

- Post Tue–Thu, 8–10am Chicago time.
- First comment: live URL + GitHub repo.
- Reply to every comment in the first 2 hours — it multiplies reach.
- Tag Illinois Tech's page; college pages often reshare student projects.
