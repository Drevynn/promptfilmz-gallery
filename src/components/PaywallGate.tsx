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

const PaywallGate = ({ children, requiredTier = ["weekly", "pro", "studio"] }: PaywallGateProps) => {
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
        className="neo-card rounded-xl p-8 max-w-lg text-center space-y-6"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Upgrade to Unlock</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This feature requires a paid subscription or weekly pass. Choose a plan below.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-left">
          {/* Weekly Pass */}
          <div className="p-3.5 rounded-lg border border-primary/40 bg-primary/5 flex flex-col justify-between relative overflow-hidden">
            <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl">
              Flexible
            </span>
            <div>
              <h3 className="font-bold text-sm text-foreground">Weekly Pass</h3>
              <p className="text-lg font-extrabold text-primary my-1">{TIERS.weekly.price}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                7 days full studio access. 100 credits/wk.
              </p>
            </div>
            <Button
              onClick={() => handleUpgrade(TIERS.weekly.price_id)}
              disabled={checkoutLoading}
              size="sm"
              className="w-full mt-3 bg-primary hover:bg-primary/90 text-xs font-semibold"
            >
              {checkoutLoading ? "..." : "Get Weekly"}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="p-3.5 rounded-lg border border-border bg-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground">Pro</h3>
              <p className="text-lg font-extrabold text-foreground my-1">{TIERS.pro.price}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Monthly access. 300 credits/mo & scene gen.
              </p>
            </div>
            <Button
              onClick={() => handleUpgrade(TIERS.pro.price_id)}
              disabled={checkoutLoading}
              variant="outline"
              size="sm"
              className="w-full mt-3 border-border text-xs font-semibold"
            >
              {checkoutLoading ? "..." : "Go Pro"}
            </Button>
          </div>

          {/* Studio Plan */}
          <div className="p-3.5 rounded-lg border border-border bg-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground">Studio</h3>
              <p className="text-lg font-extrabold text-foreground my-1">{TIERS.studio.price}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                For filmmakers. 1500 credits & Director AI.
              </p>
            </div>
            <Button
              onClick={() => handleUpgrade(TIERS.studio.price_id)}
              disabled={checkoutLoading}
              variant="outline"
              size="sm"
              className="w-full mt-3 border-border text-xs font-semibold"
            >
              {checkoutLoading ? "..." : "Go Studio"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaywallGate;
