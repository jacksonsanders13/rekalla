/**
 * Hand-written types for the v2 tables (personalization_profiles, messages,
 * care_notes, escalation_events) and the assistant Edge Function contract.
 *
 * These tables are newer than lib/database.types.ts (which is generated from
 * the v1 schema). Regenerate database.types.ts after the v2 migrations are
 * applied and these can be replaced with Tables<"..."> aliases.
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
  doctors?: Array<{ name?: string; specialty?: string }>; // specialty ONLY, no diagnoses
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
  onboarded_at?: string | null;
  updated_at?: string;
}

// ---- Assistant Edge Function contract (mirrors supabase/functions/assistant) ----
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
