import { useMemo } from "react";
import { useSession } from "../../lib/session";
import { toDateKey } from "../../lib/utils";
import { occurrencesFor } from "../../lib/reminders";
import {
  useReminders,
  useReminderEvents,
  useRecordReminderEvent,
} from "../../hooks/data";
import { Screen, Subtitle, EmptyNote, Loading } from "../../components/ui";
import { OccurrenceRow } from "../../components/occurrence-row";

export default function Reminders() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const todayKey = toDateKey();

  const reminders = useReminders(userId);
  const events = useReminderEvents(userId, todayKey);
  const record = useRecordReminderEvent(userId, todayKey);

  const occurrences = useMemo(
    () => occurrencesFor(reminders.data ?? [], events.data ?? [], todayKey),
    [reminders.data, events.data, todayKey],
  );

  return (
    <Screen>
      <Subtitle>
        Check things off as you go. Your caregiver keeps this list up to date.
      </Subtitle>
      {reminders.isLoading || events.isLoading ? (
        <Loading />
      ) : occurrences.length === 0 ? (
        <EmptyNote>
          Nothing scheduled today. Reminders your caregiver adds will show up
          here.
        </EmptyNote>
      ) : (
        occurrences.map((occurrence) => (
          <OccurrenceRow
            key={occurrence.reminder.id}
            occurrence={occurrence}
            busy={record.isPending}
            onAction={(action) =>
              record.mutate({ reminderId: occurrence.reminder.id, action })
            }
          />
        ))
      )}
    </Screen>
  );
}
