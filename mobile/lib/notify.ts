/**
 * Local reminder notifications — the "Rekalla reminds you" payoff. Each saved
 * item gets an on-device notification at its date/time (untimed items fire at
 * 9am). We remember which notification belongs to which reminder so editing or
 * deleting an event can cancel the old alert instead of leaving a stale one.
 *
 * Best-effort throughout: never block saving on a notification failure.
 */
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** The shape we need off a reminder row to schedule it. */
export interface NotifiableReminder {
  id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  time_of_day: string | null; // HH:MM:SS, or null for all-day
  description?: string | null;
}

/** reminder id -> scheduled notification id */
const MAP_KEY = "rekalla:reminder-notifications";

async function readMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function writeMap(map: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
  } catch {
    // best-effort
  }
}

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

function triggerDate(date: string, time: string | null): Date | null {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  const [hh, mm] = (time ?? "09:00").split(":").map(Number);
  return new Date(y, m - 1, d, Number.isFinite(hh) ? hh : 9, Number.isFinite(mm) ? mm : 0, 0);
}

function body(r: NotifiableReminder): string {
  const bits = [r.time_of_day ? r.time_of_day.slice(0, 5) : null, r.description ?? null].filter(Boolean);
  return bits.length ? bits.join(" · ") : "Tap to open Rekalla.";
}

/** Drop the notification for one reminder, if we scheduled one. */
export async function cancelReminderNotification(reminderId: string): Promise<void> {
  const map = await readMap();
  const existing = map[reminderId];
  if (!existing) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(existing);
  } catch {
    // already fired or gone
  }
  delete map[reminderId];
  await writeMap(map);
}

/**
 * Make the device match one reminder: cancel whatever was scheduled for it and
 * schedule afresh. Past dates simply end up with no notification.
 */
export async function syncReminderNotification(r: NotifiableReminder): Promise<void> {
  await cancelReminderNotification(r.id);

  const when = triggerDate(r.start_date, r.time_of_day);
  if (!when || when.getTime() <= Date.now()) return;
  if (!(await ensurePermission())) return;

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title: r.title || "Reminder", body: body(r) },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
      },
    });
    const map = await readMap();
    map[r.id] = notificationId;
    await writeMap(map);
  } catch {
    // best-effort
  }
}

/** Schedule notifications for a batch of freshly-saved reminders. */
export async function syncReminderNotifications(rows: NotifiableReminder[]): Promise<void> {
  for (const r of rows) await syncReminderNotification(r);
}
