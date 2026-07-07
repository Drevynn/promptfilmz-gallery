import { motion } from "framer-motion";
import { Database, Zap, ArrowUpRight } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";

interface UsageTrackerProps {
  totalCredits?: number;
}

const UsageTracker = ({ totalCredits = 1000 }: UsageTrackerProps) => {
  const { data } = useCredits();
  const creditsRemaining = data?.balance ?? 100;
  const percentage = Math.min((creditsRemaining / totalCredits) * 100, 100);

  return (
    <div className="neo-card rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Database className="w-3 h-3" /> Compute Credits
        </span>
        <button className="text-[10px] text-primary font-bold flex items-center gap-1 hover:underline">
          TOP UP <ArrowUpRight className="w-2.5 h-2.5" />
        </button>
      </div>

      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-primary rounded-full shadow-[0_0_8px_var(--neon-pink-30)]"
        />
      </div>

      <div className="flex justify-between items-end">
        <div>
          <span className="text-xl font-black">{creditsRemaining}</span>
          <span className="text-xs text-muted-foreground ml-1">/ {totalCredits}</span>
        </div>
        <div className="text-[10px] text-[var(--neon-green-raw)] font-mono flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" fill="currentColor" /> ACTIVE SESSION
        </div>
      </div>
    </div>
  );
};

export default UsageTracker;
