# Handoff — where things stand

Working notes so any session (or a fresh Claude Code in VS Code) can pick up
without re-deriving context. Update this as things change.

## Current goal
Get the Rekalla **iOS app** (in `mobile/`, Expo SDK 54) onto **TestFlight** via EAS.

## The saga so far
There were **two independent bugs**, one masking the other. Build 6 fixed the
launch crash; build 7 fixes the sign-up failure that was hiding behind it.

### Bug 1 — launch crash (fixed in build 6)
- EAS build + submit to App Store Connect worked; app installed via TestFlight.
- **It crashed on launch** on every build (2, 3, 4 and 5), on the
  `com.facebook.react.runtime.JavaScript` thread (New Architecture / bridgeless).
- The missing `babel.config.js` was a **real but separate** problem — fixing it
  did not stop the crash. Build 5 shipped a valid Hermes bytecode bundle and
  still crashed.

#### Root cause: `expo-font` native module was never in the binary
`@expo/vector-icons` declares `expo-font` as a **peer dependency with an
unbounded range (`>=14.0.4`)**. npm auto-installed peers, so it hoisted
**`expo-font@57.0.0`** (an SDK 56-era release) to `mobile/node_modules/expo-font`,
while SDK 54's own `expo-font@14.0.12` got buried at
`node_modules/expo/node_modules/expo-font`. `expo-font` was never a direct
dependency of `mobile/package.json`, so nothing pinned it.

That state was baked into the committed `package-lock.json`, and EAS runs
`npm ci`, so **every** build got `expo-font@57.0.0`.

