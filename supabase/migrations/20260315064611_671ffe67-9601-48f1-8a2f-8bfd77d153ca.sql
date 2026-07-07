-- Remove the dangerous user-facing INSERT policy that allows arbitrary balance
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;