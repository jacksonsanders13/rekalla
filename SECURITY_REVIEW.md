# Rekalla — Security Review

Audit of the login/sign-up flow and the data-access model. **Not a substitute
for a professional pentest**, but covers the common real risks. Reviewed the
auth screens, input validation, all Row-Level Security (RLS) policies, the
SECURITY DEFINER functions, and the storage config.

## The common attacks — well defended ✅

**SQL injection (e.g. typing `DROP TABLE` / "disregard table" into a field).**
Not possible. The app uses the Supabase client (PostgREST), which sends every
value as a bound parameter — never string-concatenated SQL. Malicious text is
stored as literal text. No database function uses dynamic SQL (`EXECUTE
format(...)`); the only `execute` occurrences are trigger and grant definitions.

**One user reading another user's data.**
Strongly defended. RLS is enabled on **all 10 tables** and enforced by the
database itself, not the app — so tampering with an ID in a request, or calling
the API directly, still returns nothing unless you own the row or are an
**active** connected caregiver (`is_caregiver_of` requires `status = 'active'`).
A self-managed patient can only write their own rows (`user_id = auth.uid()`).

**Emojis / weird characters.** Not a security risk. Names are stored as text;
React and React Native escape all output, so there's no XSS. Emails are format-
validated (Zod on web, checks on mobile) and by Supabase.

**Also solid:** account deletion is scoped to the caller's own account; no secret
keys ship in the client (only the public anon key, safe behind RLS);
login/password-reset are rate-limited by Supabase Auth.

## Hardening applied (this migration: `20260802000000_security_hardening.sql`)

1. **Vault photos are now private.** The `vault-photos` bucket was public-read
   (any photo viewable by URL without auth). It's now private, readable only by
   the owner and their active caregiver, served via short-lived signed URLs. App
   updated to store the storage path and resolve signed URLs at display time
   (`mobile/components/vault-photo.tsx`). Avatars remain public.
2. **Connect-code brute-force protection.** `connect_with_code` now throttles to
   5 attempts per caregiver per 15 minutes (via a `connect_attempts` table), so
   the 6-character patient codes can't be enumerated at scale.

## Recommended follow-ups (not blocking)

- **Patient approval of new connections.** Today a valid connect code links a
  caregiver instantly. Rate-limiting closes the brute-force hole; adding an
  explicit patient "approve this caregiver?" step would further improve consent.
  (Requires a small new UI — can be built when ready.)
- **Supabase Auth settings (dashboard, not code):**
  - Turn on **leaked-password protection** (blocks known-breached passwords).
  - Ensure **email confirmation is ON** so nobody can register an email they
    don't own.
- **Tighten `is_linked_to`** so a *pending* (unaccepted) invite can't read a
  profile — change `status <> 'revoked'` to `status = 'active'` if the pre-accept
  read isn't needed.
- **Revoke durability:** `connect_with_code` still reactivates a previously
  revoked link if the caregiver re-enters the code. Consider requiring a fresh
  invite instead.

## To apply
1. Run `supabase/migrations/20260802000000_security_hardening.sql` in Supabase.
2. Rebuild the mobile app **together with the migration** — the signed-URL code
   must be live when the bucket goes private (older public photo URLs stop
   resolving once the bucket is private; re-adding a photo stores a fresh path).
3. Test on device: add a vault photo, confirm it displays; confirm a caregiver
   connected to that patient can see it and an unconnected account cannot.
