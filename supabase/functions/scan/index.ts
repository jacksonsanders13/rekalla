// Rekalla v3 — Scan Edge Function
//
// Reads a photo of an everyday paper document (a calendar, an appointment card,
// a bill) an older adult wants to bring online, and extracts the dated items so
// the app can turn them into reminders. Vision + a forced tool → structured
// JSON. Non-medical only.
//
// SECURITY: ANTHROPIC_API_KEY lives ONLY here as an Edge Function secret.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { estCostMicros } from "../_shared/pricing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5";
// Shared monthly cap with the assistant, so scan spend is bounded too.
const MONTHLY_MESSAGE_LIMIT = Number(Deno.env.get("MONTHLY_MESSAGE_LIMIT") ?? "500");

const EXTRACT_TOOL = {
  name: "extract",
  description:
    "Return the concrete dated items found in the photo of a paper document.",
  input_schema: {
    type: "object",
    properties: {
      doc_type: {
        type: "string",
        enum: ["calendar", "appointment", "bill", "other"],
        description:
          "What the photo mostly is. Use 'other' (with an empty items list) for anything medical, or anything with no dated items.",
      },
      items: {
        type: "array",
        description: "Every dated thing worth remembering. Empty if none.",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["event", "appointment", "bill"] },
            title: { type: "string", description: "Short, plain label, e.g. \"Dentist\" or \"Electric bill\"." },
            date: { type: "string", description: "The day it happens / is due, as YYYY-MM-DD." },
            time: { type: "string", description: "24-hour HH:MM. Omit if it's an all-day item." },
            location: { type: "string", description: "Place, if written. Omit otherwise." },
            amount: { type: "string", description: "For a bill, the amount due, e.g. \"$45.00\". Omit otherwise." },
            notes: { type: "string", description: "Anything else useful and short." },
          },
          required: ["type", "title", "date"],
        },
      },
    },
    required: ["doc_type", "items"],
  },
} as const;

function parseDataUrl(dataUrl: string): { media_type: string; data: string } | null {
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  return { media_type: m[1], data: m[2] };
}

function systemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `You read a photo of an everyday paper document an older adult wants to
bring online — a paper calendar or planner, an appointment card, or a bill or
letter with a due date. Extract ONLY concrete dated items: events,
appointments, and bill due dates.

Today's date is ${today}. Resolve partial or relative dates to the nearest
sensible FUTURE date — if the year is missing, pick this year or next so the
date is not in the past. Use a 24-hour HH:MM time only when a time is clearly
written; otherwise leave time out (it's an all-day item).

You are NOT a medical tool. If the photo is a prescription, a medication list,
or any medical document, return doc_type "other" with an empty items list. Never
give medical, legal, or financial advice — only transcribe what is written.

Always answer by calling the "extract" tool.`;
}

async function extract(imageDataUrl: string, hint?: string) {
  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) throw new Error("invalid image data url");

  const userText =
    hint && hint !== "auto"
      ? `This is a ${hint}. Extract the dated items.`
      : "Extract the dated items from this document.";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: systemPrompt(),
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "extract" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", ...parsed } },
            { type: "text", text: userText },
          ],
        },
      ],
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
  return { result: toolUse.input as { doc_type: string; items: unknown[] }, usage };
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
    const imageDataUrl = typeof body.image_data_url === "string" ? body.image_data_url : "";
    const hint = typeof body.hint === "string" ? body.hint : "auto";
    if (!imageDataUrl) return jsonResponse({ error: "image_data_url is required" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Monthly cap: refuse BEFORE the model call so a blocked scan is free.
    if (MONTHLY_MESSAGE_LIMIT > 0) {
      try {
        const { count } = await admin
          .from("assistant_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", startOfMonthISO());
        if ((count ?? 0) >= MONTHLY_MESSAGE_LIMIT) {
          return jsonResponse({ error: "limit_reached", doc_type: "other", items: [] }, 429);
        }
      } catch (_) {
        // fail open — never block a user on an infra hiccup
      }
    }

    const { result, usage } = await extract(imageDataUrl, hint);

    try {
      await admin.from("assistant_usage").insert({
        user_id: userId,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        est_cost_micros: estCostMicros(
          ANTHROPIC_MODEL,
          usage.input_tokens,
          usage.output_tokens,
        ),
      });
    } catch (e) {
      console.error("usage logging failed", e);
    }

    return jsonResponse({
      doc_type: result.doc_type ?? "other",
      items: Array.isArray(result.items) ? result.items : [],
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: "scan failed", detail: String(e) }, 500);
  }
});
