# Rekalla v3 — build plan

Written 5 September 2026, at the end of the session that pushed `v3-recall`.
Read this first, then `CLAUDE.md` for the rules that do not bend.

---

## Where things actually stand

**Working and pushed** (`v3-recall`, commits `3a9730c` and `722cb7f`):

- Scheduling: interval ladder 1/2/4/9/21/42/90 days, miss drops to the last rung
  cleared, introduction lands a new item on day one, expanding in-session
  repeats at 1/3/6 cards. Pure modules in `mobile/lib/practice/`, 45 passing
  unit tests via Node's own runner.
- Errorless answering, the family tree, the Home path, guided add flow,
  sign-up with a Supabase migration, local-first storage, one daily reminder.
- `npm run check` is green: copy guard, typecheck, tests.
- `npx expo export --platform web` produces a bundle.

**Known broken or missing:**

| Thing | State |
|---|---|
| Dark theme | Only in the browser prototype. App is still light. |
| Duolingo-shaped onboarding | Only in the prototype. App still uses the old flow. |
| Accessibility snapshot tests | Not written. This is an unmet item from the brief. |
| Sign in with Apple | Not built. Needs `expo-apple-authentication` + a dev build. |
| Bundle identifier | Still `com.jacksonsanders.rekalla`, shared with the older app. |
| Supabase migration | Written, **not yet run**. |
| `/design-refs/` | Still does not exist. |
| Legacy screens | Still in `mobile/app/`, unreachable, to delete after TestFlight. |

**Two gotchas that cost time once already — do not rediscover them:**

1. **Expo web fails on a half-installed `caniuse-lite`.** Symptom is
   `SyntaxError: Cannot find module './browsers'` during bundling. Babel
   resolves web targets through `browserslist` → `caniuse-lite`; native never
   touches it, so iOS works and only web breaks. Fix:
   `cd mobile && rm -rf node_modules/caniuse-lite && npm install`.
2. **`expo-font` must stay a single top-level 14.0.12.** `@expo/vector-icons`
   declares it as an unbounded peer, and a hoisted SDK-56 copy crashed
   TestFlight builds 2 through 5. After any install, check with
   `find mobile/node_modules -maxdepth 4 -name expo-font -type d` — one result.

---

## One decision blocking the design work

Duolingo's loop runs on **hearts you lose for wrong answers, timed rounds, and
a streak that resets to zero.** They are load-bearing to how it feels, and they
are the three things the brief singled out as the opposite of what this app is
for — it is built for people who will get answers wrong *because* recall is
what they are struggling with, and who miss days for hospital appointments.

None of them are implemented. Answer this before M2 starts.

---

## Milestones, in order

Each one is separately verifiable. Do not start the next until `npm run check`
is green and the change has been looked at on a device or in the browser.

### M0 — Guard rails — DONE

Built and pushed. `lib/design/contrast.ts` is the WCAG formula, no
dependency; `lib/design/palettes.ts` holds both themes plus the list of pairs
that must hold up; `lib/design/contrast.test.ts` fails the build on any pair
under 7:1. It is in `npm run check`.

It earned itself immediately: `focus` on a raised surface in the dark palette
measured **6.97:1**, which no eye would have caught. The blue is now `#4CBEFF`.
`tokens.ts` re-exports `palettes.light`, so M1 is close to a one-line swap.

Still to answer: the hearts/timers/streak question above.

### M1 — Dark theme (one to two days)

Dark becomes the app's home state, light stays as a setting.

Restructure `mobile/lib/design/tokens.ts` from a flat `colors` object into two
palettes behind a `useTheme()` hook, with the choice stored on `LocalUser`
(there is already a `textScale` field to follow as a pattern). Every screen
reads tokens already, so this is mostly mechanical.

**Use these values — they are validated at 7:1 and already proven in the
prototype**, so do not re-derive them:

```
bg        #12181C     surface #1B2429     raised  #232E34     line #35434B
ink       #F2F7F9     16.2:1 on bg
inkSoft   #A9BAC3      8.9:1 on bg
primary   #7DD53F     with primaryInk #0E1417 → 9.9:1
primaryEdge #57A324
good      #16311E  /  goodInk #B7EFA0      10.7:1   (correct)
tell      #33280E  /  tellInk #FFD98A      10.7:1   (the answer, after a miss)
focus     #4CB4FF                           7.9:1
```

The bright green carries **dark** text, never white. White on a saturated green
is about 2.5:1 — it looks right in a mockup and vanishes for the person holding
the phone. There is deliberately no red in either palette.

### M2 — The onboarding, rebuilt (two to three days)

Route order becomes: `welcome → recall → who → goal → promise → person →
practice → more → reminder → join → home`.

