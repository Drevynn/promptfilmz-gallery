import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Pre-flight credit check (atomic deduction after successful image upload)
    const CREDIT_COST = 2;
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: credits } = await supabaseAdmin
      .from("user_credits")
      .select("balance, subscription_balance")
      .eq("user_id", userId)
      .maybeSingle();
    const totalBalance = (credits?.balance ?? 0) + (credits?.subscription_balance ?? 0);
    if (totalBalance < CREDIT_COST) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. Storyboard images cost ${CREDIT_COST} credits.`, out_of_credits: true }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { scene, description, notes, frameId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Generate a cinematic storyboard frame illustration for a film scene. Style: moody, cinematic, concept art, widescreen 16:9 aspect ratio.

Scene: ${scene}
Shot: ${description}
Mood/Notes: ${notes}

Make it look like a professional storyboard panel with dramatic lighting and composition.`;

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
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits." }),
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

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64String = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = decode(base64String);

    // Upload to storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `${userId}/frame-${frameId || Date.now()}-${Date.now()}.png`;
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

    // Generate a signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from("storyboard-images")
      .createSignedUrl(fileName, 3600);

    if (signedError || !signedUrlData?.signedUrl) {
      throw new Error("Failed to generate signed URL");
    }

    // Atomic credit deduction after successful image generation + upload
    const { error: consumeErr } = await supabaseAdmin.rpc("consume_credits", {
      _user_id: userId,
      _amount: CREDIT_COST,
      _action_type: "storyboard_image",
    });
    if (consumeErr) console.error("consume_credits failed", consumeErr);

    return new Response(
      JSON.stringify({ imageUrl: signedUrlData.signedUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("storyboard-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
