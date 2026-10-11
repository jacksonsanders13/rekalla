/**
 * Works out which notifications should exist on the phone, without touching
 * the phone.
 *
 * This is deliberately pure: no expo-notifications import, no Platform, no
 * Date.now() except through the `now` argument. That is what makes the
 * scheduling rules testable in plain Node, which matters because every bug
 * this file exists to fix was invisible until a specific date arrived.
 *
 * It replaces hand-written trigger construction that disagreed with
 * occursOn() in three ways, all of which produced a reminder the app showed
 * but never announced, or announced but never showed:
 *
 *   1. end_date was ignored entirely, so a reminder that finished in March
 *      kept buzzing in December.
 *   2. start_date was ignored for daily, weekly and monthly, so a reminder
 *      starting next month began notifying immediately.
 *   3. Monthly used iOS's CALENDAR trigger with the raw day-of-month, so a
 *      reminder anchored to the 31st simply never fired in February, while
 *      the calendar screen showed it on the 28th. occursOn clamps; the
 *      trigger could not.
 *
 * The fix for all three is the same: ask occursOn. Enumerating real dates
 * from the same function the UI uses means the two cannot drift apart again.
 *
 * Repeating triggers are still used where they are exactly right, because
 * they keep firing whether or not the app is ever opened again. Anything
 * occursOn would bound or clamp gets concrete dates instead.
 */
import { occursOn, dueAt } from "./reminders.ts";
import { toDateKey } from "./utils.ts";
import type { Reminder } from "./types.ts";

/**
 * iOS keeps at most 64 pending local notifications per app and silently drops
 * the rest, so the plan has to fit inside a budget rather than hope. The
 * headroom is for anything scheduled outside this planner.
 */
export const IOS_NOTIFICATION_LIMIT = 64;
export const DEFAULT_BUDGET = 60;

/** How far ahead concrete dates are enumerated. */
export const DEFAULT_HORIZON_DAYS = 120;

export type PlannedTrigger =
  | { kind: "daily"; hour: number; minute: number }
  /** weekday is JS convention, 0 = Sunday. The caller converts for expo. */
  | { kind: "weekly"; weekday: number; hour: number; minute: number }
  | { kind: "date"; at: Date };

export interface PlannedNotification {
  reminderId: string;
  title: string;
  /** Reminder category, for the body string the caller looks up. */
  category: string;
  trigger: PlannedTrigger;
}

/** A reminder repeats forever only if it starts today or earlier and never ends. */
function isUnbounded(reminder: Reminder, todayKey: string): boolean {
  return !reminder.end_date && reminder.start_date <= todayKey;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Every date this reminder occurs on, from today up to the horizon or its
 * end_date, whichever comes first. Driven entirely by occursOn.
 */
function enumerateDates(
  reminder: Reminder,
  now: Date,
  horizonDays: number,
): Date[] {
  const out: Date[] = [];
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i <= horizonDays; i++) {
    const day = addDays(start, i);
    const key = toDateKey(day);
    if (reminder.end_date && key > reminder.end_date) break;
    if (!occursOn(reminder, key)) continue;

    const at = dueAt(reminder, key);
    // A time that has already passed today is not schedulable.
    if (at.getTime() > now.getTime()) out.push(at);
  }
  return out;
}

/**
 * Turn the current reminders into the set of notifications the phone should
 * hold.
 *
 * Repeating entries are allocated first. They are unbounded in value, since
 * they survive the app never being opened again, so they get the budget
 * ahead of dated ones. Dated entries then fill whatever is left, soonest
 * first, so the next thing to happen is always scheduled.
 */
export function planNotifications(
  reminders: Reminder[],
  now: Date = new Date(),
  budget: number = DEFAULT_BUDGET,
  horizonDays: number = DEFAULT_HORIZON_DAYS,
): PlannedNotification[] {
  const todayKey = toDateKey(now);
  const repeating: PlannedNotification[] = [];
  const dated: (PlannedNotification & { at: number })[] = [];

  for (const r of reminders) {
    if (!r.is_active) continue;
    // Finished. The old code had no concept of this and kept firing.
    if (r.end_date && r.end_date < todayKey) continue;

    const [hour, minute] = r.time_of_day.split(":").map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) continue;

    const base = { reminderId: r.id, title: r.title, category: r.category };
    const unbounded = isUnbounded(r, todayKey);

    if (r.recurrence === "daily" && unbounded) {
      repeating.push({ ...base, trigger: { kind: "daily", hour, minute } });
      continue;
    }

    if (r.recurrence === "weekly" && unbounded) {
      const days =
        r.days_of_week.length > 0
          ? r.days_of_week
          : [new Date(`${r.start_date}T00:00:00`).getDay()];
      for (const weekday of [...new Set(days)].sort((a, b) => a - b)) {
        repeating.push({
          ...base,
          trigger: { kind: "weekly", weekday, hour, minute },
        });
      }
      continue;
    }

    // Everything else is bounded, starts later, or needs month-end clamping,
    // so it gets real dates that occursOn agreed to.
    for (const at of enumerateDates(r, now, horizonDays)) {
      dated.push({ ...base, trigger: { kind: "date", at }, at: at.getTime() });
    }
  }

  dated.sort((a, b) => a.at - b.at);

  const plan: PlannedNotification[] = repeating.slice(0, budget);
  for (const d of dated) {
    if (plan.length >= budget) break;
    const { at: _at, ...rest } = d;
    plan.push(rest);
  }
  return plan;
}

