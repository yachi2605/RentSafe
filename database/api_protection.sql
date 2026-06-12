-- RentSafe: API usage quotas + LLM response cache
-- Run in the Supabase SQL editor (after rls_policies.sql).

CREATE TABLE IF NOT EXISTS public.api_usage (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,              -- 'lease' | 'scam' | 'rights'
  used_on DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, feature, used_on)
);

CREATE TABLE IF NOT EXISTS public.llm_cache (
  cache_key TEXT PRIMARY KEY,         -- sha256 of normalized input
  feature TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only the backend (service role) touches these tables; lock them down.
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_cache ENABLE ROW LEVEL SECURITY;

-- Atomic increment used by the backend quota check.
CREATE OR REPLACE FUNCTION public.increment_api_usage(p_user_id UUID, p_feature TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_count INT;
BEGIN
  INSERT INTO public.api_usage (user_id, feature, used_on, count)
  VALUES (p_user_id, p_feature, CURRENT_DATE, 1)
  ON CONFLICT (user_id, feature, used_on)
  DO UPDATE SET count = api_usage.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;
