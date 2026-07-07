-- The view must use security_definer to bypass per-user RLS on contest_entries,
-- since it's designed to show all entries publicly (minus user_id).
-- This is an intentional, safe use of security_definer — the view only exposes
-- non-sensitive columns (id, shot_id, votes, created_at, director_name, director_avatar, shot data).
ALTER VIEW public.contest_entries_public SET (security_invoker = off);