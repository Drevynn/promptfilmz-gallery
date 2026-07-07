import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FESTIVAL_ENTRY_PRICE_ID = "price_1THFux7pm1sWSXu2v9gtVmIH";

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-FESTIVAL-ENTRY] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");
    const user = userData.user;
    logStep("Authenticated", { userId: user.id });

    const { shotId, category } = await req.json();
    if (!shotId || !category) throw new Error("shotId and category are required");

    // Verify the shot belongs to the authenticated user (mirrors RLS that service role bypasses)
    const { data: shotRow, error: shotErr } = await supabaseAdmin
      .from("shots")
      .select("id, project_id, projects!inner(user_id)")
      .eq("id", shotId)
      .maybeSingle();

    if (shotErr || !shotRow || (shotRow as any).projects?.user_id !== user.id) {
      logStep("Shot ownership check failed", { shotId });
      return new Response(
        JSON.stringify({ error: "Shot not found or access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }



    // Check if user already used their free entry
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("free_fest_used")
      .eq("id", user.id)
      .single();

    const freeEntryAvailable = profile && !profile.free_fest_used;
    logStep("Free entry check", { freeEntryAvailable });

    if (freeEntryAvailable) {
      // FREE first entry — submit directly and mark as used
      const { error: entryError } = await supabaseAdmin
        .from("contest_entries")
        .insert({ shot_id: shotId, user_id: user.id, category });

      if (entryError) {
        if (entryError.code === "23505") {
          return new Response(JSON.stringify({ alreadySubmitted: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw entryError;
      }

      // Mark free entry as used
      await supabaseAdmin
        .from("profiles")
        .update({ free_fest_used: true })
        .eq("id", user.id);

      logStep("Free entry submitted successfully");
      return new Response(
        JSON.stringify({ success: true, free: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PAID entry — create Stripe checkout for $75
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({ email: user.email });
      customerId = newCustomer.id;
    }

    const origin = req.headers.get("origin") || "https://aifilmz.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: FESTIVAL_ENTRY_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/checkout-success?type=festival&shot=${shotId}&category=${category}`,
      cancel_url: `${origin}/festival?entry=canceled`,
      metadata: {
        user_id: user.id,
        shot_id: shotId,
        category,
        type: "festival_entry",
      },
    });

    logStep("Checkout session created", { sessionId: session.id });
    return new Response(
      JSON.stringify({ success: true, free: false, url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
