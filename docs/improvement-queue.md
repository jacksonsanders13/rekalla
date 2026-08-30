# Improvement queue

The scheduled agent reads this file, takes the **top unchecked item**, does that one
job, and opens a pull request. One item per run. It ticks the box in the same PR.

Add anything you want done to the bottom. Reorder freely — the agent always starts
at the top. If every box is ticked, it should open no PR and say so.

---

## Queue

---

## Done

<!-- Move completed items here with the PR number, newest first. -->

- [x] **Rewrite `landing/privacy/` and `landing/terms/` for v3.**
  All caregiver, wellness and Memory Vault language is gone from both. More
  importantly, neither disclosed that photographs are sent to a model provider to
  be read; both now name Anthropic and say what is sent and why. Terms section 5
  became an honest statement that the reading is imperfect and must be checked.
  NOT LEGALLY REVIEWED: a human needs to read both before they ship.

- [x] **Payments phase 1: entitlements, no payment provider.**
  `20260830000001_entitlements.sql` adds the table, owner-read only, no client
  write policy. `_shared/entitlements.ts` resolves a user's monthly limit and both
  Edge Functions now use it. No row means free, so no backfill was needed. Caps
  default to today's numbers, so deploying changes nothing until the free limit is
  deliberately lowered. Needs both functions redeployed and the migration applied.

- [x] **Add retry to the scan upload.**
  `mobile/lib/retry.ts` retries while a failure looks like the network, twice with
  a backoff, wrapped around both the storage upload and the scan Edge Function
  call. The save failure message is now plain language instead of a raw error
  string, and the photo stays in state so retrying does not mean retaking it.

- [x] **Add an error boundary to the web app.**
  Three of them: `app/(app)/error.tsx` keeps the header and tab bar so nobody is
  stranded, `app/error.tsx` covers the landing and auth screens, and
  `app/global-error.tsx` handles the root layout failing, styled inline because no
  stylesheet is guaranteed at that point. Errors go to the console, never to the
  person.

- [x] **Fix the cost formula for assistant_usage.**
  Both Edge Functions priced Sonnet at $3/$15 per million inline, overstating spend
  by ~50%. Rates now live in `supabase/functions/_shared/pricing.ts` so the two
  cannot drift again, and `20260830000000_fix_usage_cost_rate.sql` corrects the
  stored rows and the column comment. Needs both functions redeployed.
