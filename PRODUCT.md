# Rekalla — Product positioning (v2)

## One line
**Rekalla is a warm, simple voice assistant made for older adults — it knows
their family, their week, and their appointments, and it keeps them safe from
scams and emergencies.**

## Who it's for
The **older adult themselves** is the user. They open Rekalla, talk to it, and
it answers from what it knows about *their* life. That's the whole product.

Family are **not** a second product to sell or a second app to set up. They help
fill in the profile once (on the same device, or later from the web), and they're
saved as **phone numbers to call** when something urgent happens. No caregiver
account is required for Rekalla to be useful on day one.

## Why this is easier to market
- **One user, one install, one story.** "An assistant for Mom" — not a two-sided
  platform you have to explain. The buyer and the user can be the same person, or
  an adult child sets it up in ten minutes and hands over the phone.
- **Immediate value with zero coordination.** It works the moment the profile has
  a name and an emergency contact. No invitations, no second person to onboard,
  no empty-dashboard problem.
- **A single, memorable safety promise.** The scam guardrail (Tier 2) and the
  emergency flow (Tier 1) are concrete, demoable, and emotionally resonant —
  "it tells Mom to hang up and call you before she sends gift cards."

## The three things the elder sees
Navigation is deliberately just **three tabs**:
1. **Rekalla** — the assistant. The home screen. Talk or type; it answers.
2. **My day** — reminders, routine, photos/notes, how they're feeling, all
   behind one calm hub.
3. **Profile** — who they are, their people, their week, their doctors and
   emergency contacts. Fillable a little at a time.

## What stays behind the scenes (not marketed, still there)
- The v1 caregiver account type and connection flow still exist for families who
  want the shared web dashboard, but they're **optional** and de-emphasized.
- Escalations (Tier 1/2) are logged and, *if* a family member is connected, push
  to them. With no one connected, the elder still gets the 911 button and the
  "call your contact" action from their own profile — the product degrades
  gracefully to fully single-user.

## Decisions this implies (implemented / to do)
- ✅ Elder navigation collapsed to 3 tabs on both iOS and web (My Day hub).
- ✅ Emergency contacts come from the **profile** first; the Edge Function
  already prefers `practical.emergency_contacts` (priority-ordered) over any
  caregiver relationship, so single-user works end to end.
- ⏳ Onboarding copy should present Rekalla as the elder's own app; the
  "who is this account for?" step can default to the older adult and treat the
  caregiver path as "I'm setting this up for someone."
- ⏳ Landing page copy (in `landing/`) should lead with the single-user story.
