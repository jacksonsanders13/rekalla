"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RoutineItem, RoutineCompletion } from "@/types";
import type { TablesInsert, TablesUpdate } from "@/types/database";

const itemsKey = (userId: string) => ["routine-items", userId];
const completionsKey = (userId: string, dateKey: string) => [
  "routine-completions",
  userId,
  dateKey,
];

export function useRoutineItems(userId: string) {
  return useQuery({
    queryKey: itemsKey(userId),
    queryFn: async (): Promise<RoutineItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("routine_items")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("period")
        .order("sort_order")
        .order("time_of_day", { nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useRoutineCompletions(userId: string, dateKey: string) {
  return useQuery({
    queryKey: completionsKey(userId, dateKey),
    queryFn: async (): Promise<RoutineCompletion[]> => {
      const supabase = createClient();
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

function useInvalidate(userId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: itemsKey(userId) });
    queryClient.invalidateQueries({ queryKey: ["routine-completions", userId] });
  };
}

export function useSaveRoutineItem(userId: string) {
  const invalidate = useInvalidate(userId);
  return useMutation({
    mutationFn: async (
      input:
        | { id?: undefined; values: TablesInsert<"routine_items"> }
        | { id: string; values: TablesUpdate<"routine_items"> },
    ) => {
      const supabase = createClient();
      if (input.id) {
        const { error } = await supabase
          .from("routine_items")
          .update(input.values)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("routine_items")
          .insert(input.values as TablesInsert<"routine_items">);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });
}

export function useDeleteRoutineItem(userId: string) {
  const invalidate = useInvalidate(userId);
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("routine_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useToggleRoutineCompletion(userId: string, dateKey: string) {
  const invalidate = useInvalidate(userId);
  return useMutation({
    mutationFn: async (input: { itemId: string; done: boolean }) => {
      const supabase = createClient();
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
    onSuccess: invalidate,
  });
}
