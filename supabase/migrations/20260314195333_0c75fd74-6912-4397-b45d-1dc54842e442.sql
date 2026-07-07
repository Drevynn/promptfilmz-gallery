-- Scripts: Linked to projects
CREATE TABLE public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  content TEXT DEFAULT '',
  last_ai_suggestion TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scripts" ON public.scripts
  FOR SELECT TO authenticated
  USING (public.is_own_project(project_id));

CREATE POLICY "Users can create scripts in own projects" ON public.scripts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_own_project(project_id));

CREATE POLICY "Users can update own scripts" ON public.scripts
  FOR UPDATE TO authenticated
  USING (public.is_own_project(project_id));

CREATE POLICY "Users can delete own scripts" ON public.scripts
  FOR DELETE TO authenticated
  USING (public.is_own_project(project_id));

-- Auto-update timestamp
CREATE TRIGGER update_scripts_updated_at
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();