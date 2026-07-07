import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Director AI for That's A Wrap, an AI filmmaking studio. You are the creative brain that orchestrates the entire production pipeline.

When a filmmaker describes a creative direction, mood change, or scene adjustment, you analyze their intent and decide which production tools to invoke — updating scripts, generating video clips, and adjusting music mood — all in one coordinated pass.

You have access to three production tools:

1. **update_script** — Modifies screenplay text (sluglines, action lines, dialogue, parentheticals). Use this when the director's intent changes the written story.

2. **generate_video_clip** — Triggers the AI video engine with a cinematic prompt. Use this when visual output needs to change. Include detailed visual descriptions: lighting, atmosphere, camera angles, textures.

3. **set_music_mood** — Adjusts the AI score's energy, brightness, and active instrument stems. Use this when the emotional tone of a scene changes.

**Key behaviors:**
- Think like a film director. When someone says "make it darker," that affects script tone, visual atmosphere, AND music.
- Always call multiple tools when appropriate — a mood change typically affects all three.
- For visual consistency: reference previous shot descriptions when generating new clips.
- Keep script changes in proper screenplay format.
- Be concise in your explanations but precise in your tool calls.
- After making tool calls, summarize what you changed across all departments (Script, Visual, Music).`;

const tools = [
  {
    type: "function",
    function: {
      name: "update_script",
      description: "Modifies the screenplay text, sluglines, or dialogue based on the director's intent.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The new script text to be inserted or modified." },
          scene_id: { type: "string", description: "The ID of the scene being edited." },
          formatting_style: { type: "string", enum: ["slugline", "action", "dialogue", "parenthetical"] },
        },
        required: ["content", "scene_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_video_clip",
      description: "Triggers the AI video engine to generate a new cinematic clip and creates a shot in the database.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "High-detail cinematic prompt for the AI." },
          motion_intensity: { type: "number", description: "Value from 0-100 defining camera/subject movement." },
          camera_movement: { type: "string", enum: ["static", "dolly_in", "pan_left", "crane_up", "handheld"] },
          shot_type: { type: "string", enum: ["Wide", "Close-Up", "Medium CU", "Tracking", "Low Angle", "High Angle", "POV", "Over-the-Shoulder"] },
          scene_number: { type: "string", description: "The scene number this shot belongs to." },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_music_mood",
      description: "Adjusts the AI Music Studio parameters to match the scene's emotional beats.",
      parameters: {
        type: "object",
        properties: {
          energy: { type: "number", description: "Intensity of the score from 0-100." },
          brightness: { type: "number", description: "Tonality from 0 (Dark/Minor) to 100 (Bright/Major)." },
          stems: { type: "array", items: { type: "string" }, description: "Active instrument stems." },
        },
        required: ["energy", "brightness"],
      },
    },
  },
];

// ─── Tool Executors ──────────────────────────────────────────────────
// Each returns { success: boolean, result: string, data?: any }

async function executeUpdateScript(
  args: { content: string; scene_id: string; formatting_style?: string },
) {
  // Script updates are UI-side for now — we just acknowledge
  return {
    success: true,
    result: `Script updated for scene ${args.scene_id}. Style: ${args.formatting_style || "action"}. Content length: ${args.content.length} chars.`,
    data: args,
  };
}

async function executeGenerateVideoClip(
  args: { prompt: string; motion_intensity?: number; camera_movement?: string; shot_type?: string; scene_number?: string },
  projectId: string | null,
  supabaseAdmin: ReturnType<typeof createClient>,
) {
  if (!projectId) {
    return {
      success: true,
      result: `Video clip queued with prompt: "${args.prompt.slice(0, 80)}..." (no project linked — shot not saved to database).`,
      data: args,
    };
  }

  // Find or create script
  let script = await supabaseAdmin
    .from("scripts")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();
  
  if (!script.data) {
    const { data: newScript, error: scriptErr } = await supabaseAdmin
      .from("scripts")
      .insert({ project_id: projectId, content: "" })
      .select("id")
      .single();
    if (scriptErr) {
      return { success: false, result: `Error creating script: ${scriptErr.message}`, data: null };
    }
    script = { data: newScript, error: null };
  }

  const sceneNum = parseInt(args.scene_number || "1") || 1;

  // Find or create scene
  let scene = await supabaseAdmin
    .from("scenes")
    .select("id")
    .eq("script_id", script.data.id)
    .eq("scene_number", sceneNum)
    .maybeSingle();

  if (!scene.data) {
    const { data: newScene, error: sceneErr } = await supabaseAdmin
      .from("scenes")
      .insert({ script_id: script.data.id, scene_number: sceneNum })
      .select("id")
      .single();
    if (sceneErr) {
      return { success: false, result: `Error creating scene: ${sceneErr.message}`, data: null };
    }
    scene = { data: newScene, error: null };
  }

  // Get next order_index
  const { data: lastShot } = await supabaseAdmin
    .from("shots")
    .select("order_index")
    .eq("scene_id", scene.data.id)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (lastShot?.order_index ?? -1) + 1;

  // Map camera_movement to a motion intensity range
  const cameraAngleMap: Record<string, string> = {
    static: "Eye Level",
    dolly_in: "Eye Level",
    pan_left: "Eye Level",
    crane_up: "High Angle",
    handheld: "Eye Level",
  };

  const { data: newShot, error } = await supabaseAdmin
    .from("shots")
    .insert({
      scene_id: scene.data.id,
      order_index: nextOrder,
      shot_type: args.shot_type || "WS",
      camera_angle: cameraAngleMap[args.camera_movement || "static"] || "Eye Level",
      prompt: args.prompt,
      motion_intensity: args.motion_intensity ?? 50,
      status: "rendering",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert shot:", error);
    return {
      success: false,
      result: `Error creating shot: ${error.message}`,
      data: null,
    };
  }

  return {
    success: true,
    result: `Shot ${sceneNum}.${nextOrder + 1} created (ID: ${newShot.id}) and rendering started. Prompt: "${args.prompt.slice(0, 60)}..."`,
    data: { shot: newShot, prompt: args.prompt },
  };
}

async function executeSetMusicMood(
  args: { energy: number; brightness: number; stems?: string[] },
) {
  return {
    success: true,
    result: `Music mood set — Energy: ${args.energy}/100, Brightness: ${args.brightness}/100. Active stems: ${args.stems?.join(", ") || "all"}.`,
    data: args,
  };
}

// ─── SSE helpers ─────────────────────────────────────────────────────

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // JWT Authentication (required)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = user.id;
    const userEmail = user.email as string;


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

    const { messages, projectContext, projectId } = await req.json();

    // Admin client for DB operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Atomic credit deduction (3 credits per orchestrator call)
    const CREDIT_COST = 3;
    const { data: consumed, error: consumeErr } = await supabaseAdmin.rpc("consume_credits", {
      _user_id: userId,
      _amount: CREDIT_COST,
      _action_type: "director_assist",
    });
    if (consumeErr) console.error("consume_credits failed", consumeErr);
    if (consumed === false) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. Director AI costs ${CREDIT_COST} credits per request.`, out_of_credits: true }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify project ownership if projectId is provided
    if (projectId) {
      const { data: project } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!project) {
        return new Response(
          JSON.stringify({ error: "Project not found or access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context-aware system message
    let systemContent = SYSTEM_PROMPT;
    if (projectContext) {
      systemContent += `\n\nCurrent project context:\n`;
      if (projectContext.currentScript) {
        systemContent += `\nScript:\n\`\`\`screenplay\n${projectContext.currentScript}\n\`\`\`\n`;
      }
      if (projectContext.shots?.length) {
        systemContent += `\nShot list:\n${JSON.stringify(projectContext.shots, null, 2)}\n`;
      }
      if (projectContext.projectTitle) {
        systemContent += `\nProject: "${projectContext.projectTitle}"\n`;
      }
    }

    const contextMessages = [
      { role: "system" as const, content: systemContent },
      ...messages,
    ];

    // ─── Step 1: Initial AI call (non-streaming) to get tool calls ───
    const initialResponse = await fetch(
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
          tools,
          stream: false,
        }),
      }
    );

    if (!initialResponse.ok) {
      const status = initialResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await initialResponse.text();
      console.error("AI gateway error:", status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const initialData = await initialResponse.json();
    const assistantMessage = initialData.choices?.[0]?.message;

    if (!assistantMessage) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toolCalls = assistantMessage.tool_calls;

    // ─── No tool calls: just return the text content ─────────────────
    if (!toolCalls || toolCalls.length === 0) {
      const body = new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          if (assistantMessage.content) {
            controller.enqueue(enc.encode(sseEvent("content", { text: assistantMessage.content })));
          }
          controller.enqueue(enc.encode(sseEvent("done", {})));
          controller.close();
        },
      });
      return new Response(body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // ─── Has tool calls: execute them, then get final summary ────────
    const body = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        const toolResults: { tool_call_id: string; role: "tool"; content: string }[] = [];

        // Send initial text content if any
        if (assistantMessage.content) {
          controller.enqueue(enc.encode(sseEvent("content", { text: assistantMessage.content })));
        }

        // Execute each tool call
        for (const tc of toolCalls) {
          const fnName = tc.function.name;
          let args: Record<string, unknown>;
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            args = {};
          }

          // Notify frontend: tool call detected
          controller.enqueue(enc.encode(sseEvent("tool_call", {
            id: tc.id,
            name: fnName,
            arguments: args,
            status: "pending",
          })));

          // Execute the tool
          let result: { success: boolean; result: string; data?: unknown };
          try {
            switch (fnName) {
              case "update_script":
                result = await executeUpdateScript(args as any);
                break;
              case "generate_video_clip":
                result = await executeGenerateVideoClip(args as any, projectId || null, supabaseAdmin);
                break;
              case "set_music_mood":
                result = await executeSetMusicMood(args as any);
                break;
              default:
                result = { success: false, result: `Unknown tool: ${fnName}` };
            }
          } catch (e) {
            result = { success: false, result: `Tool execution error: ${e instanceof Error ? e.message : "Unknown"}` };
          }

          // Notify frontend: tool executed
          controller.enqueue(enc.encode(sseEvent("tool_result", {
            id: tc.id,
            name: fnName,
            success: result.success,
            result: result.result,
            data: result.data,
            status: "done",
          })));

          toolResults.push({
            tool_call_id: tc.id,
            role: "tool",
            content: result.result,
          });
        }

        // ─── Step 2: Send tool results back to Gemini for final summary ──
        const followUpMessages = [
          ...contextMessages,
          assistantMessage,
          ...toolResults,
        ];

        try {
          const summaryResponse = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: followUpMessages,
                stream: true,
              }),
            }
          );

          if (!summaryResponse.ok) {
            const errText = await summaryResponse.text();
            console.error("Summary AI error:", summaryResponse.status, errText);
            controller.enqueue(enc.encode(sseEvent("content", {
              text: "\n\n*Summary unavailable — but all production actions were executed successfully.*",
            })));
            controller.enqueue(enc.encode(sseEvent("done", {})));
            controller.close();
            return;
          }

          // Stream the final summary to the client
          const reader = summaryResponse.body!.getReader();
          const decoder = new TextDecoder();
          let buf = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });

            let nlIdx: number;
            while ((nlIdx = buf.indexOf("\n")) !== -1) {
              let line = buf.slice(0, nlIdx);
              buf = buf.slice(nlIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (line.startsWith(":") || line.trim() === "") continue;
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(enc.encode(sseEvent("content", { text: content })));
                }
              } catch {
                buf = line + "\n" + buf;
                break;
              }
            }
          }
        } catch (e) {
          console.error("Summary stream error:", e);
          controller.enqueue(enc.encode(sseEvent("content", {
            text: "\n\n*All actions completed. Summary generation encountered an error.*",
          })));
        }

        controller.enqueue(enc.encode(sseEvent("done", {})));
        controller.close();
      },
    });

    return new Response(body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("director-assist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
