/**
 * Edit one event. Anything Rekalla read off a photo can be corrected here:
 * what it is, which day, what time, and any note. Or removed altogether.
 * Saving moves the device reminder to match.
 */
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, radius, fonts } from "../../lib/theme";
import { a11y, a11yFont } from "../../lib/a11y";
import { BigButton, BigField, BodyText } from "../../components/big-ui";
import { MonthGrid } from "../../components/month-grid";
import { useReminder, useUpdateReminder, useDeleteReminder } from "../../hooks/scans";
import { formatFullDay, formatTime } from "../../lib/format";

/** Minutes-since-midnight <-> the HH:MM:SS the database stores. */
function toMinutes(timeOfDay: string | null): number {
  const [hh, mm] = (timeOfDay ?? "09:00").split(":").map(Number);
  return (Number.isFinite(hh) ? hh : 9) * 60 + (Number.isFinite(mm) ? mm : 0);
}
function hhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reminderId = String(id ?? "");
  const router = useRouter();
  const { session } = useSession();
  const userId = session?.user.id ?? "";

  const { data: reminder, isLoading } = useReminder(reminderId);
  const update = useUpdateReminder(userId);
  const remove = useDeleteReminder(userId);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [minutes, setMinutes] = useState(9 * 60);
  const [note, setNote] = useState("");
  const [pickingDate, setPickingDate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fill the form once the event arrives.
  useEffect(() => {
    if (!reminder) return;
    setTitle(reminder.title);
    setDate(reminder.start_date);
    setAllDay(!reminder.time_of_day);
    setMinutes(toMinutes(reminder.time_of_day));
    setNote(reminder.description ?? "");
  }, [reminder]);

  function bump(delta: number) {
    setMinutes((m) => (m + delta + 1440) % 1440);
  }

  async function save() {
    setError(null);
    try {
      await update.mutateAsync({
        id: reminderId,
        edits: {
          title: title.trim() || "Reminder",
          start_date: date,
          time_of_day: allDay ? null : `${hhmm(minutes)}:00`,
          description: note.trim() || null,
        },
      });
      router.back();
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "Please try again.";
      setError(`Didn't save: ${msg}`);
    }
  }

  function confirmDelete() {
    Alert.alert("Remove this event?", "It will come off your calendar and you won't be reminded.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await remove.mutateAsync(reminderId);
            router.back();
          } catch (e) {
            const msg = (e as { message?: string })?.message ?? "Please try again.";
            setError(`Didn't remove: ${msg}`);
          }
        },
      },
    ]);
  }

  const busy = update.isPending || remove.isPending;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">Edit</Text>
        <BigButton label="Close" icon="close" variant="secondary" onPress={() => router.back()} />
      </View>

      {isLoading ? (
        <View style={styles.body}><BodyText>Loading…</BodyText></View>
      ) : !reminder ? (
        <View style={styles.body}><BodyText>That event is gone.</BodyText></View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <BigField label="What is it?" value={title} onChangeText={setTitle} />

          {/* Day */}
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Day</Text>
            <Pressable
              onPress={() => setPickingDate((p) => !p)}
              accessibilityRole="button"
              accessibilityLabel={`Change the day. Currently ${formatFullDay(date)}`}
              style={({ pressed }) => [styles.dateRow, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="calendar" size={28} color={colors.blue} />
              <Text style={styles.dateText}>{formatFullDay(date)}</Text>
              <Ionicons name={pickingDate ? "chevron-up" : "chevron-down"} size={26} color={colors.label3} />
            </Pressable>
            {pickingDate ? (
              <MonthGrid
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setPickingDate(false);
                }}
              />
            ) : null}
          </View>

          {/* Time */}
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Time</Text>
            <View style={styles.toggleRow}>
              <Toggle label="All day" active={allDay} onPress={() => setAllDay(true)} />
              <Toggle label="At a time" active={!allDay} onPress={() => setAllDay(false)} />
            </View>
            {!allDay ? (
              <>
                <Text style={styles.timeText}>{formatTime(hhmm(minutes))}</Text>
                <StepRow label="Hour" onDown={() => bump(-60)} onUp={() => bump(60)} />
                <StepRow label="Minutes" onDown={() => bump(-5)} onUp={() => bump(5)} />
              </>
            ) : null}
          </View>

          <BigField
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Where it is, who to bring, an amount…"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <BigButton
            label={update.isPending ? "Saving…" : "Save"}
            icon="checkmark"
            onPress={save}
            disabled={busy}
          />
          <BigButton
            label="Remove this event"
            icon="trash"
            variant="danger"
            onPress={confirmDelete}
            disabled={busy}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Toggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.toggle, active && styles.toggleActive, pressed && { opacity: 0.8 }]}
    >
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StepRow({ label, onDown, onUp }: { label: string; onDown: () => void; onUp: () => void }) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepLabel}>{label}</Text>
      <Pressable
        onPress={onDown}
        accessibilityRole="button"
        accessibilityLabel={`${label} earlier`}
        style={styles.stepBtn}
      >
        <Ionicons name="remove" size={30} color={colors.label} />
      </Pressable>
      <Pressable
        onPress={onUp}
        accessibilityRole="button"
        accessibilityLabel={`${label} later`}
        style={styles.stepBtn}
      >
        <Ionicons name="add" size={30} color={colors.label} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: a11y.space(4),
    paddingVertical: a11y.space(3),
  },
  headerTitle: { color: colors.label, fontSize: a11yFont.title, fontFamily: fonts.bold, fontWeight: "700", flex: 1 },
  body: { padding: a11y.space(4), gap: a11y.space(4), paddingBottom: a11y.space(10) },
  block: { gap: a11y.space(2) },
  blockLabel: { color: colors.label2, fontSize: a11yFont.body, fontFamily: fonts.bold, fontWeight: "700" },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: a11y.space(3),
    minHeight: a11y.tapMin,
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    paddingHorizontal: a11y.space(4),
  },
  dateText: { flex: 1, color: colors.label, fontSize: a11yFont.body, fontFamily: fonts.bold, fontWeight: "700" },
  toggleRow: { flexDirection: "row", gap: a11y.space(3) },
  toggle: {
    flex: 1,
    minHeight: a11y.tapMin,
    borderRadius: radius.lg,
    backgroundColor: colors.elev1,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: colors.label },
  toggleText: { color: colors.label, fontSize: a11yFont.body, fontFamily: fonts.bold, fontWeight: "700" },
  toggleTextActive: { color: "#000000" },
  timeText: {
    color: colors.label,
    fontSize: a11yFont.hero, fontFamily: fonts.bold,
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: a11y.space(2),
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: a11y.space(3) },
  stepLabel: { flex: 1, color: colors.label2, fontSize: a11yFont.body },
  stepBtn: {
    width: a11y.tapMin,
    height: a11y.tapMin,
    borderRadius: radius.md,
    backgroundColor: colors.elev2,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: colors.red, fontSize: a11yFont.body, fontFamily: fonts.semibold, fontWeight: "600" },
});