Consequences, all verified against the shipped build-5 IPA:
- Expo autolinking selected `expo-font@57.0.0`, whose podspec requires
  `:ios => '16.4'` (SDK 54's target is 15.1) and which ships prebuilt
  XCFrameworks SDK 54's autolinking doesn't consume.
- The shipped `Rekalla` binary contains **zero** `ExpoFontLoader` /
  `FontLoaderModule` / `FontUtilsModule` symbols — every other Expo module
  (ImagePicker, Notifications, Localization, …) is present.
- The shipped `main.jsbundle` **does** contain `requireNativeModule('ExpoFontLoader')`.

`expo-font/build/ExpoFontLoader.js` calls `requireNativeModule('ExpoFontLoader')`
at **module top level**, and `@expo/vector-icons/build/createIconSet.js` does
`import * as Font from 'expo-font'` at top level. `expo-router` itself imports
vector-icons, so this runs during bundle evaluation before anything renders.
Native module missing → throw during bundle load → in a release/bridgeless
build there is no LogBox, so the JS thread aborts and the app dies instantly.

`npx expo-doctor` run against the exact shipped dependency state says it outright:

```
✖ Check that required peer dependencies are installed
Missing peer dependency: expo-font
Required by: @expo/vector-icons
Your app may crash outside of Expo Go without this dependency.

✖ Check that no duplicate dependencies are installed
Found duplicates for expo-font:
  ├─ expo-font@57.0.0 (at: node_modules/expo-font)
  └─ expo-font@14.0.12 (at: node_modules/expo/node_modules/expo-font)
```

How to re-verify on any future build (no device needed):

```
curl -sL -o build.ipa "<Application Archive URL from eas build:list>"
unzip -q build.ipa && cd Payload/Rekalla.app
strings -a Rekalla    | grep -c FontLoaderModule   # must be > 0
strings -a main.jsbundle | grep -c ExpoFontLoader  # is 1
```

## What's already fixed (committed to `main`)
- `mobile/babel.config.js` added (`presets: ["babel-preset-expo"]`).
- `expo-font` pinned as a **direct** dependency (`~14.0.12`) so npm can no
  longer hoist a mismatched copy; lockfile deduped to a single 14.0.12.
  `expo-font` added to `app.json` `plugins`.
- `expo` bumped to `54.0.36`. `npx expo-doctor` is now **18/18 green** — it was
  3 checks failing on every build that shipped.
- `mobile/app.json` has the EAS `projectId`
  (`59c872ad-d2b9-4413-a884-1a67b75e1d13`) under `extra.eas`.
- Supabase `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
  in **EAS → production** environment (visibility: plain text). Also mirrored in
  a local `mobile/.env` (that file is gitignored — recreate it on a new machine
  using the values in "Environment values" below).
- The EAS `EXPO_PUBLIC_SUPABASE_ANON_KEY` value was **corrupted** and has been
  corrected — see Bug 2 below.

### Bug 2 — "No API key found in request" on sign-up (fixed in build 7)
Build 6 launched fine, then failed at account creation with Supabase's
**"No API key found in request"**.

The value stored in the EAS `production` environment for
`EXPO_PUBLIC_SUPABASE_ANON_KEY` was literally:

```
eyJhbGci••••••••••••••••••••••…   (8 ASCII chars + 200 × U+2022 BULLET, length 208)
```

Someone copy-pasted the **masked terminal output** of `eas env:list` back in as
the value. It is the right length and right prefix, so it looks correct in every
listing — and `eas env:list` re-masks it, which makes the corruption invisible.

Proof it shipped: the build-6 `main.jsbundle` contains that exact string at byte
offset 808518, stored as **UTF-16** (Hermes encodes any non-ASCII string as
UTF-16, which is why a plain `strings` scan finds nothing):

```
python3 -c "d=open('main.jsbundle','rb').read(); i=d.find('eyJhbGci'.encode('utf-16-le')); \
print(d[i:i+416].decode('utf-16-le'))"
```

At runtime supabase-js sets `apikey: "eyJhbGci•••…"`. U+2022 is not encodable in
an HTTP header (Latin-1 only), so the header is dropped — hence *No API key
found*, rather than *Invalid API key*.

The local `mobile/.env` was always correct, which is why dev and web worked. Fixed with:

```
eas env:update production --variable-name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --variable-environment production --value "<real key>" --visibility plaintext
```

**Never paste a value copied from `eas env:list` output.** Always take it from
`mobile/.env` or the "Environment values" block below. To verify a value really
round-tripped, pull it and compare hashes against `.env` — do not eyeball it:

```
eas env:pull production --path /tmp/eas.env
# then diff the sha256 of each value against mobile/.env
```

## Environment values
These are the **public** Supabase values — safe to keep here because the anon
key ships inside the app and is protected by RLS. **Never** add the Supabase
`service_role` (secret) key to this file or any client/repo.

Recreate `mobile/.env` with exactly:

```
EXPO_PUBLIC_SUPABASE_URL=https://mhahpfcjxnoelcthdsss.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oYWhwZmNqeG5vZWxjdGhkc3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODcyODQsImV4cCI6MjA5OTE2MzI4NH0.ev4eaDbr5JLZXR0aJVCLH1VGk1-riPwmaq3c0PUNV1c
```

- Supabase project ref: `mhahpfcjxnoelcthdsss`
- EAS project id: `59c872ad-d2b9-4413-a884-1a67b75e1d13`

## Build 6 — fix verified in the binary
Build 6 (`bf3013e6-97c6-4cf7-9bc5-034032b6e049`) was built from the fix and the
IPA was checked with the recipe above. The native module is now present:

| symbol             | build 5 (crashed) | build 6 (fix) |
|--------------------|-------------------|---------------|
| `FontLoaderModule` | 0                 | **3**         |
| `FontUtilsModule`  | 0                 | **3**         |
| `ExpoFont`         | 0                 | **16**        |
| `ExpoImagePicker`  | 41                | 41            |

Diffing the full native-module list between the two binaries: build 6 **gains**
exactly `FontLoaderModule` + `FontUtilsModule` and **loses nothing**; the `.app`
layout is otherwise identical. The thing that killed the app on launch is gone.

Build 6 was submitted on 2026-07-28
(submission `b30a598f-c2e2-4136-921d-8b05421df9b8`). It **launched** — proving
the fix — and then failed at sign-up, which is Bug 2 above.

## Build 7 — anon key verified in the bundle
Build 7 (`970275a0-5488-4381-adeb-5afaf76e29e2`), built after correcting the EAS
variable:

| check | result |
|---|---|
| exact anon key bytes in bundle | **offset 481912**, sha256 `98f00a774188` — identical to `mobile/.env` |
| Supabase URL inlined | offset 514123 |
| corrupted UTF-16 value | **gone** (`find` → `-1`) |
| longest run of `•` in bundle | **1** (124 scattered singles are legitimate UI text; the corruption was a run of 200) |
| `FontLoaderModule` in binary | **3** — build 6's crash fix still intact |

Both the `production` **and** `preview` EAS environments had the identical
corrupted value (sha `ec5272601f4f`); both are now fixed and verified ASCII and
hash-identical to `.env`. `development` has no variables (local `.env` covers it).

Careful when extracting strings from a Hermes bundle: it packs strings
contiguously with no delimiter, so a greedy regex runs straight off the end of
one string into the next. Search for **exact expected bytes**, don't regex-extract.

## Next steps
Build 7 was **submitted to App Store Connect** on 2026-07-28
(submission `9c22b8a1-2c0c-40dc-b9a4-0e289d0542a8`, ASC app id `6794918254`).
Apple processing takes ~5–10 min; you get an email when it's ready.

1. Wait for the processing email, then open
   https://appstoreconnect.apple.com/apps/6794918254/testflight/ios
2. In TestFlight on the phone, make sure the shown build is **build 7**,
   tap **Update**, and launch.
3. Create an account. It should reach the patient/caregiver home, not
   "No API key found in request".

If it crashes on launch, it is **not** the expo-font problem, and if sign-up
fails it is **not** the anon key — both are proven fixed in the build-7
artifact. Get the fresh crash log off the device (Settings → Privacy & Security
→ Analytics & Improvements → Analytics Data) and start from the new evidence,
not from this document.

Note: `eas submit --non-interactive` needs `ascAppId` in `eas.json`; it's now
set in the `submit.production.ios` profile.

## Guardrail
Run `npx expo-doctor` from `mobile/` before every production build. All three
failures it reported would have caught this before burning four builds. Treat
"Missing peer dependency" and "duplicate native module" as **build blockers**,
not warnings.

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
