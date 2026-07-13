import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, font, spacing } from "../../lib/theme";
import { greetingFor, firstName, toDateKey } from "../../lib/utils";
import { occurrencesFor, openOccurrences, completionSummary } from "../../lib/reminders";
import {
  useReminders,
  useReminderEvents,
  useRecordReminderEvent,
  useRoutineItems,
  useRoutineCompletions,
  useWellnessEntries,
} from "../../hooks/data";
import { Screen, Card, SectionTitle, EmptyNote, Loading } from "../../components/ui";
import { ActivityRings } from "../../components/rings";
import { OccurrenceRow } from "../../components/occurrence-row";

export default function Summary() {
  const { session, profile } = useSession();
  const userId = session?.user.id ?? "";
  const todayKey = toDateKey();

  const reminders = useReminders(userId);
  const events = useReminderEvents(userId, todayKey);
  const record = useRecordReminderEvent(userId, todayKey);
  const routineItems = useRoutineItems(userId);
  const routineDone = useRoutineCompletions(userId, todayKey);
  const wellness = useWellnessEntries(userId, 7);

  const occurrences = useMemo(
    () => occurrencesFor(reminders.data ?? [], events.data ?? [], todayKey),
    [reminders.data, events.data, todayKey],
  );
  const open = openOccurrences(occurrences);
  const summary = completionSummary(occurrences);

  const routineTotal = routineItems.data?.length ?? 0;
  const doneIds = new Set((routineDone.data ?? []).map((c) => c.routine_item_id));
  const routineDoneCount = (routineItems.data ?? []).filter((i) =>
    doneIds.has(i.id),
  ).length;
  const todayEntry = (wellness.data ?? []).find((e) => e.entry_date === todayKey);

  const loading =
    reminders.isLoading || events.isLoading || routineItems.isLoading;

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>
            {new Date()
              .toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
              .toUpperCase()}
          </Text>
          <Text style={styles.greeting}>
            {greetingFor()}, {firstName(profile?.full_name)}
          </Text>
        </View>
        <Link href="/connect" asChild>
          <Pressable accessibilityLabel="My caregivers" style={styles.headerButton}>
            <Ionicons name="heart-outline" size={24} color={colors.label2} />
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable accessibilityLabel="Settings" style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color={colors.label2} />
          </Pressable>
        </Link>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <>
          <Card>
            <ActivityRings
              rings={[
                {
                  label: "Reminders",
                  color: colors.pink,
                  progress: summary.total > 0 ? summary.done / summary.total : 0,
                  value:
                    summary.total > 0
                      ? `${summary.done} of ${summary.total}`
                      : "None today",
                },
                {
                  label: "Routine",
                  color: colors.green,
                  progress:
                    routineTotal > 0 ? routineDoneCount / routineTotal : 0,
                  value:
                    routineTotal > 0
                      ? `${routineDoneCount} of ${routineTotal}`
                      : "Not set up",
                },
                {
                  label: "Check-in",
                  color: colors.teal,
                  progress: todayEntry ? 1 : 0,
                  value: todayEntry ? "Done" : "Not yet",
                },
              ]}
            />
          </Card>

          <SectionTitle>Up next</SectionTitle>
          {open.length === 0 ? (
            <EmptyNote>
              {summary.total === 0
                ? "No reminders scheduled for today."
                : "All caught up — nothing waiting on you."}
            </EmptyNote>
          ) : (
            open
              .slice(0, 5)
              .map((occurrence) => (
                <OccurrenceRow
                  key={occurrence.reminder.id}
                  occurrence={occurrence}
                  busy={record.isPending}
                  onAction={(action) =>
                    record.mutate({
                      reminderId: occurrence.reminder.id,
                      action,
                    })
                  }
                />
              ))
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing(1),
  },
  eyebrow: {
    color: colors.label3,
    fontSize: font.xs,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  greeting: {
    color: colors.label,
    fontSize: font.x3,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
