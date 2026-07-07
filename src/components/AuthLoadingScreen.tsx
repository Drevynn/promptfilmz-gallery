import { motion } from "framer-motion";
import logoImg from "@/assets/logo-circle.png";

interface AuthLoadingScreenProps {
  message?: string;
}

/**
 * Full-screen branded splash shown while Supabase restores the persisted
 * session. Prevents iOS / PWA users from briefly seeing a "logged out" UI
 * during cold boot.
 */
const AuthLoadingScreen = ({ message = "Restoring your session…" }: AuthLoadingScreenProps) => (
  <div
    className="min-h-screen w-full flex items-center justify-center bg-background"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="flex flex-col items-center gap-6 px-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-[0_0_40px_hsl(var(--primary)/0.35)]"
      >
        <img src={logoImg} alt="" className="w-full h-full object-cover" />
        <motion.div
          className="absolute inset-0 rounded-2xl ring-2 ring-primary/40"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground font-medium">{message}</span>
      </div>

      <span className="sr-only">Loading authentication status</span>
    </div>
  </div>
);

export default AuthLoadingScreen;
