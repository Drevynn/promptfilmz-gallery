import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X, Settings2, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getStoredConsent, saveConsentPreferences, ConsentPreferences } from "@/lib/analytics";
import { AnalyticsConsentManager } from "./AnalyticsConsentManager";

export const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  useEffect(() => {
    const existing = getStoredConsent();
    if (!existing) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const prefs: ConsentPreferences = {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      functionality_storage: "granted",
      security_storage: "granted",
    };
    saveConsentPreferences(prefs);
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    const prefs: ConsentPreferences = {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
    };
    saveConsentPreferences(prefs);
    setIsVisible(false);
  };

  if (!isVisible && !showPreferencesModal) return null;

  return (
    <>
      {/* Sticky Bottom Floating Banner */}
      {isVisible && (
        <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="neo-card rounded-2xl p-5 border border-primary/30 bg-background/95 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-foreground font-display font-bold text-sm">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Cookie className="w-4 h-4" />
                </div>
                <span>Privacy & Google Analytics 4 Consent</span>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              We use cookies and Google Analytics 4 (GA4) in compliance with Consent Mode v2 to measure studio performance, optimize rendering speeds, and remember user preferences. You can customize your consent choices below or read our{" "}
              <Link to="/privacy" className="text-primary underline hover:text-primary/80">
                Privacy Policy
              </Link>.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2"
                onClick={() => setShowPreferencesModal(true)}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Customize Choices</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={handleRejectNonEssential}
                >
                  Essential Only
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs h-8 font-semibold bg-primary hover:bg-primary/90"
                  onClick={handleAcceptAll}
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal Dialog */}
      <Dialog open={showPreferencesModal} onOpenChange={setShowPreferencesModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-border bg-background">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Google Analytics 4 & Privacy Choice Preferences</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure your explicit consent choices under Google Consent Mode v2 and GDPR/CCPA framework.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-0">
            <AnalyticsConsentManager
              onSaved={() => {
                setShowPreferencesModal(false);
                setIsVisible(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
