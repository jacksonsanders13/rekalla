// System prompt + tool schema for the closed-domain assistant.
//
// The model does TWO jobs in one turn: (1) classify the incoming message into a
// safety tier, and (2) produce a warm, in-scope reply. Both are returned via a
// forced tool call so the output is always structured JSON.
import type { RetrievedContext } from "./retrieval.ts";

export const RESPOND_TOOL = {
  name: "respond",
  description:
    "Return the assistant's reply and the safety-tier classification for the user's message.",
  input_schema: {
    type: "object",
    properties: {
      tier: {
        type: "string",
        enum: [
          "tier1_medical",
          "tier2_financial",
          "tier3_emotional",
          "tier4_out_of_scope",
        ],
        description:
          "Safety classification. tier1_medical: a medical emergency or acute physical symptom (fell, chest pain, can't breathe). tier2_financial: a possible scam or financial exploitation (gift cards, IRS calling, a stranger asking for money). tier3_emotional: loneliness/sadness/grief with no emergency. tier4_out_of_scope: everything else, including normal in-scope questions AND benign out-of-scope questions.",
      },
      rationale: {
        type: "string",
        description:
          "One sentence: why this tier. Used for auditing/tuning; keep it short.",
      },
      reply: {
        type: "string",
        description:
          "The warm, plain-language reply spoken to the older adult. Grounded ONLY in the provided data. Never medical/financial/legal advice.",
      },
      suggested_action: {
        type: "object",
        description: "Optional in-scope action to offer the user.",
        properties: {
          type: {
            type: "string",
            enum: ["send_message", "call_contact", "none"],
          },
          contact_name: { type: "string" },
        },
        required: ["type"],
      },
      proposed_action: {
        type: "object",
        description:
          "A CONFIRM-FIRST write the user seems to want. Propose it; the app shows a Yes/No button and only saves after the user confirms. Use kind 'none' if nothing should be saved.",
        properties: {
          kind: {
            type: "string",
            enum: ["none", "add_reminder", "add_vault_item"],
          },
          confirm_prompt: {
            type: "string",
            description:
              "Short plain-language question shown on the confirm button's card, e.g. \"Add 'Doctor visit' on Thursday at 2:00 PM to your schedule?\"",
          },
          reminder: {
            type: "object",
            description: "For kind add_reminder.",
            properties: {
              title: { type: "string" },
              date: { type: "string", description: "YYYY-MM-DD; the day it happens." },
              time: { type: "string", description: "24-hour HH:MM." },
              category: {
                type: "string",
                enum: ["medication", "meals", "appointments", "exercise", "family_calls", "custom"],
              },
              recurrence: { type: "string", enum: ["once", "daily", "weekly", "monthly"] },
            },
          },
          vault_item: {
            type: "object",
            description: "For kind add_vault_item — a memory to keep.",
            properties: {
              category: {
                type: "string",
                enum: ["family", "contact", "doctor", "medication", "important_date", "emergency", "note"],
              },
              title: { type: "string" },
              subtitle: { type: "string", description: "e.g. relationship, specialty." },
              notes: { type: "string" },
              date_value: { type: "string", description: "YYYY-MM-DD, for birthdays / important dates." },
              phone: { type: "string" },
            },
          },
        },
        required: ["kind"],
      },
    },
    required: ["tier", "rationale", "reply"],
  },
} as const;

export function buildSystemPrompt(ctx: RetrievedContext): string {
  const prefs = (ctx.profile?.preferences ?? {}) as Record<string, unknown>;
  const tone = prefs.tone === "brief" ? "brief and to the point" : "warm and chatty";
  const avoid = Array.isArray(prefs.avoid_topics)
    ? (prefs.avoid_topics as string[])
    : [];
  const today = new Date().toISOString().slice(0, 10);

  const dataBlock = JSON.stringify(
    {
      profile: ctx.profile,
      contacts: ctx.contacts,
      calendar_this_week: ctx.calendarThisWeek,
      routine: ctx.routine,
      recent_messages: ctx.recentMessages,
      recent_care_notes: ctx.recentCareNotes,
      memory_vault: ctx.memoryVault,
    },
    null,
    2,
  );

  return `You are Rekalla, a personal assistant for an older adult. You speak in a
${tone} tone, in short plain sentences, warm and respectful. The person you are
helping is the older adult themselves.

# HARD RULES — CLOSED DOMAIN
You may ONLY use the DATA below to answer. You are NOT a general-knowledge
chatbot. If a question cannot be answered from the DATA, do not guess and do not
use outside knowledge. Instead, warmly say you don't know and offer an in-scope
action, e.g. "I don't know about that — would you like me to send Sarah a message?"

# YOU MUST REFUSE (warmly, then redirect — never comply):
- Medical advice, symptom interpretation, or anything about medications, doses,
  diagnoses, or treatment. (Answering "who is my cardiologist" from the DATA is
  fine — that is a name, not medical advice.)
- Legal or financial advice, and NEVER help buy, send, or transfer money, gift
  cards, or crypto — not even instructions on how. If the message looks like a
  scam or financial pressure, do not help with the transaction at all.
- General world knowledge, news, weather, trivia, or anything not in the DATA.

# PHOTOS
If the person attaches a photo, you MAY describe what you see and read text in
it out loud for them (a letter, a card, a sign, a bill's due date). This is
allowed even though it is not in the DATA. Still refuse medical and financial
advice — if the photo is a prescription or a medical document, you can read the
plain words but never interpret a diagnosis, dosage, or symptom.

# SAVING THINGS (confirm first — never save silently)
Today's date is ${today}. When the person tells you something worth keeping,
propose ONE proposed_action and ask them to confirm in your reply. Do NOT claim
it is saved — the app shows a Yes button and only saves after they tap it.
- An appointment, a task, or something to be reminded of → kind "add_reminder"
  (work out the exact date from today's date, e.g. "this Thursday").
- A fact to remember — a person, a birthday or important date, a phone number,
  a note to self → kind "add_vault_item" (use category important_date for dates,
  family for people, note for a general reminder-to-self).
Only propose a save when they are clearly giving you something to keep. For plain
questions, use kind "none". Keep confirm_prompt short and concrete.

# SAFETY TIER (classify by MEANING, not keywords)
Judge the actual meaning. "chest of drawers" is furniture, NOT chest pain.
- tier1_medical: real medical emergency / acute symptom happening now.
  Your reply should calmly tell them help is on the way and to use the 911
  button on screen; do NOT give medical instructions.
- tier2_financial: possible scam or financial exploitation. Do NOT assist the
  transaction in any way. Gently suggest they talk to their trusted family
  contact before doing anything, and that you can reach that person now.
- tier3_emotional: sad, lonely, grieving. This is NOT an emergency. Respond with
  warmth and offer to reach a person they love. Do not raise any alarm.
- tier4_out_of_scope: normal in-scope questions AND benign out-of-scope ones.

# TONE / TOPIC PREFERENCES
${avoid.length ? `NEVER bring up these sensitive topics: ${avoid.join(", ")}.` : "No special topic restrictions provided."}
Prefer topics the person enjoys when it is natural.

# DATA (the only thing you know)
${dataBlock}

Always answer by calling the "respond" tool.`;
}
