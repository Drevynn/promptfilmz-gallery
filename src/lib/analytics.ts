declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export interface ConsentPreferences {
  analytics_storage: "granted" | "denied";
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  functionality_storage: "granted" | "denied";
  security_storage: "granted";
  updatedAt?: string;
}

export const STORAGE_KEY_CONSENT = "aifilmz_ga4_consent_v2";

export const DEFAULT_CONSENT: ConsentPreferences = {
  analytics_storage: "granted",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "granted",
  security_storage: "granted",
};

/**
 * Retrieves saved consent preferences or returns null if not yet chosen.
 */
export function getStoredConsent(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONSENT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Applies consent status to window.gtag and updates dataLayer for Google Analytics 4 Consent Mode v2.
 */
export function applyConsentToGtag(prefs: ConsentPreferences) {
  if (typeof window !== "undefined") {
    window.gtag?.("consent", "update", {
      analytics_storage: prefs.analytics_storage,
      ad_storage: prefs.ad_storage,
      ad_user_data: prefs.ad_user_data,
      ad_personalization: prefs.ad_personalization,
      functionality_storage: prefs.functionality_storage,
      security_storage: "granted",
    });

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "consent_update",
      consent_status: prefs,
    });
  }
}

/**
 * Saves consent choice to localStorage and applies to GA4 gtag.
 */
export function saveConsentPreferences(prefs: ConsentPreferences): ConsentPreferences {
  const updated = {
    ...prefs,
    security_storage: "granted" as const,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY_CONSENT, JSON.stringify(updated));
  } catch (e) {
    console.warn("Unable to save consent preferences to localStorage", e);
  }

  applyConsentToGtag(updated);
  return updated;
}

/**
 * Initialize default consent mode on application load.
 */
export function initConsentMode() {
  const existing = getStoredConsent();
  if (existing) {
    applyConsentToGtag(existing);
  } else {
    // Set default consent mode v2 as denied/granted based on defaults
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        functionality_storage: "granted",
        security_storage: "granted",
        wait_for_update: 500,
      });
    }
  }
}

export function trackEvent(event: string, params?: Record<string, unknown>) {
  const consent = getStoredConsent();
  // Always push to dataLayer for internal event tracking, GA respects consent_storage settings
  window.dataLayer?.push({
    event,
    consent_given: consent?.analytics_storage === "granted",
    ...params,
  });
}

export function trackConversion(value: number, currency = "USD", label = "AW-XXXXXXXXX/CONVERSION_LABEL") {
  trackEvent("purchase", { conversion_value: value, currency });
  const consent = getStoredConsent();
  if (consent?.ad_storage === "granted") {
    window.gtag?.("event", "conversion", { send_to: label, value, currency });
  }
}
