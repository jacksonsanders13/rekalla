// Rekalla v3 — Assistant Edge Function (the basic "Ask" chat)
//
// Answers the person's questions from their OWN calendar + saved items. No
// medical tiers, no escalation — just a warm, grounded reply. RLS keeps every
// read scoped to the signed-in user; the model API key lives ONLY here.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { estCostMicros } from "../_shared/pricing.ts";
import { retrieveContext } from "./retrieval.ts";
import { buildSystemPrompt, RESPOND_TOOL } from "./prompt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5";
const MONTHLY_MESSAGE_LIMIT = Number(Deno.env.get("MONTHLY_MESSAGE_LIMIT") ?? "500");

async function reply(systemPrompt: string, userMessage: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 700,
      system: systemPrompt,
      tools: [RESPOND_TOOL],
      tool_choice: { type: "tool", name: "respond" },
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`model call failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const toolUse = (data.content ?? []).find((b: { type: string }) => b.type === "tool_use");
  if (!toolUse) throw new Error("model did not return a tool call");
  const usage = {
    input_tokens: Number(data.usage?.input_tokens ?? 0),
    output_tokens: Number(data.usage?.output_tokens ?? 0),
  };
  return { reply: (toolUse.input as { reply: string }).reply, usage };
}

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "missing bearer token" }, 401);
    }

    const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await db.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "invalid token" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const userMessage = (body.user_message ?? "").toString().trim();
    if (!userMessage) return jsonResponse({ error: "user_message is required" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Monthly cap: refuse BEFORE the model call so a blocked message is free.
    if (MONTHLY_MESSAGE_LIMIT > 0) {
      try {
        const { count } = await admin
          .from("assistant_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", startOfMonthISO());
        if ((count ?? 0) >= MONTHLY_MESSAGE_LIMIT) {
          return jsonResponse({
            reply:
              "You've used all of this month's questions with me. They'll refresh at the start of next month.",
          });
        }
      } catch (_) {
        // fail open
      }
    }

    const ctx = await retrieveContext(db, userId);
    const systemPrompt = buildSystemPrompt(ctx);
    const result = await reply(systemPrompt, userMessage);

    try {
      await admin.from("assistant_usage").insert({
        user_id: userId,
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
        est_cost_micros: estCostMicros(
          ANTHROPIC_MODEL,
          result.usage.input_tokens,
          result.usage.output_tokens,
        ),
      });
    } catch (e) {
      console.error("usage logging failed", e);
    }

    return jsonResponse({ reply: result.reply });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: "assistant failed", detail: String(e) }, 500);
  }
});
