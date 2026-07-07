import type {
  Tables,
  CompletionStatus,
  ReminderCategory,
  RoutinePeriod,
} from "./database";

export type Profile = Tables<"profiles">;
export type CareRelationship = Tables<"care_relationships">;
export type Reminder = Tables<"reminders">;
export type ReminderEvent = Tables<"reminder_events">;
export type RoutineItem = Tables<"routine_items">;
export type RoutineCompletion = Tables<"routine_completions">;
export type VaultItem = Tables<"vault_items">;
export type WellnessEntry = Tables<"wellness_entries">;
export type AppNotification = Tables<"notifications">;

/** A reminder projected onto a specific day, joined with what happened. */
export interface ReminderOccurrence {
  reminder: Reminder;
  dateKey: string;
  status: CompletionStatus | "upcoming" | "overdue";
  event: ReminderEvent | null;
}

/** A care relationship with the linked profile resolved. */
export interface CareLink extends CareRelationship {
  patient: Profile | null;
  caregiver: Profile | null;
}

export type { ReminderCategory, RoutinePeriod, CompletionStatus };
