-- Add user_id column to support_tickets
ALTER TABLE public.support_tickets ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill: no existing data needs updating since we can't map emails to users reliably

-- Add SELECT policy so users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update INSERT policy to also set user_id
DROP POLICY IF EXISTS "Authenticated users can create tickets with own email" ON public.support_tickets;
CREATE POLICY "Authenticated users can create tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND ((email = auth.email()) OR (email IS NULL)));