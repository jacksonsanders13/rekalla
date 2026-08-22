/**
 * Local reminder notifications — the "Rekalla reminds you" payoff. We schedule
 * an on-device notification for each saved item at its date/time (untimed items
 * fire at 9am). Best-effort: never block saving on a notification failure.
 */
import * as Notifications from "expo-notifications";
import type { ScanItem } from "./scan";

async function ensurePermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

function triggerDate(date: string, time?: string): Date | null {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  const [hh, mm] = (time ?? "09:00").split(":").map(Number);
  return new Date(y, m - 1, d, Number.isFinite(hh) ? hh : 9, Number.isFinite(mm) ? mm : 0, 0);
}

function body(it: ScanItem): string {
  const bits = [it.time ?? null, it.location ?? null, it.amount ? `Amount: ${it.amount}` : null].filter(Boolean);
  return bits.length ? bits.join(" · ") : "Tap to open Rekalla.";
}

/** Schedule notifications for freshly-saved scan items. Returns silently. */
export async function scheduleScanReminders(items: ScanItem[]): Promise<void> {
  if (!items.length) return;
  const ok = await ensurePermission();
  if (!ok) return;

  for (const it of items) {
    const when = triggerDate(it.date, it.time);
    if (!when || when.getTime() <= Date.now()) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: it.title || "Reminder", body: body(it) },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
        },
      });
    } catch {
      // best-effort per item
    }
  }
}
