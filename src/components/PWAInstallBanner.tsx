import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoImg from "@/assets/logo-circle.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-banner-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DURATION) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // On Android/desktop Chrome, capture the beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // On iOS, show after a short delay (no native prompt available)
    if (ios) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => { clearTimeout(timer); window.removeEventListener("beforeinstallprompt", handler); };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) {
      navigate("/install");
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, isIOS, navigate]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setShowIOSGuide(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  // Only show on smaller screens (mobile-ish)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
        >
          <div className="relative mx-auto max-w-md rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-[0_-8px_40px_-10px_hsl(var(--primary)/0.25)] overflow-hidden">
            {/* Glow accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

            <button
              onClick={dismiss}
              className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            {!showIOSGuide ? (
              <div className="flex items-center gap-4 p-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <img src={logoImg} alt="That's A Wrap" className="w-8 h-8 rounded-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">That's A Wrap</p>
                  <p className="text-xs text-muted-foreground">Install for the best experience</p>
                </div>
                <button
                  onClick={handleInstall}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform shadow-lg shadow-primary/20"
                >
                  <Download className="w-4 h-4" />
                  Install
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Install on iOS</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Share className="w-3 h-3 text-primary" />
                    </div>
                    <span>Tap the <strong className="text-foreground">Share</strong> button in Safari</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Smartphone className="w-3 h-3 text-primary" />
                    </div>
                    <span>Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong></span>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="w-full py-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
