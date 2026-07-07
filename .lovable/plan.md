

# Add Dedicated Checkout Success Page with Conversion Tracking

## What We're Building
A cinematic `/checkout-success` thank-you page that users land on after completing a Stripe payment (subscription or festival entry). This page fires Google Ads conversion tracking pixels and provides a clear next-step CTA.

## Changes

### 1. New Page: `src/pages/CheckoutSuccess.tsx`
- Reads query params to determine purchase type: `?type=subscription` or `?type=festival&shot=X&category=Y`
- Fires GTM `dataLayer.push` conversion event on mount with purchase details (`purchase`, `conversion_value`, `transaction_type`)
- Includes a Google Ads `gtag('event', 'conversion', {...})` snippet (configurable AW-ID placeholder for the user to fill in)
- Golden Hour branded design: gold checkmark animation (Framer Motion), confetti/sparkle effect, purchase summary card
- CTA buttons: "Go to Dashboard" (subscription) or "View Festival Gallery" (festival entry)
- Auto-redirect after ~10 seconds with a visible countdown

### 2. Update Edge Functions — Redirect URLs
- **`supabase/functions/create-checkout/index.ts`**: Change `success_url` to `${origin}/checkout-success?type=subscription`
- **`supabase/functions/create-festival-entry/index.ts`**: Change `success_url` to `${origin}/checkout-success?type=festival&shot=${shotId}&category=${category}`

### 3. Update Router — `src/App.tsx`
- Add `/checkout-success` as a **protected route** rendering the new `CheckoutSuccess` page (lazy-loaded)

### 4. Analytics — `src/lib/analytics.ts`
- Add a `trackConversion` helper that pushes both a GTM event and calls `gtag('event', 'conversion')` if the global `gtag` function exists

## Google Ads Setup Note
The page will include a placeholder `AW-XXXXXXXXX/CONVERSION_LABEL` that the user replaces with their actual Google Ads conversion ID. The GTM container can also pick up the `purchase` dataLayer event for server-side tagging.

## Technical Details
- 5 files touched: 1 new page, 2 edge functions, App.tsx router, analytics.ts
- Edge functions redeployed after URL changes
- No DB changes needed

