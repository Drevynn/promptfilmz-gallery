
DROP POLICY "Anyone can create tickets" ON public.support_tickets;

CREATE POLICY "Authenticated users can create tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);
