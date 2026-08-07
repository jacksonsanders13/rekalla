# Handoff — where things stand

Working notes so any session (or a fresh Claude Code in VS Code) can pick up
without re-deriving context. Update this as things change.

## Current goal
Get the Rekalla **iOS app** (in `mobile/`, Expo SDK 54) onto **TestFlight** via EAS.

## The saga so far
There were **three independent bugs**, each masking the next. Build 6 fixed the
launch crash; build 7 fixed the sign-up failure hiding behind it; build 9 fixed
the stale checkout that kept all later feature work out of the binary entirely.

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

> **That snippet only finds a *corrupt* key — do not use it as the health
> check.** The key was UTF-16 precisely *because* the `•` made it non-ASCII.
> On a healthy build the key is plain ASCII and the UTF-16 search returns
> `-1`, which reads exactly like a failed check but is the all-clear. This
> cost time again on build 16. **Search ASCII first; a UTF-16 hit is the
> alarm.** And take the expected bytes from `.env` rather than extracting
> from the bundle — see the Hermes packing warning below:
>
> Run from `Payload/Rekalla.app` (`.env` is elsewhere, hence the absolute
> path — verified working on build 16):
>
> ```
> export ENVFILE=~/rekalla/rekalla/mobile/.env   # adjust to your checkout
> python3 -c "
> import re,os
> d=open('main.jsbundle','rb').read()
> k=re.search(r'EXPO_PUBLIC_SUPABASE_ANON_KEY\s*=\s*\"?([A-Za-z0-9_.\-]+)',
>             open(os.environ['ENVFILE']).read()).group(1)
> print('ascii  :', d.find(k.encode()))             # expect >= 0
> print('utf-16 :', d.find(k.encode('utf-16-le')))  # expect -1
> "
> ```

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

### Bug 3 — new features missing from TestFlight (fixed in build 9)
Builds kept shipping, but none of the work done after 2026-07-28 (self-managed
patient accounts, in-app legal links, the sign-up rewording) ever appeared in
the app.

**Root cause: the build machine's checkout was 11 commits behind `origin/main`.**
Feature work was committed and pushed from a different environment on Jul 30 –
Aug 1. This machine never pulled, so `eas build` uploaded the Jul 28 tree.
`git status` showed a clean working tree the whole time — clean means "matches
HEAD", *not* "matches the remote", which is why nothing looked wrong.

The branch had **diverged both ways**, which is the part that makes this
dangerous:

| | local `main` | `origin/main` |
|---|---|---|
| self-managed accounts, legal links, i18n | absent | present |
| `expo-font` pin + plugin (Bug 1 fix) | present | **absent** |
| `expo` version | `~54.0.36` | `54.0.35` |
| `ascAppId` in `eas.json` | present | **absent** |

So neither branch alone could produce a working build with the new features —
building from `origin/main` would have reintroduced the Bug 1 launch crash.
Fixed by merging (the two sides touched **disjoint files**, so it was clean)
and rebuilding as build 9.

EAS records the source commit, so this is detectable in seconds *before* a build
finishes — `eas build:list` prints a `Commit` field. Build 8's was
`4a52dd1` (the Jul 28 handoff commit); build 9's is `ebce71e` (the merge).
Confirmed in the binary: build 8's bundle still contained the **old** string
`"Someone sets up reminders for me."` and none of the new ones.

## Next steps
**Build 16** (`f84949d4-0572-46cb-a380-d42115a21761`, commit `7873e74`) was
**submitted to App Store Connect** on 2026-08-06
(submission `a196551e-ecc7-4395-80c4-1d3b88b5f182`, ASC app id `6794918254`).
Apple processing takes ~5–10 min; you get an email when it's ready.

1. Wait for the processing email, then open
   https://appstoreconnect.apple.com/apps/6794918254/testflight/ios
2. In TestFlight on the phone, make sure the shown build is **build 16**,
   tap **Update**, and launch.
3. Sign up and confirm the email OTP flow works (any code length is accepted
   now; the verify screen mentions the junk folder).
4. As a caregiver, enter the connect code of a **self-managed** patient — it
   must show "Sorry, the account you are attempting to connect to is currently
   self-managed.", not a raw Postgres error. Then turn self-management off on
   the patient and confirm the *next* attempt creates a pending request.
5. Approve that request as the patient, and confirm the caregiver can then see
   and edit reminders.
6. Still unverified on a real device: a **self-managed** patient adding a
   reminder / routine item / vault entry (the RLS write paths from build 9),
   and the Settings **"Manage my own reminders"** toggle + legal links.
7. The build-16 auth error guard (Bug 5) **cannot be exercised end-to-end any
   more** — the NULL-token row that produced the 500 is fixed, so there is no
   longer a way to make the server return one. The artifact check proves the
   strings and the `unexpected_failure` branch are in the bundle, not that the
   guard fires. If you want real confidence, add a unit test on
   `isInternalAuthError` / `authErrorMessage` rather than trying to reproduce
   it on a device.

