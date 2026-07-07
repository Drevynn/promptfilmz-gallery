DROP POLICY "Authenticated users can create tickets" ON public.support_tickets;

CREATE POLICY "Authenticated users can create tickets with own email"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (email = auth.email() OR email IS NULL);