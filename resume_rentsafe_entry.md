# RentSafe — Resume Project Entry

## Project Document (per resume-tailor Step 4)

**Name & context:** RentSafe — full-stack AI renter-safety platform for students.
Solves: students (especially international) losing deposits to rental scams,
signing predatory leases, and finding incompatible roommates.

**Technical details:** Next.js 14 (App Router, TypeScript) frontend; FastAPI
backend; Supabase Postgres with row-level security + Auth; OpenAI structured
outputs parsed into Pydantic schemas; scikit-learn cosine-similarity matching
over 11-dimensional lifestyle vectors; Presidio PII scrubbing; JWT-verified
endpoints with atomic Postgres-RPC daily quotas and a response cache; deployed
free on Vercel + Render.

**Business impact & real facts (no fabrication needed):**
- 4 AI features behind one login: lease red-flag analysis, scam scoring (0–100),
  state-specific rights bot with hallucination refusal, explainable matching
- Repeat queries served from cache = $0 marginal API cost
- Per-user daily quotas make worst-case spend a known formula
- RLS policies across 8 tables; .edu verification; toxicity-filtered chat

**Role fit:** GenAI Engineer / AI Engineer (lead with LLM + systems); also
works for Data Scientist (lead with matching engine + explainability).

---

## Projects-section entry (.tex-ready bullets, 23–25 words each)

**RentSafe — AI Renter-Safety \& Roommate-Matching Platform** | *Next.js, FastAPI, Supabase, OpenAI* | Jun 2026

- Engineered full-stack AI renter-safety platform (Next.js, FastAPI, Supabase) integrating Pydantic-validated OpenAI structured outputs for lease red-flag analysis, scam scoring, and tenant-rights guidance.
- Architected explainable roommate-matching engine using 11-dimensional lifestyle vectors and cosine similarity (scikit-learn) behind hard budget/city filters, returning per-factor compatibility breakdowns.
- Operationalized cost-bounded LLM serving with JWT-verified endpoints, atomic per-user daily quotas via Postgres RPC, and response caching eliminating API spend on repeated queries.
- Orchestrated defense-in-depth security: Postgres row-level security across eight tables, Presidio PII scrubbing before LLM calls, prompt-injection guards, and toxicity filtering on user content.

*(Use all 4 for GenAI/AI-engineer applications; drop bullet 4 for analytics
roles and lead with bullet 2.)*

### LaTeX snippet (resume_template.tex format)

```latex
\resumeProjectHeading
  {\textbf{RentSafe — AI Renter-Safety \& Roommate-Matching Platform} $|$ \emph{Next.js, FastAPI, Supabase, OpenAI}}{Jun 2026}
  \resumeItemListStart
    \resumeItem{Engineered full-stack AI renter-safety platform (Next.js, FastAPI, Supabase) integrating Pydantic-validated OpenAI structured outputs for lease red-flag analysis, scam scoring, and tenant-rights guidance.}
    \resumeItem{Architected explainable roommate-matching engine using 11-dimensional lifestyle vectors and cosine similarity (scikit-learn) behind hard budget/city filters, returning per-factor compatibility breakdowns.}
    \resumeItem{Operationalized cost-bounded LLM serving with JWT-verified endpoints, atomic per-user daily quotas via Postgres RPC, and response caching eliminating API spend on repeated queries.}
    \resumeItem{Orchestrated defense-in-depth security: Postgres row-level security across eight tables, Presidio PII scrubbing before LLM calls, prompt-injection guards, and toxicity filtering on user content.}
  \resumeItemListEnd
```

**Before using:** push the repo to github.com/yachi2605 so the project is
verifiable, and add the live URL once deployed.
