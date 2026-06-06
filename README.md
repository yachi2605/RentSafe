# RentSafe

RentSafe is a full-stack renter ecosystem web application that helps renters analyze leases, detect scams, understand tenant rights, and match with other renters for shared housing.

## Monorepo layout

- `frontend/` — Next.js 14 (App Router) web app
- `backend/` — FastAPI API service
- `database/` — SQL schema for Supabase Postgres

## Requirements

- Node.js 20+
- Python 3.11+
- Supabase project (Postgres + Auth + Storage)

## Environment setup

### Frontend

Create `frontend/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Backend

Create `backend/.env`:

```
ANTHROPIC_API_KEY=your_anthropic_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

## Running locally

### Backend

1. Create a virtual environment and install dependencies from `backend/requirements.txt`.
2. Run the API:

```
uvicorn main:app --reload
```

### Frontend

1. Install dependencies in `frontend/`.
2. Run the app:

```
npm run dev
```

## Supabase setup

1. Run the SQL in `database/schema.sql` inside Supabase.
2. Create a storage bucket named `leases` (private) for lease PDFs.
3. Enable Realtime on `matches` and `messages` tables if you want realtime updates.

## Notes

- AI features rely on Anthropic Claude and require a valid API key.
- The Tenant Rights Bot uses RAG over the files in `backend/data/tenant_laws/`.
