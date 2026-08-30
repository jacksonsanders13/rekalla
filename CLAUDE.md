# Rekalla

Snap a photo of a paper calendar, appointment card or bill. Claude reads the dates,
the person confirms, and it lands on an in-app calendar that reminds them. Built for
people who live on paper, older adults especially.

## The two deploy targets (read this before touching anything web)

This repo ships **two separate Vercel projects**:

| Path | What it is | Serves |
|---|---|---|
| repo root | Next.js 15 app (App Router) | the product itself |
| `landing/` | standalone static site, own `vercel.json` | rekalla.app marketing page |

They are not the same site. "Update the landing page" almost always means
`landing/index.html`, not `app/page.tsx`. The root app also has a landing at `/`, but
signed-in users are redirected to `/home` by the middleware, so only signed-out
visitors ever see it.

`landing/copy-deck.md` holds the marketing copy this page was built from.

## Layout

- `app/`, `components/`, `hooks/`, `lib/` — the Next.js web app
- `mobile/` — Expo / React Native, expo-router
- `supabase/functions/scan`, `supabase/functions/assistant` — Edge Functions
- `supabase/migrations/` — schema
- `landing/` — the marketing site (see above)

## Hard product constraints

- **Not medical.** No medical advice, no prescriptions or medication lists. The scan
  Edge Function returns `doc_type: "other"` with no items for anything medical, and
  the App Store position depends on this. Do not soften it.
- **Single user.** No caregivers, no shared accounts, no family dashboard. v2 had all
  three; the screens still exist under `mobile/app/(patient)/` (wellness, routine,
  vault, my-day, summary) and `app/(app)/`, unreachable from the nav. Leave them
  alone, and never reintroduce that framing in copy.
- **The API key never reaches a client.** Claude is called only from Edge Functions,
  where `ANTHROPIC_API_KEY` is a Supabase secret.

## Writing

- Rekalla is a character: a pink cartoon brain who speaks as himself. "He reads the
  dates", not "AI-powered extraction".
- **No em-dash asides.** They were stripped from every live screen on purpose. Use a
  comma, a full stop, or restructure.
- Plain and warm. No urgency tactics, no scarcity, no countdowns. This audience is
  targeted by scams and reads pressure as a red flag.
- Never invent testimonials, review counts or usage stats.

## Design

- iOS dark tokens, identical on both platforms: base `#000`, elev `#1c1c1e` /
  `#2c2c2e` / `#3a3a3c`, labels `#fff` / `#d1d1d6` / `#8e8e93` / `#636366`, accent
  `#0a84ff`.
- Quicksand throughout. Web: `next/font` in `app/layout.tsx`. Mobile: React Native
  resolves faces by **exact family name**, so weight lives in the name
  (`Quicksand_600SemiBold`), set in `mobile/lib/theme.ts` and loaded in
  `mobile/app/_layout.tsx`.
- The mascot is `components/ui/rekalla-avatar.tsx` and
  `mobile/components/rekalla-avatar.tsx`. He is drawn as one half mirrored by a
  transform, so edit `LEFT_FOLDS` only. Keep the two files in step.
- No gradients, no coloured glows, no font weights above 700.

## Gotchas that have cost time

- **Tailwind config changes need a dev server restart.** `next dev` reads
  `tailwind.config.ts` once at boot. Editing tokens and reloading shows the old values.
- **Killing `next dev` can leave the port held**, and the restart silently moves to
  3001 while you keep testing the stale server on 3000. Check the startup output.
- **Expo Go can't do in-app purchase**, and font package changes need
  `npx expo start -c` to clear the Metro cache.
- `est_cost_micros` in `20260820000000_assistant_usage.sql` prices Sonnet at $3/$15
  per million. It is $2/$10, so that column overstates spend by ~50%.
- `landing/privacy/` and `landing/terms/` still describe v2 (caregivers, wellness, the
  Memory Vault). They are linked from the App Store listing and need rewriting.

## Checks

```bash
npx tsc --noEmit          # web, from the repo root
cd mobile && npx tsc --noEmit
npx next lint --dir app --dir components
```

Pre-existing lint noise: `no-explicit-any` in `components/profile/section-*.tsx`, and
an unused `data` in `app/(auth)/login/login-form.tsx`. Not yours.

## Working style

- Small, typechecked commits.
- **Never add AI or Claude attribution to commits or PRs.** No `Co-Authored-By`, no
  "Generated with".
- I run the terminal commands: `npx expo start`, `eas build`, `supabase functions
  deploy`. Give exact steps, one at a time.
