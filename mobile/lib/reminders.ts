import type { Reminder, ReminderEvent, ReminderOccurrence } from "./types";
import { fromDateKey, toDateKey } from "./utils";

/** Does this reminder occur on the given local date? */
export function occursOn(reminder: Reminder, dateKey: string): boolean {
  if (!reminder.is_active) return false;
  if (dateKey < reminder.start_date) return false;
  if (reminder.end_date && dateKey > reminder.end_date) return false;

  const date = fromDateKey(dateKey);
  const start = fromDateKey(reminder.start_date);

  switch (reminder.recurrence) {
    case "once":
      return dateKey === reminder.start_date;
    case "daily":
      return true;
    case "weekly": {
      const days =
        reminder.days_of_week.length > 0
          ? reminder.days_of_week
          : [start.getDay()];
      return days.includes(date.getDay());
    }
    case "monthly": {
      const targetDay = start.getDate();
      const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
      ).getDate();
      // A reminder anchored to the 31st still fires on the last day of
      // shorter months.
      return date.getDate() === Math.min(targetDay, daysInMonth);
    }
  }
}

/** The moment a reminder is due on a given day, in local time. */
export function dueAt(reminder: Reminder, dateKey: string): Date {
  const date = fromDateKey(dateKey);
  const [hours, minutes] = reminder.time_of_day.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Project reminders onto a single day and resolve each one's status from
 * its recorded event (if any) and the current time.
 */
export function occurrencesFor(
  reminders: Reminder[],
  events: ReminderEvent[],
  dateKey: string,
  now: Date = new Date(),
): ReminderOccurrence[] {
  const eventsByReminder = new Map(
    events
      .filter((event) => event.due_date === dateKey)
      .map((event) => [event.reminder_id, event]),
  );

  return reminders
    .filter((reminder) => occursOn(reminder, dateKey))
    .map((reminder) => {
      const event = eventsByReminder.get(reminder.id) ?? null;
      return {
        reminder,
        dateKey,
        event,
        status: resolveStatus(reminder, event, dateKey, now),
      };
    })
    .sort(
      (a, b) =>
        dueAt(a.reminder, dateKey).getTime() -
        dueAt(b.reminder, dateKey).getTime(),
    );
}

function resolveStatus(
  reminder: Reminder,
  event: ReminderEvent | null,
  dateKey: string,
  now: Date,
): ReminderOccurrence["status"] {
  if (event) {
    if (event.status === "snoozed") {
      // A snooze only holds until its wake-up time; then the reminder is
      // due again.
      if (event.snoozed_until && new Date(event.snoozed_until) > now) {
        return "snoozed";
      }
      return "overdue";
    }
    return event.status;
  }
  if (dateKey < toDateKey(now)) return "overdue";
  if (dateKey > toDateKey(now)) return "upcoming";
  return dueAt(reminder, dateKey) <= now ? "overdue" : "upcoming";
}

/** Occurrences that still need doing (due now or missed). */
export function openOccurrences(
  occurrences: ReminderOccurrence[],
): ReminderOccurrence[] {
  return occurrences.filter(
    (o) => o.status === "upcoming" || o.status === "overdue",
  );
}

/** Completion ratio for a day, e.g. { done: 3, total: 5 }. */
export function completionSummary(occurrences: ReminderOccurrence[]) {
  const total = occurrences.length;
  const done = occurrences.filter((o) => o.status === "completed").length;
  const missed = occurrences.filter((o) => o.status === "overdue").length;
  return { done, missed, total };
}

/** Human description of a reminder's schedule ("Every day at 8:00 AM"). */
export function describeSchedule(reminder: Reminder): string {
  const time = formatTime(reminder.time_of_day);
  switch (reminder.recurrence) {
    case "once": {
      const date = fromDateKey(reminder.start_date).toLocaleDateString(
        "en-US",
        { weekday: "long", month: "long", day: "numeric" },
      );
      return `${date} at ${time}`;
    }
    case "daily":
      return `Every day at ${time}`;
    case "weekly": {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const days =
        reminder.days_of_week.length > 0
          ? reminder.days_of_week
          : [fromDateKey(reminder.start_date).getDay()];
      const list = [...days].sort().map((d) => dayNames[d]).join(", ");
      return `Every ${list} at ${time}`;
    }
    case "monthly": {
      const day = fromDateKey(reminder.start_date).getDate();
      return `Monthly on day ${day} at ${time}`;
    }
  }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
