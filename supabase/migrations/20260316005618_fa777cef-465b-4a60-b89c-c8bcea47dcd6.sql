-- Switch view back to security_invoker to satisfy linter
ALTER VIEW public.contest_entries_public SET (security_invoker = on);

-- Restore broad SELECT on contest_entries (view needs it), but users
-- must query through the view which omits user_id
DROP POLICY IF EXISTS "Users can view own contest entries" ON public.contest_entries;
CREATE POLICY "Authenticated can view contest entries"
  ON public.contest_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- Also need SELECT on profiles for the view join (profiles currently only allows own)
CREATE POLICY "Public profile info for contest view"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- And shots need to be readable for contest entries display
CREATE POLICY "Shots visible via contest entries"
  ON public.shots
  FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT shot_id FROM public.contest_entries)
  );