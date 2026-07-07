CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  description text NOT NULL,
  email text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create tickets"
ON public.support_tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Service role can manage tickets"
ON public.support_tickets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();