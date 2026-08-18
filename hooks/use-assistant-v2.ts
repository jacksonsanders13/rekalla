"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { askAssistant } from "@/lib/assistant-client";
import {
  emptyProfile,
  sectionState,
  SECTION_ORDER,
  type AssistantRequest,
  type AssistantResponse,
  type PersonalizationProfile,
  type ProposedAction,
  type SectionKey,
  type SectionState,
} from "@/lib/v2-types";

// v2 tables aren't in the generated Database type yet; access untyped + cast.
function untyped() {
  return createClient() as unknown as { from: (t: string) => any };
}

export function useProfileV2(userId: string) {
  return useQuery({
    queryKey: ["personalization_profile", userId],
    queryFn: async (): Promise<PersonalizationProfile> => {
      const { data, error } = await untyped()
        .from("personalization_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ?? emptyProfile(userId);
    },
  });
}

export function useSaveSection(userId: string, editorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { section: SectionKey; value: unknown }) => {
      const db = untyped();
      const { data: current } = await db
        .from("personalization_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      const base: PersonalizationProfile = current ?? emptyProfile(userId);
      const next = { ...base, [input.section]: input.value } as PersonalizationProfile;
      const status = { ...base.section_status };
      status[input.section] = sectionState(next, input.section);

      const { error } = await db.from("personalization_profiles").upsert({
        user_id: userId,
        [input.section]: input.value,
        section_status: status,
      });
      if (error) throw error;

      await db.from("profile_edits").insert({
        user_id: userId,
        editor_id: editorId,
        section: input.section,
        summary: `Updated ${input.section}`,
      });
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["personalization_profile", userId] }),
  });
}

/**
 * Saves the whole welcome survey in one write and stamps onboarded_at, so the
 * survey never reappears. Works whether they filled everything in or skipped.
 */
export function useCompleteOnboarding(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: PersonalizationProfile) => {
      const status: Partial<Record<SectionKey, SectionState>> = {};
      for (const key of SECTION_ORDER) status[key] = sectionState(profile, key);

      const { error } = await untyped().from("personalization_profiles").upsert({
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
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const db = untyped();

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
