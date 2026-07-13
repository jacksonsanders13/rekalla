import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { SNOOZE_MINUTES } from "../lib/utils";
import type {
  Profile,
  Reminder,
  ReminderEvent,
  RoutineItem,
  RoutineCompletion,
  VaultItem,
  WellnessEntry,
} from "../lib/types";
import type { TablesInsert } from "../lib/database.types";

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

export function useReminders(userId: string) {
  return useQuery({
    queryKey: ["reminders", userId],
    queryFn: async (): Promise<Reminder[]> => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", userId)
        .order("time_of_day");
      if (error) throw error;
      return data;
    },
  });
}

export function useReminderEvents(userId: string, dateKey: string) {
  return useQuery({
    queryKey: ["reminder-events", userId, dateKey],
    queryFn: async (): Promise<ReminderEvent[]> => {
      const { data, error } = await supabase
        .from("reminder_events")
        .select("*")
        .eq("user_id", userId)
        .eq("due_date", dateKey);
      if (error) throw error;
      return data;
    },
  });
}

export function useRecordReminderEvent(userId: string, dateKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      reminderId: string;
      action: "complete" | "snooze" | "reopen";
    }) => {
      if (input.action === "reopen") {
        const { error } = await supabase
          .from("reminder_events")
          .delete()
          .eq("reminder_id", input.reminderId)
          .eq("due_date", dateKey);
        if (error) throw error;
        return;
      }
      const status = input.action === "complete" ? "completed" : "snoozed";
      const { error } = await supabase.from("reminder_events").upsert(
        {
          reminder_id: input.reminderId,
          user_id: userId,
          due_date: dateKey,
          status,
          snoozed_until:
            status === "snoozed"
              ? new Date(Date.now() + SNOOZE_MINUTES * 60_000).toISOString()
              : null,
        },
        { onConflict: "reminder_id,due_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminder-events", userId] });
    },
  });
}

export function useSaveReminder(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"reminders">) => {
      const { error } = await supabase.from("reminders").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders", userId] });
    },
  });
}

export function useDeleteReminder(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders", userId] });
    },
  });
}

// ---------------------------------------------------------------------------
// Routine
// ---------------------------------------------------------------------------

export function useRoutineItems(userId: string) {
  return useQuery({
    queryKey: ["routine-items", userId],
    queryFn: async (): Promise<RoutineItem[]> => {
      const { data, error } = await supabase
        .from("routine_items")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("period")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useRoutineCompletions(userId: string, dateKey: string) {
  return useQuery({
    queryKey: ["routine-completions", userId, dateKey],
    queryFn: async (): Promise<RoutineCompletion[]> => {
      const { data, error } = await supabase
        .from("routine_completions")
        .select("*")
        .eq("user_id", userId)
        .eq("completed_on", dateKey);
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleRoutine(userId: string, dateKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { itemId: string; done: boolean }) => {
      if (input.done) {
        const { error } = await supabase.from("routine_completions").upsert(
          {
            routine_item_id: input.itemId,
            user_id: userId,
            completed_on: dateKey,
          },
          { onConflict: "routine_item_id,completed_on" },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("routine_completions")
          .delete()
          .eq("routine_item_id", input.itemId)
          .eq("completed_on", dateKey);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routine-completions", userId] });
    },
  });
}

// ---------------------------------------------------------------------------
// Vault
// ---------------------------------------------------------------------------

export function useVaultItems(userId: string) {
  return useQuery({
    queryKey: ["vault-items", userId],
    queryFn: async (): Promise<VaultItem[]> => {
      const { data, error } = await supabase
        .from("vault_items")
        .select("*")
        .eq("user_id", userId)
        .order("is_pinned", { ascending: false })
        .order("title");
      if (error) throw error;
      return data;
    },
  });
}

// ---------------------------------------------------------------------------
// Wellness
// ---------------------------------------------------------------------------

export function useWellnessEntries(userId: string, days = 30) {
  return useQuery({
    queryKey: ["wellness", userId, days],
    queryFn: async (): Promise<WellnessEntry[]> => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const key = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`;
      const { data, error } = await supabase
        .from("wellness_entries")
        .select("*")
        .eq("user_id", userId)
        .gte("entry_date", key)
        .order("entry_date");
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveWellness(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      entryDate: string;
      mood: number | null;
      sleepHours: number | null;
      energy: number | null;
      notes: string | null;
    }) => {
      const { error } = await supabase.from("wellness_entries").upsert(
        {
          user_id: userId,
          entry_date: input.entryDate,
          mood: input.mood,
          sleep_hours: input.sleepHours,
          energy: input.energy,
          notes: input.notes,
        },
        { onConflict: "user_id,entry_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wellness", userId] });
    },
  });
}

// ---------------------------------------------------------------------------
// Care links (caregiver <-> patient)
// ---------------------------------------------------------------------------

export interface LinkedPerson {
  relationshipId: string;
  profile: Profile;
}

export function useMyPatients(caregiverId: string) {
  return useQuery({
    queryKey: ["my-patients", caregiverId],
    queryFn: async (): Promise<LinkedPerson[]> => {
      const { data, error } = await supabase
        .from("care_relationships")
        .select("id, patient_id, profiles!care_relationships_patient_id_fkey(*)")
        .eq("caregiver_id", caregiverId)
        .eq("status", "active")
        .order("created_at");
      if (error) throw error;
      return (data ?? [])
        .filter((row) => row.profiles)
        .map((row) => ({
          relationshipId: row.id,
          profile: row.profiles as unknown as Profile,
        }));
    },
  });
}

export function useMyCaregivers(patientId: string) {
  return useQuery({
    queryKey: ["my-caregivers", patientId],
    queryFn: async (): Promise<LinkedPerson[]> => {
      const { data, error } = await supabase
        .from("care_relationships")
        .select("id, caregiver_id, profiles!care_relationships_caregiver_id_fkey(*)")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .order("created_at");
      if (error) throw error;
      return (data ?? [])
        .filter((row) => row.profiles)
        .map((row) => ({
          relationshipId: row.id,
          profile: row.profiles as unknown as Profile,
        }));
    },
  });
}

export function useConnectWithCode(caregiverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<Profile> => {
      const { data, error } = await supabase.rpc("connect_with_code", { code });
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-patients", caregiverId] });
    },
  });
}
