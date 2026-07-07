
-- Create scenes table
CREATE TABLE public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  scene_number INT NOT NULL,
  slugline TEXT,
  summary TEXT
);

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

-- Helper: check if user owns the script
CREATE OR REPLACE FUNCTION public.is_own_script(_script_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scripts s
    JOIN public.projects p ON p.id = s.project_id
    WHERE s.id = _script_id AND p.user_id = auth.uid()
  )
$$;

CREATE POLICY "Users can view own scenes" ON public.scenes
  FOR SELECT TO authenticated USING (is_own_script(script_id));
CREATE POLICY "Users can create scenes in own scripts" ON public.scenes
  FOR INSERT TO authenticated WITH CHECK (is_own_script(script_id));
CREATE POLICY "Users can update own scenes" ON public.scenes
  FOR UPDATE TO authenticated USING (is_own_script(script_id));
CREATE POLICY "Users can delete own scenes" ON public.scenes
  FOR DELETE TO authenticated USING (is_own_script(script_id));

-- Service role full access for edge functions
CREATE POLICY "Service role full access scenes" ON public.scenes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add new columns to shots table
ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE;
ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS order_index INT NOT NULL DEFAULT 0;
ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS camera_angle TEXT DEFAULT 'Eye Level';
ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS motion_intensity INT DEFAULT 50;
ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
