# Rekalla v2 — Architecture

Rekalla v2 is a **personalized AI assistant for older adults**, backed by the
v1 caregiving data as its knowledge base. This document is the source of truth
for the data model, the assistant's scoping/tier rules, the API surface, and how
the two clients share one backend. Keep it current as you build.

---

## 1. System shape

```
  Elder (primary)                Family (support)
        │                              │
 ┌──────┴───────┐              ┌───────┴────────┐
 │ Expo / RN    │              │  Next.js web   │   (both clients, same backend)
 │ mobile/      │              │  app/          │
 └──────┬───────┘              └───────┬────────┘
        │  supabase-js / @supabase/ssr │
        └──────────────┬───────────────┘
                       ▼
        ┌──────────────────────────────────┐
        │            Supabase               │
        │  Postgres (RLS) · Auth · Storage  │
        │  Edge Functions:                  │
        │    • assistant  (Part B + C)      │  ← holds ANTHROPIC_API_KEY
        │  Postgres fns: is_active_caregiver│
        └──────────────────────────────────┘
                       │
                       ▼  (server-side only)
                  Anthropic Messages API
```

**Shared-logic rule:** anything both clients must agree on — the assistant, tier
classification, retrieval scoping — lives in the `assistant` Edge Function or in
Postgres functions. Clients are thin: they render, capture voice/text, and call
the function. No assistant or tier logic is duplicated in Swift/JS/TS.

**Clients (reconciled with the actual repo, not the original brief):**
- Mobile = Expo/React Native (`mobile/`), the "iOS" client. Not Swift.
- Web = Next.js 15 App Router (`app/`). Not Vite.

---

## 2. Data model

### Inherited from v1 (the assistant's knowledge base)
| Table | Role in v2 |
|---|---|
| `profiles` (id = auth.users.id) | account identity; `account_type` ∈ patient/caregiver |
| `care_relationships` (patient_id, caregiver_id, relationship, status) | **contacts** + who's connected; `status='active'` = live link |
| `reminders`, `reminder_events`, `routine_items`, `routine_completions` | **calendar / "what's on this week"**, "who's driving Thursday" (via routine + reminders) |
| `vault_items` | documents/media (not a chat surface) |
| `wellness_entries` | trends (kept out of assistant scope — borders on medical) |
| `notifications` | delivery of family escalations (push/email/sms channels) |

### Added in v2 — migration `20260816000000_v2_personalization_and_escalation.sql`
| Table | Purpose | Key columns |
|---|---|---|
| `personalization_profiles` | Part A profile, 1:1 with elder | `user_id` PK, JSONB `identity/people/routine/interests/preferences/practical`, `section_status` |
| `profile_edits` | audit so elder sees family edits | `user_id` (owner), `editor_id`, `section`, `summary` |
| `escalation_events` | Part C tier log for family dashboard | `user_id`, `tier` (enum), `trigger_text`, `model_rationale`, `acknowledged_by/at` |

Enum `escalation_tier` ∈ `tier1_medical | tier2_financial | tier3_emotional | tier4_out_of_scope`.

**Profile section JSONB shapes** (both clients + Edge Function agree on these):
- `identity`: `{ legal_name, preferred_name, hometown, career, faith }`
- `people`: `[{ name, relationship, kind: family|friend|grandkid|pet, notes }]`
- `routine`: `{ typical_week[], standing_commitments: [{ label, cadence, logistics }] }` — **logistics only, never conditions**
- `interests`: `{ hobbies[], music[], teams[], shows[], books[] }`
- `preferences`: `{ enjoy_topics[], avoid_topics[], tone: chatty|brief }` — `avoid_topics` feeds the system prompt as a hard exclusion (e.g. late spouse)
- `practical`: `{ doctors: [{ name, specialty }], pharmacy, drivers: [{ name, when }], emergency_contacts: [{ name, phone, priority }] }` — **specialty only, no diagnoses**

**Non-medical invariant:** no diagnoses, medications, symptoms, or conditions are
ever stored or answered. Encoded in column comments and the system prompt.

**KNOWN GAP:** no `messages` or `care_notes` table exists. "What did Sarah say
about Thanksgiving?" needs one of them. Decide before/at Step 2. Proposed:
`messages(id, thread_owner=elder, sender_id, body, created_at)` and
`care_notes(id, user_id=elder, author_id, body, created_at)`, both RLS-scoped
like the rest (owner + active caregivers).

### RLS model
All v2 tables use `is_active_caregiver(owner uuid)` (SECURITY DEFINER) =
"there is an `active` care_relationship where patient_id=owner and
caregiver_id=auth.uid()". Elder owns their rows; active caregivers get
read + gap-fill write on the profile, read + acknowledge on escalations.
`escalation_events` INSERTs come from the Edge Function via the **service role**,
which bypasses RLS by design.

---

## 3. The assistant (Part B) — closed domain

**Non-negotiable:** answers ONLY from Rekalla's own data (profile, calendar,
family messages, care notes, contacts). Not a general chatbot.

