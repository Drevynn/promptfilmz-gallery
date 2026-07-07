-- Projects: change all policies from public to authenticated
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;

CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Videos: change from public to authenticated
DROP POLICY IF EXISTS "Users can create videos in own projects" ON public.videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can view own videos" ON public.videos;

CREATE POLICY "Users can create videos in own projects" ON public.videos FOR INSERT TO authenticated WITH CHECK (is_own_project(project_id));
CREATE POLICY "Users can delete own videos" ON public.videos FOR DELETE TO authenticated USING (is_own_project(project_id));
CREATE POLICY "Users can update own videos" ON public.videos FOR UPDATE TO authenticated USING (is_own_project(project_id));
CREATE POLICY "Users can view own videos" ON public.videos FOR SELECT TO authenticated USING (is_own_project(project_id));

-- Shots: change from public to authenticated
DROP POLICY IF EXISTS "Users can create shots in own projects" ON public.shots;
DROP POLICY IF EXISTS "Users can delete own shots" ON public.shots;
DROP POLICY IF EXISTS "Users can update own shots" ON public.shots;
DROP POLICY IF EXISTS "Users can view own shots" ON public.shots;

CREATE POLICY "Users can create shots in own projects" ON public.shots FOR INSERT TO authenticated WITH CHECK (is_own_project(project_id));
CREATE POLICY "Users can delete own shots" ON public.shots FOR DELETE TO authenticated USING (is_own_project(project_id));
CREATE POLICY "Users can update own shots" ON public.shots FOR UPDATE TO authenticated USING (is_own_project(project_id));
CREATE POLICY "Users can view own shots" ON public.shots FOR SELECT TO authenticated USING (is_own_project(project_id));

-- Profiles: change INSERT and view from public to authenticated
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Also fix the "Anyone can view profiles" policy if it exists
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;