import type {
  Tables,
  CompletionStatus,
  ReminderCategory,
  RoutinePeriod,
  AccountType,
} from "./database.types";

export type Profile = Tables<"profiles">;
export type Reminder = Tables<"reminders">;
export type ReminderEvent = Tables<"reminder_events">;
export type RoutineItem = Tables<"routine_items">;
export type RoutineCompletion = Tables<"routine_completions">;
export type VaultItem = Tables<"vault_items">;
export type WellnessEntry = Tables<"wellness_entries">;

/** A reminder projected onto a specific day, joined with what happened. */
export interface ReminderOccurrence {
  reminder: Reminder;
  dateKey: string;
  status: CompletionStatus | "upcoming" | "overdue";
  event: ReminderEvent | null;
}

export type { CompletionStatus, ReminderCategory, RoutinePeriod, AccountType };
