import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { uploadScanImage, type PickedPhoto } from "../lib/photos";
import { cancelReminderNotification, syncReminderNotification } from "../lib/notify";
import type { ScanItem } from "../lib/scan";

const db = supabase as unknown as { from: (t: string) => any };

export interface Reminder {
  id: string;
  title: string;
  category: string;
  start_date: string; // YYYY-MM-DD
  time_of_day: string | null; // HH:MM:SS or null (all-day)
  description: string | null;
  scan_id: string | null;
}

const COLUMNS = "id, title, category, start_date, time_of_day, description, scan_id";

const key = (userId: string) => ["reminders", userId];

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function scanCategory(type: ScanItem["type"]): string {
  if (type === "appointment") return "appointments";
  return type; // 'event' | 'bill'
}

function description(it: ScanItem): string | null {
  const parts = [it.location, it.amount ? `Amount: ${it.amount}` : null, it.notes].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** Save a scan: upload the image, record the scan, and add each item as a reminder. */
export function useSaveScan(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      photo: PickedPhoto;
      docType: string;
      items: ScanItem[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const imagePath = await uploadScanImage(user.id, input.photo);

      const { data: scan, error: scanErr } = await db
        .from("scans")
        .insert({
          user_id: user.id,
          image_path: imagePath,
          doc_type: input.docType,
          raw_json: input.items,
        })
        .select("id")
        .single();
      if (scanErr) throw scanErr;

      const rows = input.items.map((it) => ({
        user_id: user.id,
        created_by: user.id, // required by the reminders insert policy
        title: it.title || "Reminder",
        category: scanCategory(it.type),
        start_date: it.date,
        time_of_day: it.time ? `${it.time}:00` : null,
        description: description(it),
        recurrence: "once",
        is_active: true,
        scan_id: scan.id,
      }));
      let saved: Reminder[] = [];
      if (rows.length) {
        const { data, error } = await db
          .from("reminders")
          .insert(rows)
          .select(COLUMNS);
        if (error) throw error;
        saved = (data ?? []) as Reminder[];
      }
      return { scanId: scan.id as string, count: rows.length, saved };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(userId) }),
  });
}

/** Everything coming up from today onward, soonest first. */
export function useUpcomingReminders(userId: string) {
  return useQuery({
    queryKey: [...key(userId), "upcoming"],
    queryFn: async (): Promise<Reminder[]> => {
      const { data, error } = await db
        .from("reminders")
        .select(COLUMNS)
        .eq("user_id", userId)
        .eq("is_active", true)
        .gte("start_date", todayISO())
        .order("start_date", { ascending: true })
        .order("time_of_day", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as Reminder[];
    },
  });
}

/** All active dated reminders (for the calendar). */
export function useReminders(userId: string) {
  return useQuery({
    queryKey: [...key(userId), "all"],
    queryFn: async (): Promise<Reminder[]> => {
      const { data, error } = await db
        .from("reminders")
        .select(COLUMNS)
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("start_date", { ascending: true })
        .order("time_of_day", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as Reminder[];
    },
  });
}

/** One reminder by id — what the edit screen loads. */
export function useReminder(id: string) {
  return useQuery({
    queryKey: ["reminder", id],
    enabled: !!id,
    queryFn: async (): Promise<Reminder | null> => {
      const { data, error } = await db
        .from("reminders")
        .select(COLUMNS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Reminder | null;
    },
  });
}

/** The fields someone can change on an event they scanned (or typed in). */
export interface ReminderEdits {
  title: string;
  start_date: string; // YYYY-MM-DD
  time_of_day: string | null; // HH:MM:SS, or null for all-day
  description: string | null;
}

/** Save edits and move the device notification to match. */
export function useUpdateReminder(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; edits: ReminderEdits }): Promise<Reminder> => {
      const { data, error } = await db
        .from("reminders")
        .update(input.edits)
        .eq("id", input.id)
        .select(COLUMNS)
        .single();
      if (error) throw error;
      const row = data as Reminder;
      await syncReminderNotification(row);
      return row;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: key(userId) });
      qc.invalidateQueries({ queryKey: ["reminder", row.id] });
    },
  });
}

/** Remove an event for good, and cancel its notification. */
export function useDeleteReminder(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("reminders").delete().eq("id", id);
      if (error) throw error;
      await cancelReminderNotification(id);
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: key(userId) });
      qc.removeQueries({ queryKey: ["reminder", id] });
    },
  });
}
