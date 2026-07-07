import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";

// Mock the Supabase client BEFORE importing the hook
const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

// Mock auth so the hook believes there is a logged-in user
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u_test", email: "test@example.com" } }),
}));

import { useSubscription, TIERS } from "./useSubscription";

describe("useSubscription tier resolution", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("maps a known product_id to its tier", async () => {
    invokeMock.mockResolvedValue({
      data: {
        subscribed: true,
        product_id: TIERS.studio.product_id,
        subscription_end: "2099-01-01T00:00:00Z",
      },
      error: null,
    });

    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subscribed).toBe(true);
    expect(result.current.tier).toBe("studio");
  });

  it("falls back to 'pro' (NOT 'free') when subscribed but product_id is unknown", async () => {
    invokeMock.mockResolvedValue({
      data: {
        subscribed: true,
        product_id: "prod_unknown_swapped_in_stripe",
        subscription_end: "2099-01-01T00:00:00Z",
      },
      error: null,
    });

    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subscribed).toBe(true);
    expect(result.current.tier).toBe("pro");
    expect(result.current.tier).not.toBe("free");
  });

  it("falls back to 'pro' when subscribed but product_id is missing", async () => {
    invokeMock.mockResolvedValue({
      data: { subscribed: true, product_id: null, subscription_end: null },
      error: null,
    });

    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subscribed).toBe(true);
    expect(result.current.tier).toBe("pro");
  });

  it("treats unsubscribed responses as free", async () => {
    invokeMock.mockResolvedValue({
      data: { subscribed: false },
      error: null,
    });

    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subscribed).toBe(false);
    expect(result.current.tier).toBe("free");
  });
});

describe("PaywallGate-style access check", () => {
  // Mirror the exact gate condition used in src/components/PaywallGate.tsx:
  //   subscribed && requiredTier.includes(tier)
  const allows = (
    subscribed: boolean,
    tier: "free" | "pro" | "studio",
    required: Array<"pro" | "studio"> = ["pro", "studio"],
  ) => subscribed && (required as string[]).includes(tier);

  it("denies access when tier is 'free' even if subscribed flag is true", () => {
    expect(allows(true, "free")).toBe(false);
  });

  it("grants access for unknown-product subscriber resolved as 'pro'", () => {
    expect(allows(true, "pro")).toBe(true);
  });

  it("grants studio-only routes to studio tier", () => {
    expect(allows(true, "studio", ["studio"])).toBe(true);
    expect(allows(true, "pro", ["studio"])).toBe(false);
  });
});
