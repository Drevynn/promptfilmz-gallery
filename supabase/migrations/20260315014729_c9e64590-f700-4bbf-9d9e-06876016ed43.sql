-- 1. Drop the insecure user_credits UPDATE policy for authenticated users
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;

-- 2. Drop the insecure credit_transactions INSERT policy for authenticated users
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.credit_transactions;

-- 3. Restrict profiles SELECT to own profile only
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);