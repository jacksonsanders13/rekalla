# Rekalla — iOS App Store Submission Checklist

Everything needed to submit. Work top to bottom. Positioning throughout:
**a simple, non-medical reminder + family-coordination app for aging parents.**

---

## Phase 0 — Gates (must be true before you can submit)

- [ ] **Decide the account:** LLC (Organization) if the D-U-N-S (149880590) is
      approved in time; otherwise submit under the Individual account and
      transfer to the LLC later. Don't block launch on the LLC.
- [ ] **Run the four Supabase migrations** (self_managed, security_hardening,
      connection_approval, fix_caregiver_self_approve) and verify.
- [ ] **Supabase Auth settings** (dashboard): Email confirmation ON; Site URL set
      (for password-reset links); leaked-password protection ON.
- [ ] **Final build** with all latest code, on TestFlight, **tested on a real
      device** — sign up (self-managed + caregiver-managed), add a reminder,
      confirm a notification fires, add a vault photo, do a check-in, delete
      account.

---

## Phase 1 — App Store Connect: create/complete the app record

- [ ] **Name:** Rekalla (if taken, e.g. "Rekalla: Family Reminders")
- [ ] **Subtitle (≤30):** `Reminders for aging parents`
- [ ] **Bundle ID:** com.jacksonsanders.rekalla
- [ ] **SKU:** rekalla-ios
- [ ] **Primary category:** Productivity  (secondary: Lifestyle)
      — **NOT** Medical or Health & Fitness.
- [ ] **Age rating:** run the questionnaire → **4+**
- [ ] **Privacy Policy URL:** `https://rekalla.app/privacy`
- [ ] **Support URL:** `https://rekalla.app`  (or a support page)
- [ ] **Marketing URL (optional):** `https://rekalla.app`
- [ ] **EULA:** use custom → `https://rekalla.app/terms` (it has Apple's required
      clauses), or select Apple's Standard EULA.
- [ ] **Pricing:** Free
- [ ] **Availability:** **United States only** at launch (de-risks GDPR; expand later)
- [ ] **App icon:** 1024×1024 (in repo: mobile/assets/icon.png source)
- [ ] **Screenshots:** 6.9" (1320×2868) set ready. Add a 6.5" set if prompted.
- [ ] **Export compliance:** already handled (ITSAppUsesNonExemptEncryption=false)

---

## Phase 2 — App Privacy ("nutrition label") — answers for Rekalla

Answer the questionnaire exactly like this (honest + matches the docs):

**Do you collect data? → Yes.**  **Used to track you? → No.** (no ATT prompt)

| Data type | Collected | Linked to user | Purpose |
|---|---|---|---|
| Contact Info → **Name** | Yes | Yes | App Functionality |
| Contact Info → **Email Address** | Yes | Yes | App Functionality |
| User Content → **Photos** (vault) | Yes | Yes | App Functionality |
| User Content → **Other User Content** (reminders, routine, vault entries, notes) | Yes | Yes | App Functionality |
| Identifiers → **User ID** | Yes | Yes | App Functionality |

- Purpose for everything is **App Functionality only** — NOT Analytics,
  Advertising, Product Personalization, or Developer's Marketing.
- **No** Usage Data / Diagnostics (you run no analytics SDK).
- **Judgment call:** the wellness check-in (mood/sleep/energy) is health-adjacent.
  Safest honest answer is to include it under **Other User Content** (above). If
  a reviewer or your lawyer prefers, it can be declared as Health data — confirm
  with the lawyer, but do not hide it.

---

## Phase 3 — Listing copy (paste-ready)

**Promotional text (≤170):**
> A gentle reminder app for aging parents — and the families who help them.
> Reminders, routines, a memory bank, and a quick daily check-in, all in one
> simple place.

**Keywords (≤100 chars, comma-separated, no spaces):**
`caregiver,elderly,seniors,medication,memory,family,routine,pill,checkin,wellness,notes,parent`

**Description:**
> Rekalla helps aging parents keep up with the little things they start to
> forget — and gives the family who loves them a simple way to help from anywhere.
>
> Set gentle reminders for medication, meals, appointments, and phone calls.
> Follow a simple daily routine. Keep important people, doctors, and details in
> one place. And check in each day with a quick note on how you're feeling — so
> your family has peace of mind, even from far away.
>
> Made for older adults: big text, big buttons, plain words, nothing to figure out.
>
> FOR THE PERSON USING IT
> • Reminders for medication, meals, appointments, and family calls
> • A simple morning-to-evening routine to check off
> • A memory bank for family, doctors, phone numbers, and notes
> • A quick daily "how are you feeling?" check-in
>
> FOR THE FAMILY
> • Connect to your loved one with a short code (they approve it)
> • Help set up and manage their reminders, routine, and memory bank from your
>   own phone
> • See how their day is going, so you can worry a little less
>
> Rekalla is a simple reminder and organization app for everyday, age-related
> forgetfulness. It is not a medical app, not a medical device, and does not
> provide medical advice.

Avoid in all store text: "dementia," "Alzheimer's," "patients," "cognitive,"
"diagnose/treat" — these read as medical claims.

---

## Phase 4 — Review information

- [ ] **Sign-in required:** ON
- [ ] **Demo account:** a populated Loved One account (has sample reminders,
      routine, vault entries so the reviewer sees a real app — not empty)
  - User: `<demo email>`  Password: `<demo password>`
- [ ] **Review Notes:**
> Rekalla has two roles: "Loved One" (the older adult) and "Caregiver" (a family
> member). A Loved One can manage their own reminders/routine/memory bank if they
> choose "I'll manage myself" at sign-up, or a Caregiver can help. A Caregiver
> connects by entering the Loved One's 6-character code; the Loved One then
> approves the request before the Caregiver gets access. Reminders are local
> notifications on the device. The demo account above is a self-managed Loved One
> with sample data. Rekalla is a reminder/organization aid, not a medical app.

---

## Phase 5 — Submit → review → release

- [ ] Submit for Review.
- [ ] Apple review is usually 1–2 days; respond fast to any rejection.
- [ ] Set the release to **schedule for your launch date** (e.g. Aug 10) so it
      goes live exactly when you want, even if approved earlier.

## Common rejection risks (pre-empt them)
- App reads as "medical" → keep category Productivity + non-clinical copy.
- Empty demo account → make sure it has sample data.
- Broken/placeholder content → none (terms are real now).
- Account deletion missing → present (Settings → Delete my account). ✅
- Privacy label mismatch → the Phase 2 answers match the Privacy Policy. ✅
