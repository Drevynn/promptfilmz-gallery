import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Service role client for credit operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Credit pre-check (atomic deduction happens AFTER successful generation)
    const { data: credits } = await supabase
      .from("user_credits")
      .select("balance, subscription_balance")
      .eq("user_id", userId)
      .maybeSingle();

    const totalBalance = (credits?.balance ?? 0) + (credits?.subscription_balance ?? 0);
    if (totalBalance < CREDIT_COST) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. Music generation costs ${CREDIT_COST} credits.`, out_of_credits: true }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const { prompt, duration, type } = await req.json();

    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt is required");
    }

    // Support both music and sound effects
    const isMusic = type !== "sfx";
    const url = isMusic
      ? "https://api.elevenlabs.io/v1/music"
      : "https://api.elevenlabs.io/v1/sound-generation";

    const body = isMusic
      ? { prompt, duration_seconds: duration || 30 }
      : { text: prompt, duration_seconds: duration || 5, prompt_influence: 0.3 };

    console.log(`Generating ${isMusic ? "music" : "SFX"}: "${prompt.substring(0, 60)}..." (${duration || (isMusic ? 30 : 5)}s)`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status}`, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();

    // Atomic deduction (starter pool first, then subscription pool) after success.
    const { data: consumed, error: consumeErr } = await supabase.rpc("consume_credits", {
      _user_id: userId,
      _amount: CREDIT_COST,
      _action_type: isMusic ? "music_generation" : "sfx_generation",
    });
    if (consumeErr) console.error("consume_credits failed", consumeErr);
    if (consumed === false) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits.", out_of_credits: true }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
