import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAQ_KNOWLEDGE = `
That's A Wrap FAQ:
- That's A Wrap is an AI-powered filmmaking studio that helps you create stunning short films from script to screen — including scriptwriting, storyboarding, shot planning, AI video generation via Luma Dream Machine, a multi-track video editor, and AI music generation.
- No filmmaking experience needed. The AI assists with each step — from Director AI shot breakdowns to AI-generated video clips.
- Features: AI Script Editor, Storyboard Studio, Shot List Tracker, AI Video via Luma Dream Machine, multi-track Timeline Editor (Video V1, B-Roll V2, Dialog, Score, Sound Design tracks), AI Music Studio, Director AI, and full MP4 export with audio mixing.
- The AI Studio (/ai-studio) is the central hub for all AI generation — storyboard images, AI video clips via Luma Dream Machine, and AI music. Each tab shows your credit balance and generation controls.
- AI Video generation uses Luma Dream Machine. Enter a cinematic prompt, adjust camera and motion settings, then click Generate. You'll see real-time progress states: queued → dreaming → completed.
- Credit costs: storyboard images cost 2 credits, AI music costs 3 credits, AI video generation costs 10 credits. Your remaining balance is displayed on the AI Studio page and in the top bar.
- All content is private. Every project is tied to your account and protected by row-level security.
- That's A Wrap is a Progressive Web App (PWA). Install it on mobile via your browser's "Add to Home Screen" option for a native app-like experience.
- Uses state-of-the-art AI models for text generation, image synthesis (storyboards), video generation (Luma Dream Machine), and music composition — all accessible without needing your own API keys.
- Free credits are provided to get started. Paid plans (Pro and Studio) unlock higher usage limits and premium features.
- The multi-track timeline features separate tracks for Video (V1), B-Roll (V2), Dialog, Score, and Sound Design. Select a project to auto-load your generated shots. Drag clip edges to trim in/out points non-destructively. Select a clip and use the toolbar to split at the playhead, duplicate, or delete. A preview monitor shows the active clip in real time.
- MP4 Export: Click the Export button in the Video Editor transport bar. The export runs entirely in your browser using ffmpeg.wasm — no server upload needed. It supports both video and audio tracks. The pipeline: 1) Loading Encoder (downloads ~30MB FFmpeg WASM core, cached after first use), 2) Downloading Clips (fetches each video and audio source), 3) Encoding (concatenates video with libx264, mixes audio tracks with amix into AAC at 192kbps), 4) Complete — click Download MP4 to save your finished film. A progress modal tracks each stage with a percentage indicator.
- Audio in exports: AI-generated music and sound effects from the AI Music page can be placed on Dialog, Score, or Sound Design tracks. When exporting, all audio clips with sources are mixed together and merged with the concatenated video into the final MP4.
- For support issues, you can create a ticket and the team will follow up.
`;

const SYSTEM_PROMPT = `You are the That's A Wrap support assistant. You help users with questions about the That's A Wrap filmmaking platform.

${FAQ_KNOWLEDGE}

Guidelines:
- Be friendly, helpful, and concise.
- Answer questions using the FAQ knowledge above.
- If a user describes a bug or issue you cannot resolve, offer to create a support ticket.
- When creating a ticket, confirm the details with the user and use the create_ticket tool.
- Format responses with markdown when helpful.
- Stay on topic - you only help with That's A Wrap related questions.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, createTicket } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Try to get user from auth header
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (user) {
          userId = user.id;
          userEmail = user.email || null;
        }
      } catch { /* anonymous access ok for helpdesk */ }
    }

    // Handle ticket creation
    if (createTicket) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase.from("support_tickets").insert({
        subject: createTicket.subject,
        description: createTicket.description,
        email: createTicket.email || userEmail || null,
        user_id: userId,
        status: "open",
      });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Ticket created successfully!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream AI response
    const tools = [
      {
        type: "function",
        function: {
          name: "create_ticket",
          description: "Create a support ticket when the user has an issue that needs human follow-up",
          parameters: {
            type: "object",
            properties: {
              subject: { type: "string", description: "Brief summary of the issue" },
              description: { type: "string", description: "Detailed description of the problem" },
              email: { type: "string", description: "User's email for follow-up (if provided)" },
            },
            required: ["subject", "description"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("helpdesk error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
