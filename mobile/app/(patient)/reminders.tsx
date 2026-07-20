import { useMemo } from "react";
import { useSession } from "../../lib/session";
import { useT } from "../../lib/i18n";
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
  const t = useT();
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
      <Subtitle>{t("reminders.subtitle")}</Subtitle>
      {reminders.isLoading || events.isLoading ? (
        <Loading />
      ) : occurrences.length === 0 ? (
        <EmptyNote>{t("reminders.empty")}</EmptyNote>
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
