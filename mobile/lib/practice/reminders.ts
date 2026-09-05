/**
 * The one reminder.
 *
 * A single local notification, at a time the person picks, that can be turned
 * off. Nothing is scheduled without being asked for, and the wording has no
 * urgency in it: this audience is targeted by people who use urgency to get
 * a response, and an app that nags reads the same way.
 *
 * Local only. Nothing is sent from a server, so the reminder works with no
 * account and no signal.
 */
import * as Notifications from "expo-notifications";

/**
 * Whole times of day rather than a spinner. Easier to hit, easier to read
 * back, and precise enough for something that repeats every day.
 */
export const REMINDER_CHOICES = [
  { label: "Morning, at 9", value: "09:00" },
  { label: "Midday, at 12", value: "12:00" },
  { label: "Afternoon, at 3", value: "15:00" },
  { label: "Evening, at 7", value: "19:00" },
] as const;

export function reminderLabel(value: string | null): string {
  if (!value) return "No reminder";
  return REMINDER_CHOICES.find((choice) => choice.value === value)?.label ?? value;
}

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Replaces whatever was scheduled with the new choice. Returns false when
 * permission was not granted, so the screen can say so plainly instead of
 * leaving someone expecting a reminder that will never come.
 */
export async function setDailyReminder(time: string | null): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!time) return true;

  const existing = await Notifications.getPermissionsAsync();
  const granted =
    existing.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;

  const [hour, minute] = time.split(":").map(Number);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to practise",
      body: "A few minutes with Rekalla, whenever you are ready.",
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}
