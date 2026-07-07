import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional screenwriting assistant for That's A Wrap, an AI filmmaking studio. You help filmmakers write, refine, and improve their scripts.

Your capabilities:
- Generate new scenes, dialogue, and action lines in proper screenplay format
- Continue or extend existing scripts naturally
- Rewrite/polish dialogue for better flow, subtext, or emotion
- Suggest scene transitions, pacing improvements, and structural changes
- Create character backstories and motivations
- Generate shot descriptions and visual cues
- Convert prose or ideas into proper screenplay format

Formatting rules:
- Use standard screenplay format (INT./EXT., character names in CAPS, parentheticals, etc.)
- When generating script content, output it in a markdown code block with "screenplay" as the language
- Keep dialogue natural and character-appropriate
- Include action lines that paint vivid, cinematic visuals

When the user shares their current script, analyze it and provide contextual suggestions. Be concise in your explanations but detailed in your script output.`;

const CREDIT_COST = 1;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // JWT Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;
    const userEmail = user.email as string;

    // Service-role client for credit operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Server-side subscription check
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey && userEmail) {
      const { default: Stripe } = await import("https://esm.sh/stripe@18.5.0");
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length === 0) {
        return new Response(JSON.stringify({ error: "Subscription required. Please upgrade to Pro or Studio." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
      if (subs.data.length === 0) {
        return new Response(JSON.stringify({ error: "Subscription required. Please upgrade to Pro or Studio." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Atomic credit deduction (starter pool first, then subscription pool).
    // For streamed responses we deduct up-front; the AI gateway request is short-lived.
    const { data: consumed, error: consumeErr } = await supabaseAdmin.rpc("consume_credits", {
      _user_id: userId,
      _amount: CREDIT_COST,
      _action_type: "script_assist",
    });
    if (consumeErr) console.error("consume_credits failed", consumeErr);
    if (consumed === false) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. Script generation costs ${CREDIT_COST} credit.`, out_of_credits: true }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, currentScript } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Prepend the current script as context if provided
    const contextMessages = currentScript
      ? [
          {
            role: "system" as const,
            content: `${SYSTEM_PROMPT}\n\nThe user's current script:\n\`\`\`screenplay\n${currentScript}\n\`\`\``,
          },
          ...messages,
        ]
      : [{ role: "system" as const, content: SYSTEM_PROMPT }, ...messages];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: contextMessages,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("script-assist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
