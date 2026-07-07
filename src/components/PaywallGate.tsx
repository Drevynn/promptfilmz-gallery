import { useSubscription, TIERS, TierKey } from "@/hooks/useSubscription";
import { useFestivalEntry } from "@/hooks/useFestivalEntry";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";

interface PaywallGateProps {
  children: React.ReactNode;
  requiredTier?: TierKey[];
}

const PaywallGate = ({ children, requiredTier = ["pro", "studio"] }: PaywallGateProps) => {
  const { subscribed, tier, loading, startCheckout } = useSubscription();
  const { isInTrial, loading: trialLoading } = useFestivalEntry();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (loading || trialLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Free trial — all tools unlocked for 30 days
  if (isInTrial) {
    return <>{children}</>;
  }

  if (subscribed && requiredTier.includes(tier)) {
    return <>{children}</>;
  }

  const handleUpgrade = async (priceId: string) => {
    setCheckoutLoading(true);
    try {
      await startCheckout(priceId);
    } catch {
      toast.error("Could not start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="neo-card rounded-xl p-8 max-w-md text-center space-y-6"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Upgrade to Unlock</h2>
        <p className="text-muted-foreground">
          This feature requires a paid subscription. Choose a plan to get started.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => handleUpgrade(TIERS.pro.price_id)}
            disabled={checkoutLoading}
            className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_var(--neon-pink-30)]"
          >
            {checkoutLoading ? "Redirecting…" : `Go Pro — ${TIERS.pro.price}`}
          </Button>
          <Button
            onClick={() => handleUpgrade(TIERS.studio.price_id)}
            disabled={checkoutLoading}
            variant="outline"
          >
            {checkoutLoading ? "Redirecting…" : `Go Studio — ${TIERS.studio.price}`}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaywallGate;
