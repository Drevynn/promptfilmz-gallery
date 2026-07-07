import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CreditSummary {
  /** Starter (signup bonus) credits. */
  starter: number;
  /** Credits from the active subscription plan. */
  subscription: number;
  /** Sum of starter + subscription — what the user can actually spend. */
  balance: number;
  /** "free" | "pro" | "studio". */
  plan: string;
  /** End of the current Stripe billing period (ISO string), or null. */
  subscriptionPeriodEnd: string | null;
}

export function useCredits() {
  const { user } = useAuth();

  return useQuery<CreditSummary>({
    queryKey: ["credits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_credits")
        .select("balance, subscription_balance, plan, subscription_period_end")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      const starter = data?.balance ?? 0;
      const subscription = data?.subscription_balance ?? 0;
      return {
        starter,
        subscription,
        balance: starter + subscription,
        plan: data?.plan ?? "free",
        subscriptionPeriodEnd: data?.subscription_period_end ?? null,
      };
    },
  });
}
