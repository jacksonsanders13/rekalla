import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { planNotifications } from "./notification-plan";
import type { TFunc } from "./i18n";
import type { Reminder } from "./types";

/**
 * Local, on-device reminder notifications. Reminders are scheduled as
 * repeating local notifications on the Loved One's phone, so they fire even
 * when the app is closed — no push server needed.
 *
 * Note: on iOS these fire in a real build (dev build / TestFlight / App Store).
 * Expo Go has limited notification support, so testing the real buzz needs a
 * build.
 */

let handlerConfigured = false;

/** Show reminders as banners while the app is foregrounded. Call once at startup. */
export function configureNotifications() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** What the last sync managed to do, so the UI can be honest about it. */
export interface SyncResult {
  /** False when the person has not granted notification permission. */
  permitted: boolean;
  /** How many requests the phone accepted. */
  scheduled: number;
  /** Requests the planner produced but the phone rejected. */
  failed: number;
  /** When the soonest scheduled reminder will fire, if any. */
  nextAt: Date | null;
}

/**
 * Rebuild the phone's scheduled notifications from the current reminders.
 *
 * The decisions live in planNotifications, which is pure and tested. This
 * function only turns that plan into expo calls, so the scheduling rules
 * cannot drift away from what the calendar screen shows.
 *
 * Cancels everything first, so it is safe to call whenever reminders change,
 * when the app foregrounds, or when the clock jumps.
 */
export async function syncReminderNotifications(
  reminders: Reminder[],
  t: TFunc,
  now: Date = new Date(),
): Promise<SyncResult> {
  const empty: SyncResult = { permitted: true, scheduled: 0, failed: 0, nextAt: null };
  if (Platform.OS === "web") return empty;

  const granted = await requestNotificationPermission();
  if (!granted) return { ...empty, permitted: false };

  await Notifications.cancelAllScheduledNotificationsAsync();

  const plan = planNotifications(reminders, now);
  let scheduled = 0;
  let failed = 0;
  let nextAt: Date | null = null;

  for (const item of plan) {
    const content = {
      title: item.title,
      body: t(`notif.${item.category}`),
      sound: true,
      // Lets a tap open the right reminder instead of just the app.
      data: { reminderId: item.reminderId },
    };

    try {
      const trigger = item.trigger;
      if (trigger.kind === "daily") {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: trigger.hour,
            minute: trigger.minute,
          },
        });
      } else if (trigger.kind === "weekly") {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: trigger.weekday + 1, // JS 0=Sun -> expo 1=Sun
            hour: trigger.hour,
            minute: trigger.minute,
          },
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger.at,
          },
        });
        if (!nextAt || trigger.at < nextAt) nextAt = trigger.at;
      }
      scheduled++;
    } catch {
      // One bad reminder should not cost the person all the others.
      failed++;
    }
  }

  return { permitted: true, scheduled, failed, nextAt };
}
