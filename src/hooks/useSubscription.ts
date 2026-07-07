import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const TIERS = {
  pro: {
    price_id: "price_1TEJMZ7pm1sWSXu2cMZxcH3J",
    product_id: "prod_UCioB4YN7q42vp",
    name: "Pro",
    price: "$29/mo",
    credits_per_period: 300,
  },
  studio: {
    price_id: "price_1TEJN07pm1sWSXu2GWmTPF5r",
    product_id: "prod_UCio296kndLNzb",
    name: "Studio",
    price: "$79/mo",
    credits_per_period: 1500,
  },
} as const;

export const FESTIVAL_ENTRY = {
  price_id: "price_1THFux7pm1sWSXu2v9gtVmIH",
  product_id: "prod_UFlR9r5kPeww33",
  name: "Festival Entry",
  price: "$75",
} as const;

export type TierKey = keyof typeof TIERS | "free";

export function useSubscription() {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [tier, setTier] = useState<TierKey>("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscribed(false);
      setTier("free");
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscribed(data.subscribed);
      setSubscriptionEnd(data.subscription_end);

      if (data.subscribed) {
        const found = data.product_id
          ? Object.entries(TIERS).find(([, t]) => t.product_id === data.product_id)
          : undefined;
        if (found) {
          setTier(found[0] as TierKey);
        } else {
          // Subscribed but product_id doesn't match known tiers (e.g. price/product
          // was swapped in Stripe). Don't lock the user out — fall back to "pro".
          console.warn(
            "[useSubscription] Subscribed user with unknown product_id, defaulting to 'pro'.",
            { product_id: data.product_id }
          );
          setTier("pro");
        }
      } else {
        setTier("free");
      }
    } catch {
      // silent fail – treat as free
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startCheckout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
    });
    console.log("create-checkout response:", { data, error });
    if (error) throw error;
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (parsed?.error) throw new Error(parsed.error);
    if (parsed?.url) window.open(parsed.url, "_blank");
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  return { subscribed, tier, subscriptionEnd, loading, checkSubscription, startCheckout, openPortal };
}
