-- Restrict direct contest_entries SELECT to own entries only.
-- The public view (contest_entries_public) handles public display without exposing user_id.
DROP POLICY IF EXISTS "Authenticated can view contest entries" ON public.contest_entries;
CREATE POLICY "Users can view own contest entries"
  ON public.contest_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);