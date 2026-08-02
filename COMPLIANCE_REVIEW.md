# Rekalla — Legal Compliance Review

A working record of how Rekalla's Terms of Use and Privacy Policy line up with
the laws and agencies that realistically apply. **Not legal advice** — this is a
gap analysis to hand to a licensed attorney for final sign-off. No document is
ever truly "bulletproof"; the goal here is to get as close as possible and make
the lawyer's review fast and cheap.

Docs reviewed: `landing/terms/index.html` (Terms of Use, hosted at
rekalla.app/terms), `landing/privacy/index.html` (Privacy Policy, rekalla.app/privacy),
and the in-app summary in `mobile/components/terms-gate.tsx` (which incorporates
the full web Terms by reference).

Entity: **Rekalla LLC**, 8 The Green, Suite A, Dover, DE 19901. Contact:
rekallasupport@gmail.com. US-based, direct-to-consumer, health-adjacent data,
older-adult audience, iOS.

## Framework-by-framework

| Law / agency | Applies? | Status |
|---|---|---|
| FTC Act §5 (deceptive practices) | Yes | ✅ Strong — docs match actual practice |
| Apple App Store / EULA terms | Yes | ✅ Fixed — Apple EULA clauses added (Terms §18) |
| Washington My Health My Data Act (MHMDA) | Likely | 🔴 Needs a lawyer — biggest exposure |
| CalOPPA (California) | Yes | ✅ Fixed — Do Not Track disclosure added |
| CCPA/CPRA (California) | Not yet (thresholds) | 🟡 Rights section present; revisit as you grow |
| GDPR / UK GDPR | If EU/UK users | 🟡 Covered; transfer mechanism needs a lawyer if EU goes live |
| COPPA (under 13) | Yes | ✅ Adequate — adults-only posture |
| HIPAA | No | ✅ Correctly not claimed |
| State breach-notification laws | Yes | ✅ Fixed — breach line added (Privacy §6) |
| CAN-SPAM / TCPA | Only if messaging | 🟡 N/A today; revisit when marketing starts |

## Fixes applied to the docs (done)
1. **Do Not Track** disclosure — Privacy Policy §13 (CalOPPA requirement).
2. **Apple EULA clauses** — Terms §18: agreement is with Rekalla LLC not Apple,
   Apple as third-party beneficiary, US export/embargo representation, support &
   warranty responsibility. (Required when supplying a custom EULA. Alternative:
   use Apple's Standard EULA in App Store Connect instead.)
3. **Consumer health data + sensitive information** — Privacy Policy §12: covers
   wellness/mood/medication data, state consumer-health-data rights, no sale/ads,
   and clarifies Rekalla is not HIPAA-covered.
4. **Breach notification** — Privacy Policy §6: commitment to notify as required
   by law.

## Still needs a lawyer (cannot be made bulletproof without one)
1. **Washington MHMDA (top priority).** Washington's consumer-health-data law has
   no small-business exemption, reaches any company with WA users (the app is
   nationwide), and carries a **private right of action**. Wellness check-ins
   (mood/sleep/energy) and medication reminders likely qualify as "consumer
   health data." Full compliance typically requires a **separate Consumer Health
   Data Privacy Policy** and a **valid consent mechanism** before collecting or
   sharing that data. The Privacy Policy §12 disclosure is a start, not full
   compliance. Nevada and Connecticut have similar laws. **Raise this first.**
2. **Binding arbitration / class-action waiver** — not currently included. A
   lawyer can advise whether to add one and draft it enforceably.
3. **GDPR international-transfer mechanism** — only if you actively serve EU/UK
   users. Simplest near-term de-risk: **limit App Store availability to the US**
   at launch and expand later.
4. **Final certification** that the docs are compliant for your specific
   situation.

## Practical launch guidance
- **App Store category:** Productivity or Lifestyle — NOT Medical/Health.
- **App Store EULA field:** either use Apple's Standard EULA, or point it at
  rekalla.app/terms (which now contains the required Apple clauses).
- **Privacy nutrition label:** must match the Privacy Policy — declare account
  email, health/wellness data, user content; declare NO tracking and NO ads.
- **De-risk EU exposure at launch** by limiting availability to the US initially.
- Get a lawyer / Rocket Lawyer to review, MHMDA question front and center.
