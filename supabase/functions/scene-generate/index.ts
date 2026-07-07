import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 2;

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
    const userEmail = user.email;

    // Service role client for credit operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Credit check
    const { data: credits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    const balance = credits?.balance ?? 100;
    if (balance < CREDIT_COST) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. Image generation costs ${CREDIT_COST} credits.` }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const { prompt, style, aspectRatio } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build cinematic prompt
    const cinematicPrompt = `Generate a stunning cinematic scene image. Style: ${style || "Cinematic"}. Aspect ratio feel: ${aspectRatio || "16:9"} widescreen.

Scene description: ${prompt.trim()}

Make it look like a professional film still or concept art frame with dramatic lighting, cinematic color grading, and strong composition. High detail, photorealistic quality.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: cinematicPrompt }],
          modalities: ["image", "text"],
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
        JSON.stringify({ error: "AI image generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "No image was generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data and upload to storage
    const base64String = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = decode(base64String);

    const fileName = `${userId}/scene-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("storyboard-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image");
    }

    // Generate a signed URL (valid for 24 hours)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from("storyboard-images")
      .createSignedUrl(fileName, 86400);

    if (signedError || !signedUrlData?.signedUrl) {
      throw new Error("Failed to generate signed URL");
    }

    // Deduct credits
    await supabase
      .from("user_credits")
      .update({ balance: balance - CREDIT_COST })
      .eq("user_id", userId);

    // Log transaction
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: -CREDIT_COST,
      action_type: "image_generation",
    });

    return new Response(
      JSON.stringify({
        imageUrl: signedUrlData.signedUrl,
        description: data.choices?.[0]?.message?.content || "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scene-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
