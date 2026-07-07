"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CareLink } from "@/types";

const careKey = (userId: string) => ["care-links", userId];

/**
 * Every relationship the user participates in, from either side, with the
 * linked profiles resolved.
 */
export function useCareLinks(userId: string, email: string) {
  return useQuery({
    queryKey: careKey(userId),
    queryFn: async (): Promise<CareLink[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("care_relationships")
        .select("*")
        .or(
          `patient_id.eq.${userId},caregiver_id.eq.${userId},invited_email.eq.${email.toLowerCase()}`,
        )
        .neq("status", "revoked")
        .order("created_at");
      if (error) throw error;

      // Resolve the profiles on both sides (RLS lets us read linked profiles).
      const profileIds = Array.from(
        new Set(
          data.flatMap((row) => [row.patient_id, row.caregiver_id]).filter(
            (id): id is string => Boolean(id),
          ),
        ),
      );
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", profileIds);
      if (profilesError) throw profilesError;

      const byId = new Map(profiles.map((profile) => [profile.id, profile]));
      return data.map((row) => ({
        ...row,
        patient: byId.get(row.patient_id) ?? null,
        caregiver: row.caregiver_id ? (byId.get(row.caregiver_id) ?? null) : null,
      }));
    },
  });
}

function useInvalidate(userId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: careKey(userId) });
}

/** Patient invites a caregiver by email. */
export function useInviteCaregiver(userId: string) {
  const invalidate = useInvalidate(userId);
  return useMutation({
    mutationFn: async (input: { email: string; relationship: string | null }) => {
      const supabase = createClient();
      const { error } = await supabase.from("care_relationships").insert({
        patient_id: userId,
        invited_email: input.email.toLowerCase(),
        relationship: input.relationship,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Invitee accepts an invitation addressed to their email. */
export function useAcceptInvitation(userId: string) {
  const invalidate = useInvalidate(userId);
  return useMutation({
    mutationFn: async (relationshipId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("care_relationships")
        .update({ caregiver_id: userId, status: "active" })
        .eq("id", relationshipId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Either side ends the relationship (or the patient cancels an invite). */
export function useEndRelationship(userId: string) {
  const invalidate = useInvalidate(userId);
  return useMutation({
    mutationFn: async (relationshipId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("care_relationships")
        .update({ status: "revoked" })
        .eq("id", relationshipId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/**
 * Queue a missed-reminder email alert to the caregiver themselves, then ask
 * the dispatch endpoint to process the outbox right away.
 */
export function useQueueMissedAlert() {
  return useMutation({
    mutationFn: async (input: {
      caregiverId: string;
      patientName: string;
      missedTitles: string[];
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from("notifications").insert({
        user_id: input.caregiverId,
        channel: "email" as const,
        title: `${input.patientName} has ${input.missedTitles.length} missed reminder${input.missedTitles.length === 1 ? "" : "s"} today`,
        body: input.missedTitles.join(", "),
        metadata: { kind: "missed_reminders" },
      });
      if (error) throw error;

      await fetch("/api/notifications/dispatch", { method: "POST" });
    },
  });
}
