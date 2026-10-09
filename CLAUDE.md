# Rekalla

A reminder app for an older adult and the person who looks after them. The patient
sees their reminders, daily routine, photo vault and wellness check-ins. Their loved
one connects with a six-character code and manages all of it for them, from the web
dashboard or the phone.

## Read this before you go looking for missing features

The repo spent a while as two other products, and both are still in git:

| | What it was | Where |
|---|---|---|
| **v2** | reframed as a single-user AI chat assistant, caregivers stripped out | tag `v3-scan-archive` |
| **v3** | photograph a paper calendar, Claude reads the dates | tag `v3-scan-archive` |

Both were abandoned and reverted on 2026-09-15. `main` is the original app again,
continuing from `c8dc1b2`. The 78 commits of v2 and v3 work are preserved on branch
`claude/rekalla-v2-assistant-d2u9fs` and tag `v3-scan-archive`, and nothing was
force-pushed.

So: there is no scan feature, no chat assistant, no Edge Functions, and no Claude API
call anywhere in this codebase. If a doc or a comment mentions one, it is a leftover
and should be fixed. Do not reintroduce any of it without being asked.

The one thing kept from that period is the mascot. See Design.

## The two deploy targets (read this before touching anything web)

This repo ships **two separate Vercel projects**:

| Path | What it is | Serves |
|---|---|---|
| repo root | Next.js 15 app (App Router) | the product itself |
| `landing/` | standalone static site, own `vercel.json` | rekalla.app marketing page |

They are not the same site. "Update the landing page" almost always means
`landing/index.html`, not `app/page.tsx`.

## Layout

- `app/`, `components/`, `hooks/`, `lib/` — the Next.js web app
- `mobile/` — Expo SDK 54 / React Native, expo-router
- `supabase/migrations/` — schema. No Edge Functions.
- `landing/` — the marketing site, plus `privacy/`, `terms/`, `support/`

Both clients talk to Supabase directly. Access control is RLS, not application code,
so a permissions change means a migration.

## Hard product constraints

- **Not medical.** No medical advice, no prescriptions, no medication lists. The
  App Store position and the whole of `COMPLIANCE_REVIEW.md` depend on this. It is
  framed around age-related forgetfulness, deliberately. Do not soften it.
- **Two account types**, `patient` and `caregiver`, on `profiles.account_type`. A
  patient reads out a connect code; the caregiver enters it; **the patient approves**.
  Caregivers cannot self-approve, and that is enforced in RLS, not in the UI.
- **Self-managed patients** are a patient with no caregiver, who can write their own
  reminders, routine and vault. That gate is the reason the write policies look the
  way they do.
- Vault photos are private, served through signed URLs. Never make that bucket public.

## Design

- iOS dark tokens, identical on both platforms: base `#000`, elev `#1c1c1e` /
  `#2c2c2e` / `#3a3a3c`, labels `#fff` / `#d1d1d6` / `#8e8e93` / `#636366`.
  System tints for accents. Web: `tailwind.config.ts`. Mobile: `mobile/lib/theme.ts`.
- **System font on both** (SF Pro on Apple devices), and a type scale sized larger
  than default for older eyes. There is no custom font package, and adding one is how
  the last two rewrites started.
- The mascot is Rekalla himself, a pink cartoon brain: `components/ui/rekalla-avatar.tsx`
  and `mobile/components/rekalla-avatar.tsx`. He is drawn as one half mirrored by a
  transform, so edit `LEFT_FOLDS` only and keep the two files in step. Every app icon
  is redrawn from that same geometry by `node scripts/make-icons.mjs`. He is stemless
  everywhere; there is no second version of him.
- No gradients, no coloured glows.

## Writing

- Plain and warm. No urgency tactics, no scarcity, no countdowns. This audience is
  targeted by scams and reads pressure as a red flag.
- Never invent testimonials, review counts or usage stats.
- Mobile ships **English and Spanish**, in `mobile/lib/i18n.tsx`. English is the source
  of truth and missing Spanish keys fall back to it. New user-facing mobile string
  means a new key in both dictionaries, not a literal in a component. The web app is
  English only.

## Gotchas that have cost time

- **`HANDOFF.md` is the real institutional memory.** Three separate iOS build bugs,
  each masking the next, with the exact commands to re-verify a binary. Read it before
  touching anything EAS.
- **`HANDOFF.md` stops at build 17, and three more builds shipped after it.** Builds
  18 (1.0.0), 19 (2.0.0) and 20 (3.0.0) were all built and successfully submitted to
  App Store Connect, build 20 from `2c52dfa`, the scan product. So the version floor
  is **3.0.0**, not the 1.0.0 the handoff implies, and TestFlight currently holds the
  abandoned scan app. `mobile/app.json` is now `3.1.0` for the next submission.
  Never take the build history from `HANDOFF.md`. Run
  `eas build:list` and `eas submit:list` instead, which are authoritative.
- **Tailwind config changes need a dev server restart.** `next dev` reads
  `tailwind.config.ts` once at boot. Editing tokens and reloading shows the old values.
- **Killing `next dev` can leave the port held**, and the restart silently moves to
  3001 while you keep testing the stale server on 3000. Check the startup output.
- **Never paste `eas env:list` output back in as a value.** It is masked with U+2022
  bullets that look right and are the right length. This shipped a broken anon key to
  production once, and the bullets are unencodable in an HTTP header, so the symptom
  is "No API key found in request". `HANDOFF.md` has the check.
- **Expo Go can't do in-app purchase**, and dependency changes need
  `npx expo start -c` to clear the Metro cache.
- The live database still carries the v2 and v3 tables (`scans`, `chat_messages`,
  `assistant_usage`, `personalization_profiles`, and friends) and some extra
  owner-write RLS policies from v3. They are additive and dormant, the original
  policies are all still in place, so the app runs correctly against them. They are
  left there on purpose for now.
- `mobile/assets/android-icon-{background,foreground,monochrome}.png` are orphans.
  `mobile/app.json` uses `icon.png` for the Android adaptive foreground.

## Checks

```bash
npx tsc --noEmit          # web, from the repo root
cd mobile && npx tsc --noEmit
npx next lint --dir app --dir components
```

All three are clean. Keep them that way.

## Working style

- Small, typechecked commits.
- **Never add AI or Claude attribution to commits or PRs.** No `Co-Authored-By`, no
  "Generated with".
- I run the terminal commands: `npx expo start`, `eas build`, `supabase db push`.
  Give exact steps, one at a time.
