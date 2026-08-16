# Rekalla v2 — Worklog

> Written for a **different AI agent** (possibly Codex) picking this up mid-task
> with zero context. Read this top-to-bottom before touching anything. Entries
> are append-only, newest at the bottom of each dated section.

---

## Orientation for the next agent (read first)

**What v2 is:** Rekalla is being rebuilt from a *family-first caregiving
coordination dashboard* (v1, live on the App Store) into a *personalized AI
assistant whose PRIMARY USER is the older adult*. Family becomes the support
role: they help set up the profile, receive escalations, stay reachable. The v1
coordination features (reminders/calendar, vault, wellness, care relationships)
survive as the **data layer** the assistant reads from, not the main surface.

**ACTUAL stack (differs from the original brief — reconciled here):**
- The brief said "Swift/SwiftUI iOS" and "web = React + TypeScript + **Vite**".
  Neither matches the repo. **Do not introduce Swift or Vite.**
- **Web** = Next.js 15 (App Router, React 19, TypeScript, Tailwind) — `app/`,
  `components/`, `hooks/`, `lib/`, `middleware.ts`. Supabase via `@supabase/ssr`.
- **Mobile (the "iOS" client)** = Expo / React Native + expo-router — `mobile/`.
  Supabase via `@supabase/supabase-js` + AsyncStorage. `mobile/app/` is the
  route tree, `mobile/hooks/data.ts` is the data layer, `mobile/components/`.
- **Backend** = Supabase (Postgres + Auth + Storage + Edge Functions).
- **DECISION:** Keep both existing clients. "Shared business logic lives in
  Postgres functions / Supabase Edge Functions so both clients call the same
  thing" is satisfied by putting the assistant + tier classification in ONE Edge
  Function that both Next.js and Expo call. Do NOT duplicate the assistant in JS.

**Branch:** The brief asks for a branch literally named `v2-assistant`. This
session was pinned by the harness to `claude/rekalla-v2-assistant-d2u9fs`, and
that is where work is committed/pushed. `main` is v1 and MUST stay deployable —
never commit there. If a plain `v2-assistant` branch is required for a PR, cut
it from this branch later; do not fork history now.

**Existing schema (supabase/migrations, applied through 20260806):** tables
`profiles`, `care_relationships` (patient_id, caregiver_id, invited_email,
relationship, status ∈ pending|active|revoked), `reminders`, `reminder_events`,
`routine_items`, `routine_completions`, `vault_items`, `wellness_entries`,
`notifications`. Enum `account_type` ∈ (`patient`, `caregiver`).
`profiles.id` = `auth.users.id`. There is a reusable `set_updated_at()` trigger
fn and (assumed) an existing pattern for RLS — verify before relying on it.

**GAP — important:** The brief's assistant reads "shared calendar, **family
messages**, **care notes**, contacts." The DB has reminders (≈ calendar),
vault, wellness, care_relationships (≈ contacts) — but **no `messages` and no
`care_notes` tables exist yet.** Someone must decide: (a) add `messages` +
`care_notes` tables, or (b) map "messages/notes" onto an existing surface. Until
then the assistant can only answer calendar/contacts/profile questions. This is
the first real blocker for Part B's "What did Sarah say about Thanksgiving?"

