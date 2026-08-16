"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { askAssistant } from "@/lib/assistant-client";
import {
  emptyProfile,
  sectionState,
  type AssistantRequest,
  type AssistantResponse,
  type PersonalizationProfile,
  type SectionKey,
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

export function useAssistant() {
  return useMutation<AssistantResponse, Error, AssistantRequest>({
    mutationFn: (req) => askAssistant(req),
  });
}
