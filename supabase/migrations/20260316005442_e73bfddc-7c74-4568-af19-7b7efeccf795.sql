-- Fix: Make the view use SECURITY INVOKER instead of SECURITY DEFINER
ALTER VIEW public.contest_entries_public SET (security_invoker = on);