import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { fromDateKey } from "./utils";
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

function parseTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

/**
 * Rebuild the phone's scheduled notifications from the current reminders.
 * Cancels everything and reschedules, so it's safe to call whenever reminders
 * change.
 */
export async function syncReminderNotifications(
  reminders: Reminder[],
  t: TFunc,
) {
  if (Platform.OS === "web") return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const r of reminders) {
    if (!r.is_active) continue;
    const { hour, minute } = parseTime(r.time_of_day);
    const content = {
      title: r.title,
      body: t(`notif.${r.category}`),
      sound: true,
    };

    try {
      if (r.recurrence === "daily") {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          },
        });
      } else if (r.recurrence === "weekly") {
        const days =
          r.days_of_week.length > 0
            ? r.days_of_week
            : [fromDateKey(r.start_date).getDay()];
        for (const jsDay of days) {
          await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: jsDay + 1, // JS 0=Sun -> expo 1=Sun
              hour,
              minute,
            },
          });
        }
      } else if (r.recurrence === "monthly") {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            day: fromDateKey(r.start_date).getDate(),
            hour,
            minute,
            repeats: true,
          },
        });
      } else if (r.recurrence === "once") {
        const when = fromDateKey(r.start_date);
        when.setHours(hour, minute, 0, 0);
        if (when.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: when,
            },
          });
        }
      }
    } catch {
      // A single reminder failing to schedule shouldn't break the rest.
    }
  }
}