- **`recall`** is the important one and the reason for the whole change:
  *"What would you like to be able to recall?"* as a multi-select over the four
  categories, each with an icon and a one-line blurb. Store on
  `LocalUser.wants` (the field already exists). It must actually drive
  behaviour — the first template offered is the first thing they picked, and
  the screen after their first session offers the next one by name. A question
  that changes nothing is a survey, and people can tell.
- **`goal`** sets `dailyGoalCards`: Gentle 5 / Steady 10 / Keen 15 / Serious 20.
- New components: a top bar (close, then a continuous rounded progress bar), a
  selectable option row with an icon slot and a tick, and a pinned Continue
  that stays disabled until something is chosen.
- Keep the per-field Rekalla explanations already in `templates.ts`.

The working prototype is the reference — it has all of this and the exact copy:
https://claude.ai/code/artifact/a5a65216-a7be-437c-a1c5-490c4243e673

### M3 — How it feels (one to two days)

The chunky press state and colour washes are done. What is missing is the
spring, the tap you can feel, and the sound.

### M4 — The unmet accessibility work (two days)

- Snapshot tests rendering every screen at the largest accessibility text size,
  asserting nothing clips and every control has a label. This is an explicit
  item from the brief that has never been done.
- A real VoiceOver pass on a device, screen by screen.

### M5 — Ship (depends on Apple)

1. Decide the bundle identifier. It is still shared with the app already in
   submission; building from this branch would push into that app's TestFlight.
   A new id means a new App Store Connect record and `eas init`.
2. Run `supabase/migrations/20260903010000_practice.sql` **through the SQL
   editor, not `supabase db push`** — the CLI's migration history is out of step
   with production, and a push would try to re-run migrations that are not
   re-runnable. The file is safe to run twice.
3. TestFlight. Then, and only then, delete the legacy screens from `mobile/app/`
   and the retired tables.

---

## Free and open-source resources worth using

Everything here is free for commercial use. Licences noted; check them again at
the time, not from this list.

**Typefaces** — all SIL Open Font License, all on Google Fonts, all with a
ready-made `@expo-google-fonts/*` package:

- **Quicksand** — what the app uses now. Rounded geometric, on-brand. Keep it
  unless there is a reason not to.
- **Nunito** / **Nunito Sans** — rounded, slightly warmer, very legible at size.
  The closest free thing to the reference app's feel.
- **Baloo 2**, **Fredoka** — heavier and more playful if M1 wants more weight.

Duolingo's own face is proprietary. Do not try to match it.

**Icons** — the option rows in M2 need them:

- **Lucide** (ISC) — `lucide-react-native`. Clean, consistent, renders through
  `react-native-svg`, which is already installed. The default recommendation.
- **Phosphor** (MIT) — `phosphor-react-native`. More weights, slightly softer.
- `@expo/vector-icons` is already a dependency if something is needed quickly.

Note the brief said "SF Symbols or original artwork". SF Symbols carry Apple
licence restrictions and do not exist off-platform, so Lucide is the better
answer — but flag the swap rather than making it silently.

**Motion** — for the spring on a correct answer:

- **react-native-reanimated** (MIT) — bundled in Expo Go, no dev build needed.
- **moti** (MIT) — a small declarative layer on top. A bounce is two props.
- **lottie-react-native** (Apache 2.0) if a celebration animation is wanted;
  LottieFiles has free CC-licensed files. Heavier — only if it earns its place.

**Feel and sound:**

- **expo-haptics** (MIT, part of Expo) — the tap on a correct answer. Cheap,
  and a large part of why the reference app feels good.
- **expo-audio** (Expo's replacement for expo-av) for a confirming chime.
- **Kenney UI audio** (kenney.nl, CC0, genuinely public domain) — the best free
  interface sounds available. **freesound.org** filtered to CC0 is the fallback.
- Sound stays **off by default** with a toggle; `LocalUser.soundOn` exists.

**Illustration** — mostly not needed, because the user's own photographs are
the illustration, and the Rekalla brain mascot is original and already ours:

- **unDraw** (MIT-style, free) — recolourable to any palette.
- **Open Peeps** (CC0) and **Humaaans** (CC BY 4.0) — hand-drawn people.

**Testing:**

- **jest-expo** + **@testing-library/react-native** (both MIT) — what M4 needs.
  First real test-runner dependency in `mobile/`; add it deliberately and check
  `expo-font` afterwards.
- Node's built-in runner already covers the pure logic. Leave that as it is.

**Reference, free to read:** WCAG 2.2 (w3.org), the WAI guidance on cognitive
accessibility, Apple's Human Interface Guidelines on accessibility, and
Material Design 3's accessibility pages.

---

## How to verify anything

```bash
cd mobile
npm run check                       # copy guard, typecheck, 45 unit tests
npx expo start -c                   # the -c matters, the router tree changed
npx expo export --platform web      # catches web-only bundling breakage
```

If web fails, it is the `caniuse-lite` problem above, not your code.
