-- Create a secure view that hides user_id from contest entries
CREATE OR REPLACE VIEW public.contest_entries_public AS
SELECT
  ce.id,
  ce.shot_id,
  ce.votes,
  ce.created_at,
  p.display_name AS director_name,
  p.avatar_url AS director_avatar
FROM public.contest_entries ce
LEFT JOIN public.profiles p ON p.id = ce.user_id;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.contest_entries_public TO authenticated;

-- Now restrict the direct table SELECT policy to own entries only
DROP POLICY IF EXISTS "Anyone can view contest entries" ON public.contest_entries;
CREATE POLICY "Users can view own contest entries"
  ON public.contest_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);