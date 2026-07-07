
-- Create a votes tracking table to prevent double-voting
CREATE TABLE public.contest_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES public.contest_entries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (entry_id, user_id)
);

ALTER TABLE public.contest_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own votes"
  ON public.contest_votes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own votes"
  ON public.contest_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes"
  ON public.contest_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Drop the permissive UPDATE policy on contest_entries
DROP POLICY "Authenticated users can vote" ON public.contest_entries;

-- Create a secure function to handle voting
CREATE OR REPLACE FUNCTION public.toggle_contest_vote(_entry_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existed boolean;
BEGIN
  DELETE FROM public.contest_votes WHERE entry_id = _entry_id AND user_id = auth.uid();
  GET DIAGNOSTICS _existed = ROW_COUNT;
  
  IF _existed THEN
    UPDATE public.contest_entries SET votes = votes - 1 WHERE id = _entry_id;
    RETURN false; -- unvoted
  ELSE
    INSERT INTO public.contest_votes (entry_id, user_id) VALUES (_entry_id, auth.uid());
    UPDATE public.contest_entries SET votes = votes + 1 WHERE id = _entry_id;
    RETURN true; -- voted
  END IF;
END;
$$;
