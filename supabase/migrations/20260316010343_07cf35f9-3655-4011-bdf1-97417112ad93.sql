-- Scope the profiles SELECT policy to only expose profiles of contest participants
DROP POLICY IF EXISTS "Public profile info for contest view" ON public.profiles;
CREATE POLICY "Contest participant profiles viewable"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.contest_entries WHERE contest_entries.user_id = profiles.id)
  );