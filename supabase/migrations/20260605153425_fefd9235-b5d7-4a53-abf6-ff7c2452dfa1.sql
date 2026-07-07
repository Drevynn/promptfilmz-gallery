
-- 1. Extend user_credits with subscription pool
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS subscription_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

-- 2. Refill subscription credits at start of each billing cycle.
--    Rollover: leftover subscription_balance capped at 1x plan amount, then add new allowance.
--    Idempotent: only refills when the incoming period_end is strictly greater than stored value.
CREATE OR REPLACE FUNCTION public.refill_subscription_credits(
  _user_id uuid,
  _plan text,
  _amount integer,
  _period_end timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_end timestamptz;
  _current_sub integer;
BEGIN
  -- Ensure a row exists
  INSERT INTO public.user_credits (user_id, balance, subscription_balance, plan)
  VALUES (_user_id, 100, 0, 'free')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT subscription_period_end, subscription_balance
    INTO _current_end, _current_sub
  FROM public.user_credits
  WHERE user_id = _user_id
  FOR UPDATE;

  -- Only refill when entering a new billing period (or first time on a plan)
  IF _current_end IS NULL OR _period_end > _current_end THEN
    UPDATE public.user_credits
       SET subscription_balance = LEAST(_current_sub, _amount) + _amount,
           subscription_period_end = _period_end,
           plan = _plan,
           updated_at = now()
     WHERE user_id = _user_id;
  ELSE
    -- Same period — just keep plan name in sync (e.g. mid-cycle upgrade label)
    UPDATE public.user_credits
       SET plan = _plan,
           updated_at = now()
     WHERE user_id = _user_id AND plan IS DISTINCT FROM _plan;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refill_subscription_credits(uuid, text, integer, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refill_subscription_credits(uuid, text, integer, timestamptz) TO service_role;

-- 3. Atomic consume: starter credits first, then subscription credits.
--    Returns TRUE on success, FALSE if insufficient combined balance.
CREATE OR REPLACE FUNCTION public.consume_credits(
  _user_id uuid,
  _amount integer,
  _action_type text DEFAULT 'unknown'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _starter integer;
  _sub integer;
  _total integer;
  _from_starter integer;
  _from_sub integer;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN true;
  END IF;

  -- Ensure a row exists (legacy users may not have one)
  INSERT INTO public.user_credits (user_id, balance, subscription_balance, plan)
  VALUES (_user_id, 0, 0, 'free')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance, subscription_balance INTO _starter, _sub
  FROM public.user_credits
  WHERE user_id = _user_id
  FOR UPDATE;

  _total := COALESCE(_starter, 0) + COALESCE(_sub, 0);
  IF _total < _amount THEN
    RETURN false;
  END IF;

  _from_starter := LEAST(_starter, _amount);
  _from_sub := _amount - _from_starter;

  UPDATE public.user_credits
     SET balance = balance - _from_starter,
         subscription_balance = subscription_balance - _from_sub,
         updated_at = now()
   WHERE user_id = _user_id;

  INSERT INTO public.credit_transactions (user_id, amount, action_type)
  VALUES (_user_id, -_amount, _action_type);

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_credits(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credits(uuid, integer, text) TO service_role;
