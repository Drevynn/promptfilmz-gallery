
-- Create shots table linked to projects
CREATE TABLE public.shots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_number text NOT NULL DEFAULT '1',
  shot_code text NOT NULL DEFAULT '1A',
  shot_type text NOT NULL DEFAULT 'Wide',
  description text NOT NULL DEFAULT '',
  lens text DEFAULT '50mm',
  movement text DEFAULT 'Static',
  angle text DEFAULT 'Eye Level',
  duration text DEFAULT '5s',
  is_completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shots ENABLE ROW LEVEL SECURITY;

-- RLS: Users can CRUD shots in their own projects
CREATE POLICY "Users can view own shots"
  ON public.shots FOR SELECT
  USING (is_own_project(project_id));

CREATE POLICY "Users can create shots in own projects"
  ON public.shots FOR INSERT
  WITH CHECK (is_own_project(project_id));

CREATE POLICY "Users can update own shots"
  ON public.shots FOR UPDATE
  USING (is_own_project(project_id));

CREATE POLICY "Users can delete own shots"
  ON public.shots FOR DELETE
  USING (is_own_project(project_id));

-- Trigger for updated_at
CREATE TRIGGER update_shots_updated_at
  BEFORE UPDATE ON public.shots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
