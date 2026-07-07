
-- Contest entries table
CREATE TABLE public.contest_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shot_id uuid REFERENCES public.shots(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  votes integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (shot_id)
);

ALTER TABLE public.contest_entries ENABLE ROW LEVEL SECURITY;

-- Everyone can view contest entries
CREATE POLICY "Anyone can view contest entries"
  ON public.contest_entries FOR SELECT
  TO authenticated
  USING (true);

-- Users can submit their own shots
CREATE POLICY "Users can submit own shots"
  ON public.contest_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_own_project((SELECT project_id FROM public.shots WHERE shots.id = shot_id)));

-- Users can delete own entries
CREATE POLICY "Users can delete own entries"
  ON public.contest_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone authenticated can vote (update votes)
CREATE POLICY "Authenticated users can vote"
  ON public.contest_entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
