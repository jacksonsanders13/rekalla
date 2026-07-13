/**
 * Database types mirroring supabase/migrations.
 *
 * Kept in sync by hand for now; once a Supabase project is linked you can
 * regenerate with: npx supabase gen types typescript --linked > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountType = "patient" | "caregiver";

export type ReminderCategory =
  | "medication"
  | "meals"
  | "appointments"
  | "exercise"
  | "family_calls"
  | "custom";

export type RecurrenceType = "once" | "daily" | "weekly" | "monthly";

export type CompletionStatus = "completed" | "snoozed" | "skipped";

export type RoutinePeriod = "morning" | "afternoon" | "evening";

export type VaultCategory =
  | "family"
  | "contact"
  | "doctor"
  | "medication"
  | "important_date"
  | "emergency"
  | "note";

export type CareStatus = "pending" | "active" | "revoked";

export type NotificationChannel = "push" | "email" | "sms";

export type NotificationStatus = "pending" | "sent" | "failed" | "cancelled";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          timezone: string;
          account_type: AccountType;
          connect_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          phone?: string | null;
          timezone?: string;
          account_type?: AccountType;
          connect_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          phone?: string | null;
          timezone?: string;
          account_type?: AccountType;
          connect_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      care_relationships: {
        Row: {
          id: string;
          patient_id: string;
          caregiver_id: string | null;
          invited_email: string;
          relationship: string | null;
          status: CareStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          caregiver_id?: string | null;
          invited_email: string;
          relationship?: string | null;
          status?: CareStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          caregiver_id?: string | null;
          invited_email?: string;
          relationship?: string | null;
          status?: CareStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          created_by: string | null;
          title: string;
          description: string | null;
          category: ReminderCategory;
          time_of_day: string;
          recurrence: RecurrenceType;
          days_of_week: number[];
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          category?: ReminderCategory;
          time_of_day: string;
          recurrence?: RecurrenceType;
          days_of_week?: number[];
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_by?: string | null;
          title?: string;
          description?: string | null;
          category?: ReminderCategory;
          time_of_day?: string;
          recurrence?: RecurrenceType;
          days_of_week?: number[];
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reminder_events: {
        Row: {
          id: string;
          reminder_id: string;
          user_id: string;
          due_date: string;
          status: CompletionStatus;
          snoozed_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reminder_id: string;
          user_id: string;
          due_date: string;
          status: CompletionStatus;
          snoozed_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reminder_id?: string;
          user_id?: string;
          due_date?: string;
          status?: CompletionStatus;
          snoozed_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      routine_items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          period: RoutinePeriod;
          time_of_day: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          period: RoutinePeriod;
          time_of_day?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          period?: RoutinePeriod;
          time_of_day?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      routine_completions: {
        Row: {
          id: string;
          routine_item_id: string;
          user_id: string;
          completed_on: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          routine_item_id: string;
          user_id: string;
          completed_on?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          routine_item_id?: string;
          user_id?: string;
          completed_on?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      vault_items: {
        Row: {
          id: string;
          user_id: string;
          category: VaultCategory;
          title: string;
          subtitle: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          date_value: string | null;
          notes: string | null;
          photo_url: string | null;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: VaultCategory;
          title: string;
          subtitle?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          date_value?: string | null;
          notes?: string | null;
          photo_url?: string | null;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: VaultCategory;
          title?: string;
          subtitle?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          date_value?: string | null;
          notes?: string | null;
          photo_url?: string | null;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wellness_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          mood: number | null;
          sleep_hours: number | null;
          energy: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date?: string;
          mood?: number | null;
          sleep_hours?: number | null;
          energy?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_date?: string;
          mood?: number | null;
          sleep_hours?: number | null;
          energy?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          channel: NotificationChannel;
          title: string;
          body: string | null;
          scheduled_for: string;
          status: NotificationStatus;
          sent_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel: NotificationChannel;
          title: string;
          body?: string | null;
          scheduled_for?: string;
          status?: NotificationStatus;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel?: NotificationChannel;
          title?: string;
          body?: string | null;
          scheduled_for?: string;
          status?: NotificationStatus;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_caregiver_of: {
        Args: { patient: string };
        Returns: boolean;
      };
      is_linked_to: {
        Args: { other: string };
        Returns: boolean;
      };
      connect_with_code: {
        Args: { code: string };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
    };
    Enums: {
      account_type: AccountType;
      reminder_category: ReminderCategory;
      recurrence_type: RecurrenceType;
      completion_status: CompletionStatus;
      routine_period: RoutinePeriod;
      vault_category: VaultCategory;
      care_status: CareStatus;
      notification_channel: NotificationChannel;
      notification_status: NotificationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
