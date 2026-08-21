/**
 * Scripted first-run onboarding that happens *in the chat*. Rekalla asks these
 * questions one at a time; each answer is folded into the profile. It's a
 * conversation, but a predictable one — no model call, so it always works.
 *
 * Kept identical to the web app (lib/onboarding.ts) so both behave the same.
 */
import type { PersonalizationProfile } from "./v2-types";

export interface OnboardingStep {
  /** What Rekalla says. */
  ask: string;
  /** Fold the person's typed answer into the profile draft. */
  apply: (p: PersonalizationProfile, answer: string) => PersonalizationProfile;
}

export const ONBOARDING_INTRO =
  "Hi, I'm Rekalla — I'm here to help you day to day. Everything you tell me stays private; I never share it or sell it. Let's get to know each other with a few quick questions. You can skip any you'd rather not answer.";

export const ONBOARDING_DONE =
  "Thank you — that's a lovely start. You can always tell me more, or change anything on your Profile page. Now, how can I help you today?";

// Pull a phone-like run of digits out of a free-text answer, if there is one.
function extractPhone(text: string): string | undefined {
  const m = text.match(/[+(]?\d[\d\s().-]{6,}\d/);
  return m ? m[0].trim() : undefined;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    ask: "First — what should I call you?",
    apply: (p, a) => ({
      ...p,
      identity: { ...p.identity, preferred_name: a, legal_name: p.identity.legal_name || a },
    }),
  },
  {
    ask: "It's lovely to meet you. When is your birthday?",
    apply: (p, a) => ({ ...p, identity: { ...p.identity, birthday: a } }),
  },
  {
    ask: "Who are the most important people in your life? You can just tell me their names and how they're related — like “my son David” or “my friend Rose.”",
    apply: (p, a) => ({ ...p, people: [...(p.people ?? []), { notes: a }] }),
  },
  {
    ask: "What do you enjoy? Any hobbies, shows, music, or teams you love?",
    apply: (p, a) => ({
      ...p,
      interests: { ...p.interests, hobbies: [...(p.interests.hobbies ?? []), a] },
    }),
  },
  {
    ask: "Would you like me to be chatty and warm, or short and to the point?",
    apply: (p, a) => ({
      ...p,
      preferences: {
        ...p.preferences,
        tone: /brief|short|point|quick|concise/i.test(a) ? "brief" : "chatty",
      },
    }),
  },
  {
    ask: "Last one — if there were ever an emergency, who should I help you reach? Their name, and a phone number if you have it.",
    apply: (p, a) => {
      const phone = extractPhone(a);
      const name = (phone ? a.replace(phone, "") : a).replace(/[,;-]\s*$/, "").trim() || a;
      return {
        ...p,
        practical: {
          ...p.practical,
          emergency_contacts: [
            ...(p.practical.emergency_contacts ?? []),
            { name, phone, priority: 1 },
          ],
        },
      };
    },
  },
];
