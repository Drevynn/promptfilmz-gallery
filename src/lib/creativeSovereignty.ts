/**
 * Creative Sovereignty Shared Library
 * Constants, types, and helpers for the Creative Sovereignty LLC ecosystem.
 */

export const CREATIVE_SOVEREIGNTY_BRAND = {
  name: "Creative Sovereignty LLC",
  primaryColor: "#E0C097", // Consistent soft gold
  secondaryColor: "#1A1A1A", // Dark Slate/Void
  fontHeading: "Cinzel, serif",
  fontBody: "Inter, sans-serif",
};

export const COMMON_UI_STYLES = {
  card: "neo-card neo-card-interactive",
  button: "neo-btn neo-btn-glass",
};

// API Stubs for Sovranly IP Integration
export const SOVRANLY_IP_API = {
  BASE_URL: 'https://sovranly-ip-425151855682.us-west1.run.app',
  endpoints: {
    register: '/api/register-ip',
    verify: '/api/verify-ip',
  },
};

// Shared Error Handler
export interface AppError {
  message: string;
  code: string;
  timestamp: number;
}

export function handleAppError(error: unknown) {
  const appError: AppError = {
    message: error instanceof Error ? error.message : "An unknown error occurred.",
    code: "GENERAL_ERROR",
    timestamp: Date.now(),
  };
  
  console.error(`[${CREATIVE_SOVEREIGNTY_BRAND.name}] Error:`, appError);
  return appError;
}

export function logSystemEvent(msg: string) {
  console.log(`[${CREATIVE_SOVEREIGNTY_BRAND.name}] ${msg}`);
}
