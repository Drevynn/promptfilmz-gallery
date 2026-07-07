import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const CheckoutSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  const type = params.get("type") || "subscription";
  const isFestival = type === "festival";
  const shot = params.get("shot");
  const category = params.get("category");

  useEffect(() => {
    // GTM dataLayer
    trackEvent("purchase", {
      transaction_type: type,
      conversion_value: isFestival ? 75 : 29,
      currency: "USD",
      ...(isFestival && { shot_id: shot, category }),
    });

    // Google Ads gtag conversion (replace AW-XXXXXXXXX/LABEL)
    window.gtag?.("event", "conversion", {
      send_to: "AW-XXXXXXXXX/CONVERSION_LABEL",
      value: isFestival ? 75.0 : 29.0,
      currency: "USD",
      transaction_id: `${type}_${Date.now()}`,
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (countdown <= 0) navigate(isFestival ? "/festival" : "/dashboard");
  }, [countdown]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating sparkles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/30"
          initial={{ opacity: 0, y: 40, x: Math.random() * 300 - 150 }}
          animate={{ opacity: [0, 1, 0], y: -200 }}
          transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
          style={{ left: `${10 + i * 10}%`, top: `${60 + Math.random() * 20}%` }}
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel-strong rounded-2xl p-8 md:p-12 max-w-lg w-full text-center space-y-6 relative z-10"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
        >
          <motion.div
            animate={{ boxShadow: ["0 0 0px hsl(var(--primary))", "0 0 30px hsl(var(--primary))", "0 0 0px hsl(var(--primary))"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-primary" />
          </motion.div>
        </motion.div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground font-cinzel">
          {isFestival ? "Entry Submitted!" : "Welcome Aboard!"}
        </h1>

        <p className="text-muted-foreground">
          {isFestival
            ? "Your film has been entered into the Golden Hour Film Festival. Good luck!"
            : "Your subscription is active. All premium features are now unlocked."}
        </p>

        {/* Purchase summary */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Type</span>
            <span className="text-foreground font-medium">
              {isFestival ? "Festival Entry" : "Subscription"}
            </span>
          </div>
          {isFestival && category && (
            <div className="flex justify-between text-muted-foreground">
              <span>Category</span>
              <span className="text-foreground font-medium capitalize">
                {category.replace(/_/g, " ")}
              </span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Amount</span>
            <span className="text-primary font-bold">${isFestival ? "75" : "29"}/mo</span>
          </div>
          {isFestival && (
            <div className="flex items-center gap-1.5 justify-center pt-2 text-primary">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-medium">Grand Prize: 10,000 Tokens</span>
            </div>
          )}
        </div>

        <Button
          onClick={() => navigate(isFestival ? "/festival" : "/dashboard")}
          className="w-full gap-2"
        >
          {isFestival ? "View Festival Gallery" : "Go to Dashboard"}
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="text-xs text-muted-foreground">
          Redirecting in {Math.max(countdown, 0)}s…
        </p>
      </motion.div>
    </div>
  );
};

export default CheckoutSuccess;
