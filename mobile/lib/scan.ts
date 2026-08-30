/**
 * Client for the `scan` Edge Function: send a photo of a paper document, get
 * back the dated items the AI found. The model API key never touches the app.
 */
import { supabase } from "./supabase";
import { withRetry } from "./retry";
import type { PickedPhoto } from "./photos";

export type ScanItemType = "event" | "appointment" | "bill";

export interface ScanItem {
  type: ScanItemType;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM, omitted for all-day
  location?: string;
  amount?: string;
  notes?: string;
}

export interface ScanResult {
  doc_type: "calendar" | "appointment" | "bill" | "other";
  items: ScanItem[];
}

export async function scanPhoto(
  photo: PickedPhoto,
  hint: "calendar" | "appointment" | "bill" | "auto" = "auto",
): Promise<ScanResult> {
  const image_data_url = `data:${photo.mimeType};base64,${photo.base64}`;
  const data = await withRetry(async () => {
    const { data, error } = await supabase.functions.invoke<ScanResult>("scan", {
      body: { image_data_url, hint },
    });
    if (error) throw error;
    if (!data) throw new Error("empty scan response");
    return data;
  });
  return { doc_type: data.doc_type ?? "other", items: data.items ?? [] };
}