**Env vars (names — values live in Supabase/Vercel/EAS secrets, never in repo):**
- Clients: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_SITE_URL` (web); Expo reads equivalents via `expo-constants`.
- **Edge Function ONLY (never shipped to a client):** `ANTHROPIC_API_KEY`
  (the model key — see security note below), plus `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` (auto-injected in Edge Functions) for privileged
  writes to `escalation_events`.

**API KEY SECURITY (non-negotiable):** the model API key exists ONLY as an Edge
Function secret. It must NEVER appear in the iOS/Expo binary, the web bundle,
`NEXT_PUBLIC_*`, `app.json`, or any committed file. Both clients call the Edge
Function; the Edge Function calls the model. If you are about to put a key in a
client, stop.

**Order of work (from brief):** 1) profile schema+migrations → 2) assistant Edge
Function (scoping + tier classification) → 3) Expo client → 4) Next.js web client
→ 5) family dashboard (escalation log + gap-filling) → 6) README both clients.

**Accessibility is a hard requirement, not polish** (primary user 70+): ≥20pt
body text + full Dynamic Type to a11y sizes; voice input AND spoken output for
the assistant with a large mic button; WCAG AAA contrast, never color alone; tap
targets ≥60×60pt; ≤2 nav levels from home; no timeouts / no auto-dismiss / no
gesture-only actions; full VoiceOver labels; web keyboard-navigable at 200% zoom.
Bake these into every component you build — retrofitting is expensive.

---

## 2026-08-16 — Session bootstrap + Part A schema

## [2026-08-16T00:00Z] Orientation & planning
- Decision: Reconciled brief vs. reality — stack is Next.js (web) + Expo (mobile)
  + Supabase, NOT Swift/Vite. Keep both clients; assistant logic goes in a single
  Edge Function so both share it. Documented in ARCHITECTURE.md.
- Decision: Work proceeds on the harness-pinned branch
  `claude/rekalla-v2-assistant-d2u9fs`; `main` (v1) stays untouched/deployable.
- Files touched: (read-only) inspected repo tree, package.json (root + mobile),
  supabase/migrations/*, .env.example.
- State: done
- Next: land Part A migration.

## [2026-08-16T00:10Z] Part A — personalization + escalation schema
- Decision: One `personalization_profiles` row per elder (PK = user_id →
  profiles.id), six JSONB section columns (identity, people, routine, interests,
  preferences, practical) + `section_status` JSONB driving the progress indicator
  and the family "which sections are empty" gap UI. JSONB (not child tables)
  chosen for v2 speed and identical shape across both clients; normalize to child
  tables later if querying inside people/doctors becomes necessary.
- Decision: `profile_edits` audit table attributes every write (editor_id,
  section, summary) so the elder can see family edits — satisfies "family edits
  are visible to them."
- Decision: Part C `escalation_events` table + `escalation_tier` enum
  (tier1_medical, tier2_financial, tier3_emotional, tier4_out_of_scope) landed
  now so the Edge Function (step 2) has a target. Tier is set by the MODEL, never
  keywords. Edge Function inserts via service role (bypasses RLS); RLS lets the
  elder + active caregivers SELECT, and caregivers acknowledge.
- Decision: `is_active_caregiver(owner uuid)` SECURITY DEFINER helper centralizes
  the "active caregiver of this elder" check used across all v2 RLS policies.
- Non-medical guardrail encoded in column comments: practical.doctors is
  {name, specialty} only; routine commitments are logistics only.
- ASSUMPTION to verify: reused `set_updated_at()` exists from the initial schema;
  care_relationships uses status='active' for a live link. Both looked correct in
  20260601000000_initial_schema.sql but confirm before applying to remote.
- Migration NOT yet applied to the remote Supabase project — it is a file only.
  Apply with `supabase db push` locally first, then to remote; do NOT
  apply_migration blindly against production.
- Files touched: supabase/migrations/20260816000000_v2_personalization_and_escalation.sql
- State: done (schema authored) / in-progress (not applied to any DB)
- Next: Step 2 — scaffold the `assistant` Edge Function: strict retrieval over
  {profile, reminders/calendar, contacts, (messages/notes once tables exist)} +
  a system prompt that (a) refuses out-of-scope warmly with an in-scope action,
  and (b) returns a tier classification. Decide the messages/care_notes gap first.

## [2026-08-16T00:20Z] Budget note / handoff point
- Decision: Session was started with a very limited usage budget and instructed
  to "plan to begin." Deliverables this session: reconciled plan + ARCHITECTURE.md
  + WORKLOG.md + Part A migration. Steps 2–6 remain.
- State: in-progress (planning + Part A landed; Parts B/C-UI/D/clients pending)
- Next: pick up at Step 2 (Edge Function) per ARCHITECTURE.md "Assistant" section.

## [2026-08-16T00:40Z] Resolve messages/care_notes gap
- Decision: Added `messages` (one logical thread per elder) + `care_notes`
  (non-medical). Both keyed to the elder (user_id), attributed by sender/author.
  Unblocks "What did Sarah say about Thanksgiving?" and "Help me write a message
  to my daughter." RLS reuses is_active_caregiver(): elder + active caregivers
  read/write; sender_id/author_id must equal auth.uid() (no impersonation).
- Migration NOT applied to any DB yet (file only). Apply after 20260816000000.
- Files touched: supabase/migrations/20260816000001_v2_messages_and_care_notes.sql
- State: done (authored)

## [2026-08-16T00:55Z] Step 2 — assistant Edge Function (Part B + Part C)
- Decision: One Deno Edge Function `assistant`, called by BOTH clients. Flow:
  verify JWT (getUser) → user-scoped Supabase client so ALL retrieval is
  RLS-enforced → retrieve profile + contacts + this-week reminders + routine +
  recent messages + care_notes → single model call with a FORCED `respond` tool
  returning { tier, rationale, reply, suggested_action } → tier1/tier2 side
  effects (log escalation_events + notify active caregivers) via service role.
- Decision: Tier classification and reply happen in ONE model turn via forced
  tool_use (structured JSON, no parsing fragility). Classify by MEANING — the
  system prompt explicitly calls out "chest of drawers" ≠ "chest pain".
- Decision: config.toml sets `verify_jwt = false` for the function so it can do
  its own auth and return warm 401s / handle both clients; the function still
  requires and validates a Bearer token.
- SECURITY: ANTHROPIC_API_KEY is an Edge Function secret only. Documented in
  .env.example (server-side section) + function README; .gitignore now ignores
  supabase/functions/.env.local. NEVER NEXT_PUBLIC_/EXPO_PUBLIC_.
- Model: default `claude-sonnet-5`, override via env `ANTHROPIC_MODEL`. If that
  id is unavailable in the target account, set the env var to a valid current id.
- Verified notifications insert columns (user_id, channel, title, body, status)
  against 20260601000000 — they match; channel='push', status='pending' valid.
- ENV NAMES (Edge Function secrets): ANTHROPIC_API_KEY, ANTHROPIC_MODEL,
  SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (last 3 platform-
  injected except service role which you set).
- NOT YET DONE / next-agent notes:
  * Neither migration nor the function is deployed. Deploy order: apply
    20260816000000 then 20260816000001, then `supabase functions deploy assistant`
    and `supabase secrets set ANTHROPIC_API_KEY=...`.
  * `conversation_id` is accepted but multi-turn history is not yet persisted —
    each call is currently single-turn. Add a conversations/messages-per-turn
    store if history is needed.
  * suggested_action.type 'send_message' is surfaced to the client but the
    function does not itself write to `messages` yet — the client confirms then
    writes (keeps the elder in control). Wire this in Step 3/4.
  * No automated tests yet. Consider a Deno test that mocks the Anthropic fetch
    and asserts tier1/tier2 trigger the escalation insert.
- Files touched: supabase/functions/_shared/cors.ts,
  supabase/functions/assistant/{index,retrieval,prompt}.ts,
  supabase/functions/assistant/README.md, supabase/config.toml,
  .env.example, .gitignore
- State: done (authored, not deployed)
- Next: Step 3 — Expo client: profile flow (chunked, resumable, voice input,
  progress), assistant screen (large mic, spoken output), tier UI (911 button
  first for tier1, family contact for tier2). Enforce Part D a11y from the start.

## [2026-08-16T01:30Z] Step 3 — Expo (mobile) client
- Decision: v2 a11y is a SEPARATE token layer (`mobile/lib/a11y.ts`: body>=20pt,
  tap>=60pt) instead of mutating the shared `theme.ts` (font.base=17, buttons 52)
  — that keeps v1 screens untouched while every NEW v2 surface meets Part D.
  New primitives in `mobile/components/big-ui.tsx` (BigButton>=60, BigField,
  MicButton 112px, BodyText>=20) all take explicit accessibilityLabels; meaning
  is icon+text, never color alone; 911 button min-height 84.
- Decision: The ASSISTANT is the elder's home. `app/index.tsx` now redirects
  patients to `/(patient)/assistant`; added Assistant (first) + Profile tabs in
  `app/(patient)/_layout.tsx`. NOTE/IA-TODO: that makes 7 bottom tabs (Assistant,
  Home, Profile, Reminders, Routine, Vault, Wellness) — above the ideal for 70+.
  Recommend a future pass consolidating reminders/routine/vault/wellness under a
  single "My day" surface so the elder sees ~3 tabs. Left v1 tabs intact for now.
- Assistant screen (`app/(patient)/assistant.tsx`): calls the Edge Function via
  `lib/assistant.ts` (supabase.functions.invoke — NO api key client-side), speaks
  replies with expo-speech, renders TIER UI from the server's `tier` (never
  re-derived): tier1 → "Call 911" FIRST then top emergency contact (by priority);
  tier2 → warning + "Call <family> now", offers NO transaction help; tier3/4 →
  calm, optional "Send <name> a note". Uses accessibilityLiveRegion assertive for
  tier1/2, polite for the thinking indicator.
- Profile flow: `app/(patient)/profile.tsx` overview = progress % + one card per
  section with empty/partial/complete state (drives the "which sections are
  empty" gap UI). Editor is a root-stack sibling `app/profile-section.tsx`
  (param `section`) — reached in exactly 2 levels from home. Covers all 6
  sections; identity/interests/preferences are free-text/CSV, people/practical use
  repeatable rows, practical enforces "doctor name + specialty only" copy and
  priority-ordered emergency contacts. Saving recomputes section_status and writes
  a `profile_edits` row (attribution) via `hooks/v2.ts:useSaveSection`.
- VOICE INPUT: interim path is the iOS keyboard dictation mic (works on every
  free-text field today). The large in-app MicButton currently just stops TTS and
  surfaces the keyboard; true on-device STT (expo-av record → transcribe endpoint)
  is a TODO. Spoken OUTPUT is fully working via expo-speech.
- DEP ADDED: `expo-speech@~14.0.7` in mobile/package.json. `mobile/` has no
  node_modules in this container, so `npm install` + `npm run typecheck` are
  PENDING — a handoff agent should run them. New v2 tables aren't in the generated
  `database.types.ts`; `hooks/v2.ts` casts through an untyped handle and
  `lib/v2-types.ts` holds hand-written types until types are regenerated.
- suggested_action 'send_message' shows a "Send X a note" button but the compose/
  confirm sheet is a TODO (elder must confirm before anything sends) — wire in a
  later pass; the DB insert to `messages` is intentionally client-driven.
- Files touched: mobile/lib/{a11y.ts,v2-types.ts,assistant.ts}, mobile/hooks/v2.ts,
  mobile/components/big-ui.tsx, mobile/app/(patient)/{assistant,profile}.tsx,
  mobile/app/profile-section.tsx, mobile/app/(patient)/_layout.tsx,
  mobile/app/_layout.tsx, mobile/app/index.tsx, mobile/package.json
- State: done (authored; install/typecheck pending in-container)
- Next: Step 4 — Next.js web client: same assistant + profile + tier UI, calling
  the same Edge Function, WCAG AAA, keyboard-navigable, usable at 200% zoom.

## [2026-08-16T02:15Z] Step 4 — Next.js web client
- Decision: Reused the existing web design system (Tailwind tokens bg-base/
  text-label/elev-*/tint-*, Button/Input/Textarea/Field) rather than a parallel
  layer — v2 accessibility on web = larger type classes (text-xl≈20px body,
  text-3xl headings), size="lg" buttons (min-h-14), and the app already ships a
  skip-link + aria wiring. rem-based Tailwind => 200% browser zoom works.
- Decision: Web gets REAL voice input via the Web Speech API
  (SpeechRecognition/webkitSpeechRecognition) — better than the mobile interim.
  `lib/assistant-client.ts` exposes askAssistant() (functions.invoke, NO key
  client-side), speak()/stopSpeaking() (SpeechSynthesis), and
  startDictation()/isVoiceInputSupported(). Mic button hidden when unsupported.
- Assistant: `components/assistant/assistant-view.tsx` (client) + server page
  `app/(app)/assistant/page.tsx` (requirePatient). Tier UI renders from the
  server `tier` only: tier1 → role=alert + "Call 911" (tel:911) FIRST then top
  emergency contact; tier2 → scam warning + "Call <family> now", NO transaction
  help; tier3/4 → optional "Send <name> a note". Fix: tel: actions are styled
  <a> (CallLink), never a <button> nested in an <a>.
- Profile: `components/profile/profile-view.tsx` overview (progressbar aria +
  per-section empty/partial/complete) → `app/(app)/profile/page.tsx`; editor
  `components/profile/section-editor.tsx` → dynamic route
  `app/(app)/profile/[section]/page.tsx` (validates section, 404s otherwise).
  Two levels from home. Shares sectionState/overallProgress from lib/v2-types.ts.
- Hooks: `hooks/use-assistant-v2.ts` (useAssistant, useProfileV2, useSaveSection)
  mirror the mobile hooks; same untyped-cast approach for the v2 tables until
  types/database.ts is regenerated. saveSection recomputes section_status +
  writes profile_edits (attribution).
- Nav: `components/layout/nav-items.ts` — added Assistant (first) + Profile to
  PATIENT_TABS. Same IA note as mobile (now 7 tabs; consolidate later). Existing
  TabBar already enforces min-h-16 targets + aria-current.
- SHARED-LOGIC CHECK: both clients now call the same `assistant` Edge Function
  and the same tables with identical section shapes (lib/v2-types.ts mirrors
  mobile/lib/v2-types.ts). No assistant/tier logic duplicated — only thin UI.
- PENDING: web has no node_modules in this container → `npm install` +
  `npm run typecheck`/`next lint` not run here. Manually reviewed; fixed the
  anchor/button nesting. Verified all tint-* tokens exist in tailwind.config.ts.
- Files touched: lib/v2-types.ts, lib/assistant-client.ts,
  hooks/use-assistant-v2.ts, components/assistant/assistant-view.tsx,
  components/profile/{profile-view,section-editor}.tsx,
  app/(app)/assistant/page.tsx, app/(app)/profile/page.tsx,
  app/(app)/profile/[section]/page.tsx, components/layout/nav-items.ts
- State: done (authored; install/typecheck pending in-container)
- Next: Step 5 — family dashboard: escalation log (read tier1/tier2
  escalation_events with timestamp + trigger, acknowledge action) on the
  caregiver side, and profile gap-filling (caregiver opens the elder's profile,
  sees empty sections, fills them — RLS + profile_edits already support this).
