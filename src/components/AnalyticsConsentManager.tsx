import { useState, useEffect } from "react";
import {
  ShieldCheck, Check, Cookie, BarChart3, Target, UserCheck, Settings2,
  RefreshCw, Info, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  ConsentPreferences,
  getStoredConsent,
  saveConsentPreferences,
  DEFAULT_CONSENT
} from "@/lib/analytics";

interface AnalyticsConsentManagerProps {
  onSaved?: () => void;
  compact?: boolean;
}

export const AnalyticsConsentManager = ({ onSaved, compact = false }: AnalyticsConsentManagerProps) => {
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState(true);
  const [adStorage, setAdStorage] = useState(false);
  const [adUserData, setAdUserData] = useState(false);
  const [adPersonalization, setAdPersonalization] = useState(false);
  const [functionality, setFunctionality] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const current = getStoredConsent();
    if (current) {
      setAnalytics(current.analytics_storage === "granted");
      setAdStorage(current.ad_storage === "granted");
      setAdUserData(current.ad_user_data === "granted");
      setAdPersonalization(current.ad_personalization === "granted");
      setFunctionality(current.functionality_storage === "granted");
      setLastUpdated(current.updatedAt || null);
    } else {
      // Set defaults
      setAnalytics(DEFAULT_CONSENT.analytics_storage === "granted");
      setAdStorage(DEFAULT_CONSENT.ad_storage === "granted");
      setAdUserData(DEFAULT_CONSENT.ad_user_data === "granted");
      setAdPersonalization(DEFAULT_CONSENT.ad_personalization === "granted");
      setFunctionality(DEFAULT_CONSENT.functionality_storage === "granted");
    }
  }, []);

  const handleSaveCustom = () => {
    const prefs: ConsentPreferences = {
      analytics_storage: analytics ? "granted" : "denied",
      ad_storage: adStorage ? "granted" : "denied",
      ad_user_data: adUserData ? "granted" : "denied",
      ad_personalization: adPersonalization ? "granted" : "denied",
      functionality_storage: functionality ? "granted" : "denied",
      security_storage: "granted",
    };

    const saved = saveConsentPreferences(prefs);
    setLastUpdated(saved.updatedAt || new Date().toISOString());

    toast({
      title: "Privacy Choices Updated",
      description: "Your Google Analytics 4 & Cookie consent preferences have been saved.",
    });

    if (onSaved) onSaved();
  };

  const handleAcceptAll = () => {
    const prefs: ConsentPreferences = {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      functionality_storage: "granted",
      security_storage: "granted",
    };

    setAnalytics(true);
    setAdStorage(true);
    setAdUserData(true);
    setAdPersonalization(true);
    setFunctionality(true);

    const saved = saveConsentPreferences(prefs);
    setLastUpdated(saved.updatedAt || new Date().toISOString());

    toast({
      title: "All Consent Granted",
      description: "Thank you! All analytics and functional cookies are now enabled.",
    });

    if (onSaved) onSaved();
  };

  const handleRejectAllNonEssential = () => {
    const prefs: ConsentPreferences = {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
    };

    setAnalytics(false);
    setAdStorage(false);
    setAdUserData(false);
    setAdPersonalization(false);
    setFunctionality(true);

    const saved = saveConsentPreferences(prefs);
    setLastUpdated(saved.updatedAt || new Date().toISOString());

    toast({
      title: "Non-Essential Cookies Declined",
      description: "Only essential security and operational storage remain active.",
    });

    if (onSaved) onSaved();
  };

  return (
    <div className={`neo-card rounded-2xl p-5 sm:p-7 space-y-6 border border-primary/20 bg-card/95 shadow-md ${compact ? "p-4 space-y-4 text-xs" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Cookie className="w-3.5 h-3.5" />
            <span>Google Analytics 4 & Consent Mode v2 Compliance</span>
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <span>Privacy & Cookie Preferences</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Manage how That's A Wrap uses Google Analytics 4 (GA4) and client storage to process metrics and platform performance.
          </p>
        </div>

        {lastUpdated && (
          <div className="text-[11px] text-muted-foreground font-mono shrink-0 bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
            Last choice: {new Date(lastUpdated).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Choice Form Toggles */}
      <div className="space-y-4">
        {/* 1. Essential & Security (Always Active) */}
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1. Essential Security & Authentication Storage</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Always Required
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Required for user sign-in sessions, credit balance calculations, security tokens, and core system functionality. Cannot be turned off.
            </p>
          </div>
          <Switch checked={true} disabled className="opacity-70" />
        </div>

        {/* 2. Google Analytics 4 Storage */}
        <div className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-foreground">
              <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>2. Google Analytics 4 (GA4) Performance Metrics</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enables <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">analytics_storage</code>. Helps us measure page load speed, render error rates, and feature popularity to improve filmmaking tools without profiling individual users.
            </p>
          </div>
          <Switch checked={analytics} onCheckedChange={setAnalytics} />
        </div>

        {/* 3. Functionality & Local Storage */}
        <div className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-foreground">
              <Settings2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>3. Functional Preferences & Local Storage</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enables <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">functionality_storage</code>. Saves user interface choices like dark mode themes, sidebar collapse states, and draft timeline parameters.
            </p>
          </div>
          <Switch checked={functionality} onCheckedChange={setFunctionality} />
        </div>

        {/* 4. Advertising Storage */}
        <div className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-foreground">
              <Target className="w-4 h-4 text-pink-400 shrink-0" />
              <span>4. Advertising & Remarketing Storage</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enables <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">ad_storage</code>. Controls whether advertising tags and measurement identifiers can store cookies on your device.
            </p>
          </div>
          <Switch checked={adStorage} onCheckedChange={setAdStorage} />
        </div>

        {/* 5. Ad User Data & Personalization */}
        <div className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-foreground">
              <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>5. Google Ad User Data & Personalization Consent</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enables <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">ad_user_data</code> and <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">ad_personalization</code>. Controls consent for sending user data to Google for conversion tracking and personalized advertising.
            </p>
          </div>
          <Switch
            checked={adUserData && adPersonalization}
            onCheckedChange={(val) => {
              setAdUserData(val);
              setAdPersonalization(val);
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRejectAllNonEssential}
          className="w-full sm:w-auto text-xs"
        >
          Reject Non-Essential
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveCustom}
            className="w-full sm:w-auto text-xs font-semibold gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save Preferences</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleAcceptAll}
            className="w-full sm:w-auto text-xs font-semibold bg-primary hover:bg-primary/90"
          >
            Accept All
          </Button>
        </div>
      </div>

      {/* Legal Footer Note */}
      <div className="text-[11px] text-muted-foreground flex items-center gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/50">
        <Info className="w-4 h-4 text-primary shrink-0" />
        <span>
          You can return to this form at any time on our <strong className="text-foreground">Privacy Policy</strong> page to revise your consent choices.
        </span>
      </div>
    </div>
  );
};
