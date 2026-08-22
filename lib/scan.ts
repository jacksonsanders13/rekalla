/**
 * Web client for the `scan` Edge Function + scan-image upload. Mirrors
 * mobile/lib/scan.ts so both platforms behave the same. The model key stays
 * server-side only.
 */
import { createClient } from "@/lib/supabase/client";

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

/** Read a File into a data URL for the vision call + preview. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function scanImage(
  imageDataUrl: string,
  hint: "calendar" | "appointment" | "bill" | "auto" = "auto",
): Promise<ScanResult> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<ScanResult>("scan", {
    body: { image_data_url: imageDataUrl, hint },
  });
  if (error) throw error;
  if (!data) throw new Error("empty scan response");
  return { doc_type: data.doc_type ?? "other", items: data.items ?? [] };
}

/** Upload the scanned image to the private vault-photos bucket under the user's folder. */
export async function uploadScanImage(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/scans/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("vault-photos")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return path;
}
