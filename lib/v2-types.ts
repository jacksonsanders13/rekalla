/**
 * Web mirror of the v2 types (same shapes as mobile/lib/v2-types.ts and the
 * assistant Edge Function). The v2 tables aren't in the generated
 * types/database.ts yet — regenerate and replace with Tables<"..."> after the
 * v2 migrations are applied.
 */
export type Tone = "chatty" | "brief";

export interface ProfileIdentity {
  legal_name?: string;
  preferred_name?: string;
  birthday?: string;
  hometown?: string;
  career?: string;
  faith?: string;
}
export interface ProfilePerson {
  name?: string;
  relationship?: string;
  birthday?: string;
  kind?: "family" | "friend" | "grandkid" | "pet";
  notes?: string;
}
export interface ProfileRoutine {
  typical_week?: string[];
  standing_commitments?: Array<{ label?: string; cadence?: string; logistics?: string }>;
}
export interface ProfileInterests {
  hobbies?: string[];
  music?: string[];
  teams?: string[];
  shows?: string[];
  books?: string[];
}
export interface ProfilePreferences {
  enjoy_topics?: string[];
  avoid_topics?: string[];
  tone?: Tone;
}
export interface ProfilePractical {
  doctors?: Array<{ name?: string; specialty?: string }>;
  pharmacy?: string;
  drivers?: Array<{ name?: string; when?: string }>;
  emergency_contacts?: Array<{ name?: string; phone?: string; relationship?: string; priority?: number }>;
}

export type SectionKey =
  | "identity"
  | "people"
  | "routine"
  | "interests"
  | "preferences"
  | "practical";

export type SectionState = "empty" | "partial" | "complete";

export interface PersonalizationProfile {
  user_id: string;
  identity: ProfileIdentity;
  people: ProfilePerson[];
  routine: ProfileRoutine;
  interests: ProfileInterests;
  preferences: ProfilePreferences;
  practical: ProfilePractical;
  section_status: Partial<Record<SectionKey, SectionState>>;
  updated_at?: string;
}

export type Tier =
  | "tier1_medical"
  | "tier2_financial"
  | "tier3_emotional"
  | "tier4_out_of_scope";

export interface AssistantRequest {
  user_message: string;
  conversation_id?: string;
}
export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
  priority?: number;
}
export interface AssistantResponse {
  reply: string;
  tier: Tier;
  suggested_action?: { type: "send_message" | "call_contact" | "none"; contact_name?: string };
  emergency_contacts?: EmergencyContact[];
}

export const SECTION_ORDER: SectionKey[] = [
  "identity",
  "people",
  "routine",
  "interests",
  "preferences",
  "practical",
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  identity: "About you",
  people: "People & pets",
  routine: "Your week",
  interests: "Things you enjoy",
  preferences: "How we talk",
  practical: "Practical info",
};

export function emptyProfile(userId: string): PersonalizationProfile {
  return {
    user_id: userId,
    identity: {},
    people: [],
    routine: {},
    interests: {},
    preferences: {},
    practical: {},
    section_status: {},
  };
}

/** Shared with mobile: rough completeness of one section. */
export function sectionState(profile: PersonalizationProfile, key: SectionKey): SectionState {
  const v = profile[key] as unknown;
  if (Array.isArray(v)) return v.length === 0 ? "empty" : "complete";
  if (v && typeof v === "object") {
    const values = Object.values(v).filter(
      (x) => x !== undefined && x !== null && x !== "" && !(Array.isArray(x) && x.length === 0),
    );
    if (values.length === 0) return "empty";
    const keys = Object.keys(v).length || 1;
    return values.length >= keys ? "complete" : "partial";
  }
  return "empty";
}

export function overallProgress(profile: PersonalizationProfile): number {
  const done = SECTION_ORDER.filter((k) => sectionState(profile, k) === "complete").length;
  return Math.round((done / SECTION_ORDER.length) * 100);
}
