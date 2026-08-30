# Improvement queue

The scheduled agent reads this file, takes the **top unchecked item**, does that one
job, and opens a pull request. One item per run. It ticks the box in the same PR.

Add anything you want done to the bottom. Reorder freely — the agent always starts
at the top. If every box is ticked, it should open no PR and say so.

---

## Queue

- [ ] **Rewrite `landing/privacy/` and `landing/terms/` for v3.**
  Both still describe caregivers, wellness check-ins and the Memory Vault, none of
  which the app has. They are linked from the App Store listing and from Settings, so
  they are the highest-risk stale content in the repo. Keep the legal structure and
  the existing headings; replace only the descriptions of what data is collected and
  who can see it. The app is single-user: no sharing, no caregiver access. Flag in the
  PR that a human must read this before it ships.

- [ ] **Add an error boundary to the web app.**
  There is none, so one bad render white-screens the whole page. Add
  `app/(app)/error.tsx` and a root `app/error.tsx` in Rekalla's voice: plain language,
  no stack traces shown to the person, a button to try again. Match the app's tokens.

- [ ] **Add retry to the scan upload.**
  `mobile/lib/photos.ts` uploads the image and `hooks/scans.ts` saves the scan. If the
  network drops mid-upload the person loses the photo and gets a raw error string.
  Retry the upload a couple of times with a backoff, and on final failure keep the
  captured photo in state so they can try again without retaking it.

- [ ] **Payments phase 1: entitlements, no payment provider.**
  Per `landing/../docs` and the plan discussed: add an `entitlements` table keyed by
  user (plan, status, current_period_end, source, external_id), with no client write
  policy, matching how `assistant_usage` is locked down. Then make the monthly cap in
  both Edge Functions read the plan instead of the single `MONTHLY_MESSAGE_LIMIT` env
  var. Everyone is on free for now. Do not add Stripe or RevenueCat in this PR.

---

## Done

<!-- Move completed items here with the PR number, newest first. -->

- [x] **Fix the cost formula for assistant_usage.**
  Both Edge Functions priced Sonnet at $3/$15 per million inline, overstating spend
  by ~50%. Rates now live in `supabase/functions/_shared/pricing.ts` so the two
  cannot drift again, and `20260830000000_fix_usage_cost_rate.sql` corrects the
  stored rows and the column comment. Needs both functions redeployed.
