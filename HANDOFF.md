# Handoff — where things stand

Working notes so any session (or a fresh Claude Code in VS Code) can pick up
without re-deriving context. Update this as things change.

## Current goal
Get the Rekalla **iOS app** (in `mobile/`, Expo SDK 54) onto **TestFlight** via EAS.

## The saga so far
- EAS build + submit to App Store Connect worked; app installed via TestFlight.
- **It crashed on launch.** Not the env vars — the crash log showed a native
  **Hermes `Object.defineProperty` → `HiddenClass::addProperty` segfault** on
  the `com.facebook.react.runtime.JavaScript` thread (New Architecture / bridgeless).
- **Root cause found:** the Expo app had **no `babel.config.js` and no
  `babel-preset-expo`**. Without the preset the bundle is mis-transpiled for
  release-mode Hermes (works in dev/web, segfaults in the release build).

## What's already fixed (committed to `main`)
- `mobile/babel.config.js` added (`presets: ["babel-preset-expo"]`).
- `mobile/app.json` has the EAS `projectId`
  (`59c872ad-d2b9-4413-a884-1a67b75e1d13`) under `extra.eas`.
- Supabase `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
  in **EAS → production** environment (visibility: plain text). Also mirrored in
  a local `mobile/.env` (that file is gitignored — recreate it on a new machine).

## Not yet committed
- `babel-preset-expo` was installed locally via `npx expo install babel-preset-expo`,
  which changed `mobile/package.json` + `mobile/package-lock.json`. **These still
  need to be committed** so a fresh clone has the dependency. (On a fresh clone,
  just run `npx expo install babel-preset-expo` again — it's idempotent.)

## Next steps
1. From `mobile/`, rebuild and resubmit:
   ```
   eas build --platform ios --profile production
   eas submit --platform ios --profile production
   ```
2. In TestFlight on the phone, make sure the shown build is the **newest**
   (build number will have auto-incremented), tap **Update**, and launch.
3. Confirm it opens to the **sign-in screen** instead of crashing.
4. Commit the `package.json` / `package-lock.json` changes for `babel-preset-expo`.

## New-machine setup
1. `git clone https://github.com/jacksonsanders13/rekalla.git && cd rekalla`
2. `npm install -g eas-cli && eas login`  (Expo account: `jacksonsanders13`)
3. `cd mobile && npm install && npx expo install babel-preset-expo`
4. Recreate `mobile/.env` with the two `EXPO_PUBLIC_SUPABASE_*` values.
5. `eas build:list` to see whether a build is already waiting or a new one is needed.

## Known follow-ups (from an earlier code review — not blocking TestFlight)
- Caregiver "missed-reminder" alerts don't actually deliver (mock providers, no
  cron, nothing queues). Don't promise that feature to testers yet.
- `vault-photos` storage bucket is public-read — should be private + signed URLs.
- A patient with no caregiver can't create reminders/routine/vault (RLS is
  caregiver-write-only) — confirm that's intended before wider testing.

## Conventions (important)
- Commit as **Jackson Sanders <madmanjack8@gmail.com>**, author + committer.
- **No AI attribution** anywhere in commit messages (no "Co-authored-by",
  no "Generated with…", no model names). Verify: `git log -1 --format=%B | grep -ci claude` → must be `0`.
