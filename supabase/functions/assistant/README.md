# `assistant` Edge Function

Closed-domain assistant + safety-tier classifier for Rekalla v2. Both the web
(Next.js) and mobile (Expo) clients call this one function — no assistant or
tier logic is duplicated client-side.

## Contract
`POST /functions/v1/assistant`

Headers: `Authorization: Bearer <supabase user JWT>`

Request:
```json
{ "user_message": "What's on my calendar this week?", "conversation_id": "optional" }
```

Response:
```json
{
  "reply": "…warm, plain-language answer…",
  "tier": "tier1_medical | tier2_financial | tier3_emotional | tier4_out_of_scope",
  "suggested_action": { "type": "send_message | call_contact | none", "contact_name": "Sarah" },
  "emergency_contacts": [ { "name": "Sarah", "phone": "…", "priority": 1 } ]
}
```
`emergency_contacts` is present only for tier1/tier2 (priority-ordered). The
client renders tier UI (911 button, family contact) from `tier` — never
re-derives the tier itself.

## Secrets (set with `supabase secrets set`, NEVER in a client)
- `ANTHROPIC_API_KEY` — the model key. Lives ONLY here.
- `ANTHROPIC_MODEL` — optional override (default `claude-sonnet-5`).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — the first
  three are auto-injected by the platform; the service role is used only for the
  tier1/tier2 escalation log + family notifications (bypasses RLS by design).

## How scoping works
1. The caller's JWT is forwarded into a user-scoped Supabase client, so all
   retrieval (`retrieval.ts`) is RLS-enforced — the assistant can only read what
   the signed-in elder is allowed to read.
2. That retrieved bundle is the ONLY ground truth given to the model
   (`prompt.ts`). The system prompt forbids outside knowledge and forces a warm
   refusal + in-scope action for anything not in the data.
3. The model returns a forced `respond` tool call → `{ tier, rationale, reply,
   suggested_action }`. Tier is judged by meaning, not keywords.

## Run locally
```bash
supabase start
supabase functions serve assistant --env-file supabase/functions/.env.local
# .env.local (gitignored) holds ANTHROPIC_API_KEY etc. for local dev only.
```

## Deploy
```bash
supabase functions deploy assistant
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```
