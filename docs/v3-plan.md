# Rekalla v3 — build plan

Written 5 September 2026, at the end of the session that pushed `v3-recall`.
Read this first, then `CLAUDE.md` for the rules that do not bend.

---

## Toolchain

Expo **SDK 57** — React Native 0.86.3, React 19.2.3, TypeScript 6.0.3. Upgraded
from SDK 54 because Expo Go only supports the current SDK, so anything older
cannot be opened on a phone at all.

Two things that upgrade taught, both worth keeping:

- `npx expo install --fix` cannot cross three majors in place. It half-upgrades
  `@expo/cli` and then cannot find its own modules. Pin every package from
  `node_modules/expo/bundledNativeModules.json`, delete `node_modules` and the
  lockfile, and install clean.
- TypeScript 6 no longer includes every `@types` package automatically, so
  `types: ["jest"]` had to be named in `tsconfig.json`.

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

### M1 — Dark theme — DONE

Dark is the app's home state; light is a setting on `LocalUser.theme`, synced
with the account. Colour is now `useTheme()` rather than a module constant, and
the static `colors` export is gone on purpose — it was the one way a screen
could silently pin itself to a single palette.

The three module-scope colour tables (button tones, option states, node tones)
became functions of the palette. `contrast.test.ts` holds both themes to 7:1.

Light is not decoration. Plenty of older eyes, cataracts especially, read dark
text on a light ground more easily than the reverse, so the choice belongs to
the person using it.

### M2 — The onboarding, rebuilt — DONE

Route order is now `welcome → recall → who → goal → explain → first-item →
practice → more → reminder → join → home`, with a progress bar across the four
questions and a Continue that stays dead until something is chosen.

`recall` drives behaviour rather than collecting an opinion: the first thing
picked decides which template `first-item` fills in, `explain` names it, and
`more` offers the next unmet choice by name. Adding from the middle of setup
carries `after=setup` so the reminder and the offer to save are not skipped.

Built without hearts, timed rounds or a resetting streak. That question was
put twice and never answered; the brief forbids all three, so the brief won.
Reopen it deliberately if it should change.

`setup/person.tsx` became `setup/first-item.tsx`, since it is no longer always
a person.

### M3 — How it feels — MOSTLY DONE

Haptics are in, via `lib/design/feedback.ts`. Two signals and a deliberate
absence: a neutral tap acknowledges the choice, a celebratory one follows a
correct answer, and **nothing at all fires on a wrong one**. A buzz is a
judgement, and this app does not pass judgement on somebody for not recalling
the thing they came here because they cannot recall.

On by default, switchable in Settings, stored on `LocalUser.hapticsOn` and
carried in the migration. The correct option also lifts on a spring, which
Reduce Motion drops with no loss because the wash and the words already say it.

`react-native-reanimated` and `moti` were **not** added. React Native's own
`Animated` already does these springs on the native driver, and the difference
did not justify two dependencies in a tree that took nine builds to stabilise.
Revisit only if something genuinely needs gesture-driven animation.

**Still open: sound.** `LocalUser.soundOn` exists and nothing reads it, because
a confirming chime needs an actual audio file and that is a decision to be
heard, not guessed. Kenney's UI pack (CC0) is the place to look. Pick one, drop
it in `assets/`, and wiring it through `expo-audio` is a small job.

### M4 — The accessibility work — DONE, bar the device pass

Two halves, because they catch different things.

`scripts/check-a11y.mjs` reads source and fails the build on three absences:
anything tappable with no label, an image neither labelled nor deliberately
hidden, and any `fontSize` literal below the 20pt floor. No dependency, and it
is in `npm run check`.

`__tests__/accessibility.test.tsx` renders the components inside the providers
at the largest in-app text size and asserts what VoiceOver would hear: that
every control introduces itself, that a chosen row reports itself as checked
rather than only being coloured, that the option somebody tapped by mistake is
never described as wrong, and that text scales past the floor rather than
being capped. It runs in both palettes.

**What these cannot prove:** clipping. There is no layout engine in the test
renderer, so a box that would overflow on a real phone renders happily here.
The device pass with VoiceOver actually on is still outstanding, and it is the
only thing that will catch it.

Versions matter here: `jest-expo@57` targets React Native 0.86 and this is SDK
54, so it is pinned to `~54.0.0` with `jest@29` and `react-test-renderer@19.1.0`.
`expo-font` was checked after every install and remains a single 14.0.12.

`npm run check` now takes about two minutes, most of it jest.

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
