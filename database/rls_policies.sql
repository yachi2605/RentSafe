-- RentPilot: RLS policies + auto profile creation
-- Run this in the Supabase SQL editor.

-- 1) Auto-create a profile row whenever a new auth user signs up.
--    SECURITY DEFINER bypasses RLS, so this always works (even before email confirmation).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, tos_accepted)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Backfill: create profile rows for users who signed up while signup was broken.
INSERT INTO public.profiles (id, email, full_name, tos_accepted)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data ->> 'full_name', ''), false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 3) Profiles policies: anyone authenticated can read; users manage only their own row.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

ALTER TABLE public.rights_sources ENABLE ROW LEVEL SECURITY;

-- 4) Post/match/message tables.
--    The FastAPI backend uses the service role key (bypasses RLS), so these
--    policies only govern direct client access (e.g. Realtime subscriptions).

ALTER TABLE public.space_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "space_posts_select" ON public.space_posts;
CREATE POLICY "space_posts_select" ON public.space_posts
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "space_posts_write_own" ON public.space_posts;
CREATE POLICY "space_posts_write_own" ON public.space_posts
  FOR ALL TO authenticated USING (auth.uid() = poster_id) WITH CHECK (auth.uid() = poster_id);

ALTER TABLE public.seeker_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seeker_posts_select" ON public.seeker_posts;
CREATE POLICY "seeker_posts_select" ON public.seeker_posts
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "seeker_posts_write_own" ON public.seeker_posts;
CREATE POLICY "seeker_posts_write_own" ON public.seeker_posts
  FOR ALL TO authenticated USING (auth.uid() = seeker_id) WITH CHECK (auth.uid() = seeker_id);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "matches_select_own" ON public.matches;
CREATE POLICY "matches_select_own" ON public.matches
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.space_posts sp WHERE sp.id = space_post_id AND sp.poster_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.seeker_posts se WHERE se.id = seeker_post_id AND se.seeker_id = auth.uid())
  );

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select_in_match" ON public.messages;
CREATE POLICY "messages_select_in_match" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.space_posts sp ON sp.id = m.space_post_id
      JOIN public.seeker_posts se ON se.id = m.seeker_post_id
      WHERE m.id = match_id AND (sp.poster_id = auth.uid() OR se.seeker_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

ALTER TABLE public.lease_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lease_analyses_own" ON public.lease_analyses;
CREATE POLICY "lease_analyses_own" ON public.lease_analyses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.scam_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scam_checks_own" ON public.scam_checks;
CREATE POLICY "scam_checks_own" ON public.scam_checks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
