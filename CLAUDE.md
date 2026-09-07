# Rekalla

**On branch `v3-recall`, the iOS app in `mobile/` is a spaced retrieval practice
app.** Someone practises recalling their own people, routines, places and facts
in short daily sessions at widening intervals. `main` still holds the older
paper-calendar product; it is untouched by this branch.

Read `docs/v3-plan.md` before starting work. It has the current state, what is
left, and the order to do it in.

## Rules that do not bend

These came from the product brief and are not stylistic preferences. Do not
relax any of them without asking the person you are working with, directly.

**No claims about memory.** Nowhere — app, listing, notifications, code
comments — may we say or imply that Rekalla prevents, delays or slows anything,
improves memory generally, or trains a brain. The FTC fined Lumosity $2M for
exactly that. Every claim must be about the specific thing being practised.
Enforced mechanically: `cd mobile && npm run check:copy`.

**Never punish a wrong answer.** Show the right answer warmly, immediately, and
ask the same question again so every card ends on a correct answer. No red
anywhere in the palette. No score, no accuracy figure, no counting of misses in
the UI ever. The schedule drops back to the last interval actually cleared, not
to zero.

**Accessibility floor.** Body text from 20pt, primary actions from 24pt, tap
targets from 60×60pt, every text/background pair at 7:1 or better, no time
limits anywhere, Reduce Motion respected, a visible Back on every screen, full
VoiceOver labelling.

**No model calls in the app.** Cards are template-driven and deterministic so a
session works offline and nothing can invent a fact about somebody's family.
`CardGenerator` in `mobile/lib/practice/card-generator.ts` is the seam if that
ever changes.

**An account is a backup and nothing else.** Setup runs to completion,
including the first practice session, with no account at all.

## Working here

- `cd mobile && npm run check` — copy guard, accessibility guard, typecheck, 51
  logic tests, then 11 rendering tests. Takes about two minutes, most of it
  jest. Run it before every commit.
- To look at it in a browser: `npx expo export --platform web --output-dir
  /tmp/rekalla-web` then serve that folder.
- **This box is small: 2.7 GB RAM, no swap (Crostini forbids `swapon`), and the
  disk fills up.** Both symptoms look like the same thing — a process dies with
  no useful message. Check `df -h` first, not just `free -m`: an npm install
  died three times here and the real cause was 1.3 GB of disk left. `npm cache
  clean --force` reclaims a couple of gigabytes. Install with
  `--maxsockets 3` and run jest with `--runInBand`.
- The app targets **Expo SDK 57** (React Native 0.86, React 19.2, TypeScript 6).
  Expo Go only ever supports the current SDK, so the SDK has to track it.
- Scheduling lives in `mobile/lib/practice/`. Those modules are pure — no React,
  no storage, no native imports — so Node runs them and their tests directly
  with no test runner dependency. Keep them that way.
- Screens from the earlier app are still in `mobile/app/` and are unreachable.
  Nothing routes to them. They go once this app is on TestFlight.
- Commit messages: explain why, not what. No AI attribution, no Co-Authored-By.
