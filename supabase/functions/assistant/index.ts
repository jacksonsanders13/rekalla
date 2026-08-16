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

interface AssistantResult {
  tier: string;
  rationale: string;
  reply: string;
  suggested_action?: { type: string; contact_name?: string };
}

async function classifyAndReply(systemPrompt: string, userMessage: string) {
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
      messages: [{ role: "user", content: userMessage }],
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
  return toolUse.input as AssistantResult;
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
    if (!userMessage) {
      return jsonResponse({ error: "user_message is required" }, 400);
    }

    const ctx = await retrieveContext(db, elderId);
    const systemPrompt = buildSystemPrompt(ctx);
    const result = await classifyAndReply(systemPrompt, userMessage);

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
