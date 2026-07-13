import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, font, radius, spacing } from "../../lib/theme";
import { firstName, formatTimeOfDay, toDateKey } from "../../lib/utils";
import { occurrencesFor, completionSummary, describeSchedule } from "../../lib/reminders";
import {
  useReminders,
  useReminderEvents,
  useSaveReminder,
  useDeleteReminder,
} from "../../hooks/data";
import { Screen, Card, Button, SectionTitle, EmptyNote, Loading } from "../../components/ui";
import { OccurrenceRow } from "../../components/occurrence-row";
import type { ReminderCategory } from "../../lib/types";

const CATEGORIES: { value: ReminderCategory; label: string }[] = [
  { value: "medication", label: "Medication" },
  { value: "meals", label: "Meals" },
  { value: "appointments", label: "Appointments" },
  { value: "exercise", label: "Exercise" },
  { value: "family_calls", label: "Family calls" },
  { value: "custom", label: "Personal" },
];

const RECURRENCES = [
  { value: "daily", label: "Every day" },
  { value: "once", label: "Just once" },
  { value: "weekly", label: "Weekly" },
] as const;

export default function ManagePatient() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const patientId = params.id;
  const patientName = params.name ?? "Patient";
  const { session } = useSession();
  const caregiverId = session?.user.id ?? "";
  const todayKey = toDateKey();
  const name = firstName(patientName);

  const reminders = useReminders(patientId);
  const events = useReminderEvents(patientId, todayKey);
  const save = useSaveReminder(patientId);
  const remove = useDeleteReminder(patientId);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ReminderCategory>("medication");
  const [time, setTime] = useState("09:00");
  const [recurrence, setRecurrence] =
    useState<(typeof RECURRENCES)[number]["value"]>("daily");
  const [formError, setFormError] = useState<string | null>(null);

  const occurrences = useMemo(
    () => occurrencesFor(reminders.data ?? [], events.data ?? [], todayKey),
    [reminders.data, events.data, todayKey],
  );
  const summary = completionSummary(occurrences);

  function handleAdd() {
    setFormError(null);
    if (!title.trim()) return setFormError("Please give the reminder a name.");
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      return setFormError("Time must look like 08:00 or 19:30.");
    }
    save.mutate(
      {
        user_id: patientId,
        created_by: caregiverId,
        title: title.trim(),
        category,
        time_of_day: time.trim(),
        recurrence,
        days_of_week: [],
        start_date: todayKey,
      },
      {
        onSuccess: () => {
          setTitle("");
          setShowForm(false);
        },
        onError: (error) => setFormError(error.message),
      },
    );
  }

  const loading = reminders.isLoading || events.isLoading;

  return (
    <>
      <Stack.Screen options={{ title: patientName }} />
      <Screen>
        <Text style={styles.summaryLine}>
          {loading
            ? "Loading today…"
            : summary.total === 0
              ? "No reminders scheduled today."
              : `${summary.done} of ${summary.total} reminders done today.`}
        </Text>

        <Button
          label={showForm ? "Cancel" : `Add reminder for ${name}`}
          variant={showForm ? "secondary" : "primary"}
          onPress={() => setShowForm((v) => !v)}
        />

        {showForm && (
          <Card>
            {formError && <Text style={styles.error}>{formError}</Text>}
            <Text style={styles.fieldLabel}>What should we remind {name} about?</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Take morning medication"
              placeholderTextColor={colors.label4}
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === option.value }}
                  onPress={() => setCategory(option.value)}
                  style={[
                    styles.chip,
                    category === option.value && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === option.value && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>At what time? (24-hour, like 08:00)</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="09:00"
              placeholderTextColor={colors.label4}
              style={styles.input}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.fieldLabel}>How often?</Text>
            <View style={styles.chips}>
              {RECURRENCES.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: recurrence === option.value }}
                  onPress={() => setRecurrence(option.value)}
                  style={[
                    styles.chip,
                    recurrence === option.value && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      recurrence === option.value && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button label="Add reminder" loading={save.isPending} onPress={handleAdd} />
          </Card>
        )}

        <SectionTitle>Today</SectionTitle>
        {loading ? (
          <Loading />
        ) : occurrences.length === 0 ? (
          <EmptyNote>Nothing scheduled for {name} today.</EmptyNote>
        ) : (
          occurrences.map((occurrence) => (
            <OccurrenceRow
              key={occurrence.reminder.id}
              occurrence={occurrence}
              readOnly
            />
          ))
        )}

        <SectionTitle>All reminders</SectionTitle>
        {(reminders.data ?? []).length === 0 ? (
          <EmptyNote>No reminders yet — add the first one above.</EmptyNote>
        ) : (
          (reminders.data ?? []).map((reminder) => (
            <View key={reminder.id} style={styles.reminderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderTitle}>{reminder.title}</Text>
                <Text style={styles.reminderMeta}>
                  {describeSchedule(reminder)}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`Delete ${reminder.title}`}
                onPress={() => remove.mutate(reminder.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash" size={20} color={colors.red} />
              </Pressable>
            </View>
          ))
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  summaryLine: { color: colors.label3, fontSize: font.base },
  error: { color: colors.red, fontSize: font.base, fontWeight: "600" },
  fieldLabel: { color: colors.label2, fontSize: font.base, fontWeight: "600" },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.elev2,
    color: colors.label,
    paddingHorizontal: spacing(4),
    fontSize: font.base,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  chip: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: spacing(4),
    backgroundColor: colors.elev2,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.label },
  chipText: { color: colors.label2, fontSize: font.sm, fontWeight: "600" },
  chipTextSelected: { color: "#000" },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  reminderTitle: { color: colors.label, fontSize: font.base, fontWeight: "700" },
  reminderMeta: { color: colors.label3, fontSize: font.sm, marginTop: 2 },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,69,58,0.12)",
  },
});
