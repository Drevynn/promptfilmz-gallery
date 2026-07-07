ALTER TABLE public.contest_entries 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'best_overall';