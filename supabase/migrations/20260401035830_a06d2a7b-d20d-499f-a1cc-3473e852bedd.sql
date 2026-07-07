
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_fest_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT NULL;

-- Set trial_started_at for existing users to their signup time
UPDATE public.profiles SET trial_started_at = created_at WHERE trial_started_at IS NULL;
