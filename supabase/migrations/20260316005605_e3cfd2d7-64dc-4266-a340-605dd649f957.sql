-- The view intentionally uses SECURITY DEFINER to bypass per-user RLS on contest_entries
-- since contest entries are meant to be publicly viewable (minus user_id).
-- Set security_invoker = off (default/definer mode) so the view can read all entries.
ALTER VIEW public.contest_entries_public SET (security_invoker = off);