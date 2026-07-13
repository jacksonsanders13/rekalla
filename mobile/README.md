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

## Ship to the App Store (no Mac needed)

```
npm install -g eas-cli
eas login
eas build --platform ios     # builds on Expo's cloud Macs
eas submit --platform ios    # uploads to App Store Connect
```

Test builds are distributed through TestFlight before going live.