If it crashes on launch, it is **not** the expo-font problem; if sign-up fails
it is **not** the anon key; and if new features are missing it is **not** a
stale checkout — all three are proven fixed in the build-16 artifact (see the
verification table below). Get the fresh crash log off the device (Settings →
Privacy & Security → Analytics & Improvements → Analytics Data) and start from
the new evidence, not from this document.

## Builds 10–16
Builds 10–16 are ordinary feature/fix builds; the three structural bugs above
stayed fixed throughout. Submitted so far: 9, 11, 12, 14, 15, **16**. (10 and 13
were superseded before submission — build numbers auto-increment per build, so
gaps in the submitted set are normal and not a sign anything went wrong.)

| build | commit | what it carried |
|---|---|---|
| 11–12 | `094010e` | security pass: caregiver revoke, patient approval gate, private vault photos + signed URLs, connect-code rate limit |
| 13 | `1738b96` | accept any Supabase email OTP length (not just six digits) |
| 14 | `279d61c` | "check your junk folder" hint on the verify screen |
| 15 | `b14ae9c` | self-managed connect message + `care_status` enum casts |
| 16 | `7873e74` | auth error guard (Bug 5) + the `landing/` support page |

Build 15 artifact checks (recipes in the sections above):

| check | result |
|---|---|
| `"…currently self-managed."` (en) | **FOUND** @541513 |
| `"…se administra a sí misma…"` (es) | **FOUND** @807540 (UTF-16) |
| anon key sha256 vs `.env` | **`98f00a774188` exact match** |
| longest run of `•` | **1** |
| `FontLoaderModule` / `FontUtilsModule` | **3 / 3** |

Build 16 artifact checks (`Info.plist` confirms version 1.0.0 / build 16):

| check | result |
|---|---|
| `"Something went wrong on our end…"` (en) | **FOUND** @594344 (ASCII) |
| `"Algo salió mal de nuestro lado…"` (es) | **FOUND** @802306 (UTF-16) |
| `unexpected_failure` | **FOUND** @684275 |
| `"Invalid login credentials"` passthrough | **FOUND** @567163 |
| raw `converting NULL to string…` text | **absent** (must stay absent) |
| anon key vs `.env` | **byte-identical**, pure ASCII, no `•` |
| longest run of `•` | **1** |
| `FontLoaderModule` | **3** |
| `ExpoFontLoader` in bundle | **1** |

### Bug 4 — the app shipped ahead of the database (caught before build 15 went out)
Build 15's whole point is the connect-with-code fix, and half of that fix lives
in Postgres, not in the binary. The hosted Supabase had the **previous** version
of `connect_with_code` — the self-managed message from `a7a24c7` was live, but
the `care_status` enum casts from `b14ae9c` were not, so connecting by code
still failed server-side. Shipping the IPA alone would have "fixed" nothing.

Applied on 2026-08-06 and verified live:

```sql
select position('''pending''::public.care_status' in prosrc) > 0
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'connect_with_code';
```

Note: `supabase_migrations.schema_migrations` on the hosted project is **empty**
— migrations here have been applied directly, so the migration list tells you
nothing. Always check the live object (`pg_proc.prosrc`, a column probe, an RPC
call) rather than trusting the `supabase/migrations/` directory.

## Build 9 — features and fixes both verified in the binary
Build 9 (`47e35f0d-7660-4e30-9429-97f720137a4e`), built from merge commit
`ebce71e`. Took **3.9 min** — builds 6–8's ~3.5 h was almost entirely queue
wait, not build time, so don't plan around the longer figure.

| check | build 8 | build 9 |
|---|---|---|
| `"Add or edit my reminders"` | MISSING | **FOUND** @522247 |
| `"Manage my own reminders"` | MISSING | **FOUND** @570216 |
| `"Who will manage the reminders?"` | MISSING | **FOUND** @611638 |
| `"Someone sets up reminders for me."` (old, must be gone) | present | **MISSING** |
| `"Yo me encargo"` / `"¿Quién administrará…"` (es) | — | **FOUND** (2nd is UTF-16) |
| `FontLoaderModule` / `FontUtilsModule` | 3 / 3 | **3 / 3** |
| anon key sha256 vs `.env` | — | **`98f00a774188` exact match** |
| longest run of `•` | — | **1** |

The `20260801000000_self_managed.sql` migration is **already applied** to the
hosted Supabase — verified with the anon key: `profiles?select=self_managed`
returns `[]` (not a column error) and `rpc/is_self_managed` returns `false`.

Note: `eas submit --non-interactive` needs `ascAppId` in `eas.json`; it's now
set in the `submit.production.ios` profile.

### Bug 5 — sign-up 500s with a wall of red SQL text (fixed 2026-08-06, shipped in build 16)
Sign-up failed with a long red error. The auth log has the real cause:

