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
