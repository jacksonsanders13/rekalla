import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { uploadScanImage, type PickedPhoto } from "../lib/photos";
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
        title: it.title || "Reminder",
        category: scanCategory(it.type),
        start_date: it.date,
        time_of_day: it.time ? `${it.time}:00` : null,
        description: description(it),
        recurrence: "once",
        is_active: true,
        scan_id: scan.id,
      }));
      if (rows.length) {
        const { error } = await db.from("reminders").insert(rows);
        if (error) throw error;
      }
      return { scanId: scan.id as string, count: rows.length };
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
        .select("id, title, category, start_date, time_of_day, description, scan_id")
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
        .select("id, title, category, start_date, time_of_day, description, scan_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("start_date", { ascending: true })
        .order("time_of_day", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as Reminder[];
    },
  });
}