```
unable to find user from email identity for duplicates: error finding user:
sql: Scan error on column index 3, name "confirmation_token":
converting NULL to string is unsupported
```

GoTrue scans `auth.users` token columns into Go `string`, which cannot hold
NULL. **Exactly one row was bad**: the App Store demo account
`jacksonsandersbusiness@gmail.com` (`48d84136-…`, created 2026-07-26), which was
inserted with raw SQL. A manual insert leaves `confirmation_token`,
`recovery_token`, `email_change` and `email_change_token_new` NULL, where
GoTrue's own signup path writes `''`. Every sign-up runs a duplicate check that
scans that row, so one hand-made row broke sign-up for everybody.

**If you ever insert into `auth.users` by hand, set every token column to `''`,
never NULL.** Prefer the Admin API (`auth.admin.createUser`) instead.

Fixed by coalescing all eight token columns to `''`. Re-verify with:

```sql
select count(*) from auth.users
where confirmation_token is null or recovery_token is null
   or email_change is null or email_change_token_new is null
   or email_change_token_current is null or phone_change is null
   or phone_change_token is null or reauthentication_token is null;  -- must be 0
```

Confirmed fixed by replaying the failing request against the live API: a signup
POST for that email now returns **200** (it was 500), and no row was created —
the id it returns is Supabase's anti-enumeration decoy, not a real user.

The second half of the bug is that the app *showed* that text at all. Both
clients now route auth errors through a guard (`authErrorMessage` in
`lib/utils.ts`, `isInternalAuthError` in `mobile/lib/utils.ts`): anything with
HTTP status ≥ 500 or `code === "unexpected_failure"` becomes "Something went
wrong on our end. Please try again in a moment.", while human-readable errors
("Invalid login credentials") still pass through verbatim. Applied to sign-up,
sign-in, forgot-password, reset-password and the verify resend on both clients.

## Guardrails
Before **every** production build, from `mobile/`:

1. **`git fetch && git status -sb`** — must show neither "ahead" nor "behind".
   A clean working tree does **not** mean you are building current code; it only
   means you match your own HEAD. This shipped build 8 with a week-old app
   (Bug 3). If the branch has diverged, merge before building — and check
   *both* directions, because the remote may be missing local fixes.
2. **`npx expo-doctor`** — must be 18/18. Treat "Missing peer dependency" and
   "duplicate native module" as **build blockers**, not warnings. The three
   failures it reported would have caught Bug 1 before burning four builds.

After the build starts, confirm EAS picked up the commit you think it did:

```
npx eas-cli build:list --platform ios --limit 1   # read the "Commit" field
git rev-parse HEAD                                # must be identical
```

Then verify the artifact itself before submitting — a build that compiles proves
nothing about what is in the bundle. Use the string/symbol recipes above.

3. **Check the hosted database matches the commit you are shipping.** If the
   release touches `supabase/migrations/`, query the live object and confirm it
   contains the new definition *before* submitting. A correct binary against a
   stale function is still a broken feature — that was Bug 4.

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
- **Lint does not run at all** on the web app, via `npm run lint` or a direct
  `npx eslint`: `eslint-config-next` fails to patch the installed ESLint
  (`@rushstack/eslint-patch` → "Failed to patch ESLint because the calling
  module was not recognized"). So "checks pass" on this repo currently means
  **typecheck only** — don't read it as lint-clean. `next lint` is also
  deprecated and removed in Next 16. Related: two lockfiles
  (`rekalla/package-lock.json` and `rekalla/rekalla/package-lock.json`) make
  Next infer the wrong workspace root.
- ~~A patient with no caregiver can't create reminders/routine/vault (RLS is
  caregiver-write-only)~~ — addressed by the self-managed account feature
  (`20260801000000_self_managed.sql`), shipping in build 9. Still needs a real
  device test to confirm the new RLS write paths work.

## Conventions (important)
- Commit as **Jackson Sanders <madmanjack8@gmail.com>**, author + committer.
- **No AI attribution** anywhere in commit messages (no "Co-authored-by",
  no "Generated with…", no model names). Verify: `git log -1 --format=%B | grep -ci claude` → must be `0`.
- This machine now has a **repo-local** git identity (set 2026-08-06 while
  committing build 16). A bare `git commit` works here again — it used to fail
  with "Author identity unknown", and this document said so for a long time.
  That cuts both ways: the failure was a useful backstop that forced you to
  think about attribution, and it is gone, so **check the `grep -ci claude`
  line above yourself** rather than trusting a commit to fail first. Confirm
  with `git config user.email`. On a fresh checkout there is still no identity,
  so set it once, or pass it per-commit (note `-c` goes **before** the
  subcommand):

  ```
  git -c user.name="Jackson Sanders" -c user.email="madmanjack8@gmail.com" commit …
  ```

- Work happens in **more than one environment** on this repo. Push when you
  finish, and fetch before you build — see Guardrail 1.
