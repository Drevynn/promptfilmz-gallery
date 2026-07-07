CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY NOT NULL,
  render_complete boolean NOT NULL DEFAULT true,
  script_updates boolean NOT NULL DEFAULT true,
  contest_votes boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access notification_preferences"
  ON public.notification_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);