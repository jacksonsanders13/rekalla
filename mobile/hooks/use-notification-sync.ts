/**
 * Keeps the phone's scheduled notifications in step with the reminders, and
 * reports what actually happened.
 *
 * Syncing used to run exactly once, in a useEffect on the summary screen. That
 * left three ways for the phone to fall behind what the app believed:
 *
 *   - the plan only reaches as far as its horizon, so an app left open for
 *     weeks ran off the end of its own schedule;
 *   - permission revoked in Settings while the app was backgrounded was never
 *     noticed;
 *   - crossing a timezone or a daylight-saving boundary changes when every
 *     reminder is due, and nothing recomputed.
 *
 * Re-syncing whenever the app comes to the foreground covers all three,
 * because every one of them requires the person to have been away.
 *
 * The returned status exists so a screen can be honest. A reminder app whose
 * notifications are silently off is worse than useless: the person is relying
 * on it.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { syncReminderNotifications, type SyncResult } from "../lib/notifications";
import type { TFunc } from "../lib/i18n";
import type { Reminder } from "../lib/types";

export type NotificationStatus =
  | { state: "pending" }
  | { state: "blocked" }
  | { state: "ready"; scheduled: number; nextAt: Date | null };

export function useReminderNotifications(
  reminders: Reminder[] | undefined,
  t: TFunc,
): NotificationStatus {
  const [status, setStatus] = useState<NotificationStatus>({ state: "pending" });

  // Held in a ref so the foreground listener is registered once rather than
  // being torn down and rebuilt every time a reminder changes.
  const remindersRef = useRef<Reminder[] | undefined>(reminders);
  remindersRef.current = reminders;
  const tRef = useRef(t);
  tRef.current = t;

  const sync = useCallback(async () => {
    const current = remindersRef.current;
    if (!current) return;
    try {
      const result: SyncResult = await syncReminderNotifications(
        current,
        tRef.current,
      );
      setStatus(
        result.permitted
          ? { state: "ready", scheduled: result.scheduled, nextAt: result.nextAt }
          : { state: "blocked" },
      );
    } catch {
      // A failed sync must not take the screen down with it. The person keeps
      // whatever was already scheduled.
    }
  }, []);

  useEffect(() => {
    void sync();
  }, [reminders, sync]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === "active") void sync();
    };
    const subscription = AppState.addEventListener("change", onChange);
    return () => subscription.remove();
  }, [sync]);

  return status;
}