**Implementation = strict retrieval + a scoping system prompt.**
1. Client sends `{ user_message, conversation_id }` to the `assistant` Edge
   Function with the user's Supabase JWT in `Authorization`.
2. Edge Function verifies the JWT → resolves `auth.uid()` = the elder.
3. **Retrieval** (server-side, RLS-respecting queries as the user): pull the
   personalization profile, this-week reminders/routine, contacts from
   care_relationships, and (once they exist) recent messages/care_notes. This
   retrieved context is the ONLY ground truth handed to the model.
4. **Model call** with a system prompt that: injects the retrieved context;
   forbids answering anything not grounded in it; refuses medical/symptom/
   medication, legal/financial, and general-world-knowledge questions **warmly**
   and offers an in-scope action ("I don't know about that — want me to send
   Sarah a message?"); honors `preferences.tone` and `preferences.avoid_topics`.
5. Response returns `{ reply, tier, suggested_action }`. Spoken output on the
   client via TTS; large mic button for voice input.

**Must answer:** "What's on my calendar this week?", "What did Sarah say about
Thanksgiving?", "Who's driving me Thursday?", "Who's my cardiologist again?",
"Help me write a message to my daughter."
**Must refuse:** medical advice, symptom interpretation, medication questions,
legal/financial advice, general world knowledge, anything not in the data.

**Model:** call the latest capable Claude model via the Anthropic Messages API
from the Edge Function. `ANTHROPIC_API_KEY` is an Edge Function secret only.

---

## 4. Tiered escalation (Part C)

Every incoming message is classified by **the model** (never keyword matching —
"chest of drawers" and "chest pain" must not be conflated) into one tier, and the
tier drives the client UI. Tier 1 & Tier 2 are logged to `escalation_events`
(service role) and pushed to the family dashboard via `notifications`.

| Tier | Trigger | UI behavior | Escalation |
|---|---|---|---|
| **1 — Medical/urgent** | "chest pain", "I fell", "can't breathe" | **911 button FIRST**, emergency contact (by `priority`) second — never route to a daughter three states away | log + notify family in parallel |
| **2 — Financial/scam** | "gift cards", "IRS is calling", "a man online needs $400" | Immediately surface top-priority family contact. **NEVER** assist the transaction or look up how to buy/send anything | log + **push to family dashboard** — highest-value guardrail, first-class feature |
| **3 — Emotional** | lonely, sad, missing someone | **No emergency UI.** Warm response, offer to reach a person ("Want me to send Sarah a note?") | none |
| **4 — Out of scope, benign** | general/other | warm redirect, no alarm | none |

Classification is part of the same Edge Function turn (single model call may
both classify and reply, or a fast classify pass then a reply). The client trusts
`tier` from the server to choose which UI to render; it never re-derives it.

---

## 5. API surface

**Edge Function `assistant`** (`POST`, Supabase-hosted):
- Auth: `Authorization: Bearer <supabase user jwt>`.
- Request: `{ user_message: string, conversation_id?: string }`.
- Response: `{ reply: string, tier: escalation_tier, suggested_action?: { type: 'send_message'|'call_contact'|'none', contact?: {...} } }`.
- Side effects: inserts `escalation_events` for tier1/tier2; enqueues
  `notifications` to active caregivers for tier1/tier2.

**Postgres functions (shared):** `is_active_caregiver(uuid)`; `set_updated_at()`.

**Direct table access (both clients, RLS-enforced):** profile read/write, edit
history, escalation log read + acknowledge, plus all inherited v1 tables.

---

## 6. How iOS (Expo) and web (Next.js) share the backend
- Same Supabase project, same Auth, same RLS. No client holds privileged keys.
- Same JSONB profile shapes (§2) → identical read/write on both clients.
- One `assistant` Edge Function → identical assistant + tier behavior on both.
- Shared validation belongs in Postgres/Edge, not re-implemented per client.

---

## 7. Accessibility (Part D) — architectural constraints
- Type: base body ≥20pt; support Dynamic Type (iOS) / rem + 200% browser zoom
  (web) up to accessibility sizes without breaking layout.
- Voice: every free-text profile field and the assistant have voice input;
  assistant has spoken output; mic button is large and central.
- Contrast: WCAG AAA; never encode meaning in color alone (icon+label always).
- Targets: interactive elements ≥60×60pt.
- Navigation: ≤2 levels deep from home; no gesture-only actions.
- No timeouts, no auto-dismissing surfaces (critical for tier prompts).
- Full VoiceOver/screen-reader labels on every interactive element; web fully
  keyboard-navigable.

---

## 8. Build order & status
1. ✅ Profile + escalation schema — `20260816000000_...sql` (authored, not applied)
2. ✅ `assistant` Edge Function (scoping + tier) + `20260816000001` messages/care_notes
3. ⏳ Expo client (profile flow, assistant, tier UI)
4. ⏳ Next.js web client (same, keyboard/zoom a11y)
5. ⏳ Family dashboard (escalation log, profile gap-filling)
6. ⏳ README with local setup for both clients
