# Rekalla — iOS app (Expo)

The native mobile app. Talks to the same Supabase backend as the web app.

## Run it on your iPhone (from Windows)

1. Install **Expo Go** on your iPhone (App Store).
2. In this folder, create a file named `.env` with your Supabase keys:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Install and start:

   ```
   npm install
   npx expo start
   ```

4. Scan the QR code with your iPhone camera (phone and PC on the same Wi-Fi).

## Ship to TestFlight / the App Store (no Mac needed)

Builds run on Expo's cloud Macs. You only need a paid Apple Developer account.

**One-time setup**

```
npm install -g eas-cli
eas login                    # your Expo account (free)
eas init                     # creates the project on expo.dev, writes projectId to app.json
```

Then give the cloud build your Supabase keys (kept out of git — they live on
Expo, not in the repo). Run each command and paste the value when asked, once
for the `preview` environment and once for `production`:

```
eas env:create --environment preview    --name EXPO_PUBLIC_SUPABASE_URL       --value "https://YOUR-PROJECT.supabase.co" --visibility plaintext
eas env:create --environment preview    --name EXPO_PUBLIC_SUPABASE_ANON_KEY  --value "YOUR-ANON-KEY"                    --visibility sensitive
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL       --value "https://YOUR-PROJECT.supabase.co" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY  --value "YOUR-ANON-KEY"                    --visibility sensitive
```

**Build + submit**

```
eas build --platform ios --profile production   # builds the .ipa on Expo's Macs
eas submit --platform ios --profile production   # uploads it to App Store Connect
```

`eas build` will offer to log in to your Apple account and create the signing
certificate and provisioning profile for you — say yes. `eas submit` uploads
the finished build to App Store Connect.

**TestFlight**

Once the upload finishes and Apple's processing completes (a few minutes),
open App Store Connect → your app → **TestFlight**, add yourself/testers, and
install via the **TestFlight** app on the iPhone. No SDK-version matching, no
Expo Go — this is the real app.

Every new build: bump nothing by hand — `production` auto-increments the build
number. Just re-run `eas build` then `eas submit`.
