"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { SNOOZE_MINUTES } from "@/lib/constants";
import type { Reminder, ReminderEvent } from "@/types";
import type { TablesInsert, TablesUpdate } from "@/types/database";

const remindersKey = (userId: string) => ["reminders", userId];
const eventsKey = (userId: string, dateKey: string) => [
  "reminder-events",
  userId,
  dateKey,
];

export function useReminders(userId: string) {
  return useQuery({
    queryKey: remindersKey(userId),
    queryFn: async (): Promise<Reminder[]> => {
      const supabase = createClient();
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
    queryKey: eventsKey(userId, dateKey),
    queryFn: async (): Promise<ReminderEvent[]> => {
      const supabase = createClient();
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

function useInvalidate(userId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: remindersKey(userId) });
    queryClient.invalidateQueries({ queryKey: ["reminder-events", userId] });
  };
}

export function useSaveReminder(userId: string) {
  const invalidate = useInvalidate(userId);
  return useMutation({
    mutationFn: async (
      input:
        | { id?: undefined; values: TablesInsert<"reminders"> }
        | { id: string; values: TablesUpdate<"reminders"> },
    ) => {
      const supabase = createClient();
      if (input.id) {
        const { error } = await supabase
          .from("reminders")
          .update(input.values)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("reminders")
          .insert(input.values as TablesInsert<"reminders">);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });
}

export function useDeleteReminder(userId: string) {
  const invalidate = useInvalidate(userId);
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Complete, snooze, skip, or reopen a reminder for a specific day. */
export function useRecordReminderEvent(userId: string, dateKey: string) {
  const invalidate = useInvalidate(userId);
  return useMutation({
    mutationFn: async (input: {
      reminderId: string;
      action: "complete" | "snooze" | "skip" | "reopen";
    }) => {
      const supabase = createClient();

      if (input.action === "reopen") {
        const { error } = await supabase
          .from("reminder_events")
          .delete()
          .eq("reminder_id", input.reminderId)
          .eq("due_date", dateKey);
        if (error) throw error;
        return;
      }

      const status =
        input.action === "complete"
          ? "completed"
          : input.action === "snooze"
            ? "snoozed"
            : "skipped";

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
    onSuccess: invalidate,
  });
}
