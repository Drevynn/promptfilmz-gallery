declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, params?: Record<string, unknown>) {
  window.dataLayer?.push({ event, ...params });
}

export function trackConversion(value: number, currency = "USD", label = "AW-XXXXXXXXX/CONVERSION_LABEL") {
  trackEvent("purchase", { conversion_value: value, currency });
  window.gtag?.("event", "conversion", { send_to: label, value, currency });
}
