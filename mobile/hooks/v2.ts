import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { askAssistant } from "../lib/assistant";
import type {
  AssistantRequest,
  AssistantResponse,
  PersonalizationProfile,
  ProposedAction,
  SectionKey,
  SectionState,
} from "../lib/v2-types";
import { SECTION_ORDER } from "../lib/v2-types";

// The v2 tables aren't in the generated Database type yet, so we access them
// through an untyped handle and cast. Replace once database.types.ts is
// regenerated post-migration.
const db = supabase as unknown as {
  from: (t: string) => any;
};

const EMPTY_PROFILE = (userId: string): PersonalizationProfile => ({
  user_id: userId,
  identity: {},
  people: [],
  routine: {},
  interests: {},
  preferences: {},
  practical: {},
  section_status: {},
});

/** Rough completeness of a section, used for the progress indicator + gaps. */
export function sectionState(
  profile: PersonalizationProfile,
  key: SectionKey,
): SectionState {
  const v = profile[key] as unknown;
  if (Array.isArray(v)) return v.length === 0 ? "empty" : "complete";
  if (v && typeof v === "object") {
    const values = Object.values(v).filter(
      (x) => x !== undefined && x !== null && x !== "" && !(Array.isArray(x) && x.length === 0),
    );
    if (values.length === 0) return "empty";
    // "practical" and "identity" have several fields; treat few-filled as partial.
    const keys = Object.keys(v).length || 1;
    return values.length >= keys ? "complete" : "partial";
  }
  return "empty";
}

export function overallProgress(profile: PersonalizationProfile): number {
  const done = SECTION_ORDER.filter(
    (k) => sectionState(profile, k) === "complete",
  ).length;
  return Math.round((done / SECTION_ORDER.length) * 100);
}

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ["personalization_profile", userId],
    queryFn: async (): Promise<PersonalizationProfile> => {
      const { data, error } = await db
        .from("personalization_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ?? EMPTY_PROFILE(userId);
    },
  });
}

/** Save one section. Recomputes section_status and records a profile_edit. */
export function useSaveSection(userId: string, editorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { section: SectionKey; value: unknown }) => {
      // Read current, patch the one section, recompute status, upsert.
      const { data: current } = await db
        .from("personalization_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      const base: PersonalizationProfile = current ?? EMPTY_PROFILE(userId);
      const next = { ...base, [input.section]: input.value } as PersonalizationProfile;
      const status = { ...base.section_status };
      status[input.section] = sectionState(next, input.section);

      const { error } = await db.from("personalization_profiles").upsert({
        user_id: userId,
        [input.section]: input.value,
        section_status: status,
      });
      if (error) throw error;

      // Attribution so the elder can see who edited (family gap-filling).
      await db.from("profile_edits").insert({
        user_id: userId,
        editor_id: editorId,
        section: input.section,
        summary: `Updated ${input.section}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personalization_profile", userId] });
    },
  });
}

/**
 * Save the whole welcome survey in one write and stamp onboarded_at, so the
 * survey is only ever asked once. Works whether they filled it in or skipped.
 */
export function useCompleteOnboarding(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: PersonalizationProfile) => {
      const status: Partial<Record<SectionKey, SectionState>> = {};
      for (const key of SECTION_ORDER) status[key] = sectionState(profile, key);

      const { error } = await db.from("personalization_profiles").upsert({
        user_id: userId,
        identity: profile.identity,
        people: profile.people,
        routine: profile.routine,
        interests: profile.interests,
        preferences: profile.preferences,
        practical: profile.practical,
        section_status: status,
        onboarded_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["personalization_profile", userId] }),
  });
}

export function useAssistant() {
  return useMutation<AssistantResponse, Error, AssistantRequest>({
    mutationFn: (req) => askAssistant(req),
  });
}

/**
 * Confirm-first capture: the elder taps "Yes" and we write the proposed item
 * into their own schedule or memory vault. Runs as the signed-in user, so RLS
 * only ever lets them write their own rows.
 */
export function useConfirmProposedAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: ProposedAction) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      if (action.kind === "add_reminder" && action.reminder) {
        const r = action.reminder;
        const time = (r.time ?? "09:00").slice(0, 5);
        const { error } = await db.from("reminders").insert({
          user_id: user.id,
          title: r.title ?? "Reminder",
          category: r.category ?? "custom",
          time_of_day: `${time}:00`,
          recurrence: r.recurrence ?? "once",
          start_date: r.date ?? new Date().toISOString().slice(0, 10),
          is_active: true,
        });
        if (error) throw error;
      } else if (action.kind === "add_vault_item" && action.vault_item) {
        const v = action.vault_item;
        const { error } = await db.from("vault_items").insert({
          user_id: user.id,
          category: v.category ?? "note",
          title: v.title ?? "Note",
          subtitle: v.subtitle ?? null,
          notes: v.notes ?? null,
          date_value: v.date_value ?? null,
          phone: v.phone ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["vault"] });
    },
  });
}
