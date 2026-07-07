
-- 1. Storage: remove public + unscoped policies on storyboard-images
DROP POLICY IF EXISTS "Public can view storyboard images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete storyboard images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload storyboard images" ON storage.objects;

-- 2. Profiles: drop overly broad contest-participant policy
DROP POLICY IF EXISTS "Contest participant profiles viewable" ON public.profiles;

-- Create a security-definer view exposing ONLY public profile fields of contest participants
CREATE OR REPLACE VIEW public.contest_participant_profiles
WITH (security_invoker = true)
AS
SELECT p.id, p.display_name, p.avatar_url, p.bio
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.contest_entries ce WHERE ce.user_id = p.id
);

-- Allow authenticated users to read this safe view
GRANT SELECT ON public.contest_participant_profiles TO authenticated, anon;

-- Need to permit underlying SELECT via a security-definer function for the view
-- Replace view with a SECURITY DEFINER function approach since RLS blocks underlying access
DROP VIEW IF EXISTS public.contest_participant_profiles;

CREATE OR REPLACE FUNCTION public.get_contest_participant_profile(_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, bio text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.bio
  FROM public.profiles p
  WHERE p.id = _user_id
    AND EXISTS (SELECT 1 FROM public.contest_entries ce WHERE ce.user_id = p.id);
$$;

GRANT EXECUTE ON FUNCTION public.get_contest_participant_profile(uuid) TO authenticated, anon;

-- 3. video_generations table for Luma ownership tracking
CREATE TABLE IF NOT EXISTS public.video_generations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  generation_id text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'luma',
  credited boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_generations TO authenticated;
GRANT ALL ON public.video_generations TO service_role;

ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video generations"
  ON public.video_generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages video generations"
  ON public.video_generations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_video_generations_user ON public.video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_generation_id ON public.video_generations(generation_id);

-- 4. Realtime authorization for shots channel
-- Topic convention: 'shots:<project_id>'
CREATE POLICY "Authenticated users can read own project shots realtime"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    (realtime.topic() LIKE 'shots:%')
    AND public.is_own_project(
      NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
    )
  );

CREATE POLICY "Authenticated users can join own project shots realtime"
  ON realtime.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (realtime.topic() LIKE 'shots:%')
    AND public.is_own_project(
      NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
    )
  );
