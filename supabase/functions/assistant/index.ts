// Rekalla v2 — Assistant Edge Function (Part B + Part C)
//
// One function, both clients (Next.js web + Expo mobile) call it. It:
//   1. authenticates the caller (Supabase JWT) → resolves the elder,
//   2. retrieves ONLY Rekalla's own data for that elder (RLS-enforced),
//   3. asks the model for a warm, in-scope reply + a safety-tier classification,
//   4. for tier1/tier2, logs an escalation_event and notifies active caregivers,
//   5. returns { reply, tier, suggested_action }.
//
// SECURITY: ANTHROPIC_API_KEY lives ONLY here, as an Edge Function secret. It is
// never shipped to any client. Do not add it to a client bundle or app.json.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { orderedEmergencyContacts, retrieveContext } from "./retrieval.ts";
import { buildSystemPrompt, RESPOND_TOOL } from "./prompt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
// Overridable; defaults to a current, capable Claude model. Tier accuracy
// (e.g. "chest of drawers" vs "chest pain") depends on model quality.
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5";
// Per-user monthly message cap. Protects API spend and guarantees margin once
// priced: at ~1.5c/message, tune it to (price * target_margin) / 0.015.
// e.g. $14.99 * 0.50 / 0.015 ~= 500. Set 0 to disable the cap.
const MONTHLY_MESSAGE_LIMIT = Number(
  Deno.env.get("MONTHLY_MESSAGE_LIMIT") ?? "500",
);

interface AssistantResult {
  tier: string;
  rationale: string;
  reply: string;
  suggested_action?: { type: string; contact_name?: string };
  proposed_action?: Record<string, unknown>;
}

// Split a data URL into the media type + base64 payload Anthropic expects.
function parseDataUrl(dataUrl: string): { media_type: string; data: string } | null {
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  return { media_type: m[1], data: m[2] };
}

async function classifyAndReply(
  systemPrompt: string,
  userMessage: string,
  imageDataUrl?: string,
) {
  // Vision: when a photo is attached, send it as an image content block
  // alongside the text so the model can describe/read it.
  const parsed = imageDataUrl ? parseDataUrl(imageDataUrl) : null;
  const content = parsed
    ? [
        { type: "image", source: { type: "base64", ...parsed } },
        { type: "text", text: userMessage },
      ]
    : userMessage;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: [RESPOND_TOOL],
      tool_choice: { type: "tool", name: "respond" },
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`model call failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const toolUse = (data.content ?? []).find(
    (b: { type: string }) => b.type === "tool_use",
  );
  if (!toolUse) throw new Error("model did not return a tool call");
  const usage = {
    input_tokens: Number(data.usage?.input_tokens ?? 0),
    output_tokens: Number(data.usage?.output_tokens ?? 0),
  };
  return { result: toolUse.input as AssistantResult, usage };
}

// --- Monthly usage cap ---------------------------------------------------
type Admin = ReturnType<typeof createClient>;

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

// How many messages this user has been answered this calendar month. Fails
// OPEN (returns 0) so an infra hiccup never locks a paying user out.
async function monthlyMessageCount(admin: Admin, elderId: string): Promise<number> {
  try {
    const { count, error } = await admin
      .from("assistant_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", elderId)
      .gte("created_at", startOfMonthISO());
    if (error) throw error;
    return count ?? 0;
  } catch (e) {
    console.error("usage count failed (failing open)", e);
    return 0;
  }
}

async function logUsage(
  admin: Admin,
  elderId: string,
  usage: { input_tokens: number; output_tokens: number },
) {
  await admin.from("assistant_usage").insert({
    user_id: elderId,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    // Sonnet 5: $3/1M in, $15/1M out -> micro-dollars.
    est_cost_micros: usage.input_tokens * 3 + usage.output_tokens * 15,
  });
}

// tier1/tier2 side effects run with the SERVICE ROLE so the log is always
// written even though clients cannot INSERT into escalation_events.
async function logEscalation(
  elderId: string,
  result: AssistantResult,
  triggerText: string,
) {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  await admin.from("escalation_events").insert({
    user_id: elderId,
    tier: result.tier,
    trigger_text: triggerText,
    model_rationale: result.rationale,
  });

  // Notify every ACTIVE caregiver via the existing notifications pipeline.
  const { data: caregivers } = await admin
    .from("care_relationships")
    .select("caregiver_id")
    .eq("patient_id", elderId)
    .eq("status", "active");

  const label = result.tier === "tier1_medical" ? "Medical alert" : "Possible scam alert";
  const rows = (caregivers ?? [])
    .filter((c) => c.caregiver_id)
    .map((c) => ({
      user_id: c.caregiver_id,
      channel: "push",
      status: "pending",
      title: label,
      body: `Rekalla flagged a message: "${triggerText.slice(0, 140)}"`,
    }));
  if (rows.length) {
    await admin.from("notifications").insert(rows);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "missing bearer token" }, 401);
    }

    // User-scoped client: forwards the caller's JWT so every read is RLS-checked.
    const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await db.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "invalid token" }, 401);
    }
    const elderId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const userMessage = (body.user_message ?? "").toString().trim();
    const imageDataUrl =
      typeof body.image_data_url === "string" ? body.image_data_url : undefined;
    if (!userMessage && !imageDataUrl) {
      return jsonResponse({ error: "user_message is required" }, 400);
    }

    // Service-role client: used for the usage meter and escalation logging.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Monthly cap: refuse BEFORE calling the model so a blocked message is free.
    if (MONTHLY_MESSAGE_LIMIT > 0) {
      const used = await monthlyMessageCount(admin, elderId);
      if (used >= MONTHLY_MESSAGE_LIMIT) {
        return jsonResponse({
          reply:
            "You've used all of this month's messages with me. They'll refresh at the start of next month. If you need something now, please reach out to your family.",
          tier: "tier4_out_of_scope",
          suggested_action: { type: "none" },
          proposed_action: { kind: "none" },
          limit_reached: true,
        });
      }
    }

    const ctx = await retrieveContext(db, elderId);
    const systemPrompt = buildSystemPrompt(ctx);
    const { result, usage } = await classifyAndReply(systemPrompt, userMessage, imageDataUrl);

    // Meter this answered message (best-effort; never blocks the reply).
    try {
      await logUsage(admin, elderId, usage);
    } catch (e) {
      console.error("usage logging failed", e);
    }

    if (result.tier === "tier1_medical" || result.tier === "tier2_financial") {
      // Best-effort: never let a logging failure swallow the user's reply.
      try {
        await logEscalation(elderId, result, userMessage);
      } catch (e) {
        console.error("escalation logging failed", e);
      }
    }

    return jsonResponse({
      reply: result.reply,
      tier: result.tier,
      suggested_action: result.suggested_action ?? { type: "none" },
      // Confirm-first write the client offers via a Yes/No card.
      proposed_action: result.proposed_action ?? { kind: "none" },
      // The client renders tier UI (911 button / family contact) from `tier`
      // and this priority-ordered contact list — never re-derived client-side.
      emergency_contacts:
        result.tier === "tier1_medical" || result.tier === "tier2_financial"
          ? orderedEmergencyContacts(ctx)
          : undefined,
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: "assistant failed", detail: String(e) }, 500);
  }
});
