import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, font, radius, spacing } from "../../lib/theme";
import { firstName, toDateKey } from "../../lib/utils";
import { occurrencesFor, completionSummary, describeSchedule } from "../../lib/reminders";
import {
  useReminders,
  useReminderEvents,
  useSaveReminder,
  useDeleteReminder,
  useRoutineItems,
  useSaveRoutineItem,
  useDeleteRoutineItem,
  useVaultItems,
  useSaveVaultItem,
  useDeleteVaultItem,
} from "../../hooks/data";
import { Screen, Card, Button, SectionTitle, EmptyNote, Loading } from "../../components/ui";
import { OccurrenceRow } from "../../components/occurrence-row";
import type {
  ReminderCategory,
  RoutinePeriod,
  VaultCategory,
} from "../../lib/types";

type Tab = "reminders" | "routine" | "vault";

const TABS: { id: Tab; label: string }[] = [
  { id: "reminders", label: "Reminders" },
  { id: "routine", label: "Routine" },
  { id: "vault", label: "Memory" },
];

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

const PERIODS: { value: RoutinePeriod; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const VAULT_CATEGORIES: { value: VaultCategory; label: string }[] = [
  { value: "family", label: "Family" },
  { value: "contact", label: "Contact" },
  { value: "doctor", label: "Doctor" },
  { value: "medication", label: "Medication" },
  { value: "important_date", label: "Important date" },
  { value: "emergency", label: "Emergency" },
  { value: "note", label: "Note" },
];

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

export default function ManagePatient() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const patientId = params.id;
  const patientName = params.name ?? "Patient";
  const name = firstName(patientName);
  const [tab, setTab] = useState<Tab>("reminders");

  return (
    <>
      <Stack.Screen options={{ title: patientName }} />
      <Screen>
        <View style={styles.segmented}>
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === t.id }}
              onPress={() => setTab(t.id)}
              style={[styles.segment, tab === t.id && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  tab === t.id && styles.segmentTextActive,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "reminders" && (
          <RemindersSection patientId={patientId} name={name} />
        )}
        {tab === "routine" && (
          <RoutineSection patientId={patientId} name={name} />
        )}
        {tab === "vault" && <VaultSection patientId={patientId} name={name} />}
      </Screen>
    </>
  );
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

function RemindersSection({
  patientId,
  name,
}: {
  patientId: string;
  name: string;
}) {
  const { session } = useSession();
  const caregiverId = session?.user.id ?? "";
  const todayKey = toDateKey();

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
  const loading = reminders.isLoading || events.isLoading;

  function handleAdd() {
    setFormError(null);
    if (!title.trim()) return setFormError("Please give the reminder a name.");
    if (!TIME_RE.test(time.trim())) {
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

  return (
    <>
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
          <Text style={styles.fieldLabel}>
            What should we remind {name} about?
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Take morning medication"
            placeholderTextColor={colors.label4}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Category</Text>
          <Chips options={CATEGORIES} value={category} onChange={setCategory} />
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
          <Chips
            options={RECURRENCES}
            value={recurrence}
            onChange={setRecurrence}
          />
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
          <ManageRow
            key={reminder.id}
            title={reminder.title}
            meta={describeSchedule(reminder)}
            onDelete={() => remove.mutate(reminder.id)}
          />
        ))
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Routine
// ---------------------------------------------------------------------------

function RoutineSection({
  patientId,
  name,
}: {
  patientId: string;
  name: string;
}) {
  const items = useRoutineItems(patientId);
  const save = useSaveRoutineItem(patientId);
  const remove = useDeleteRoutineItem(patientId);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState<RoutinePeriod>("morning");
  const [time, setTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const all = items.data ?? [];

  function handleAdd() {
    setFormError(null);
    if (!title.trim()) return setFormError("Please name this step.");
    if (time.trim() && !TIME_RE.test(time.trim())) {
      return setFormError("Time must look like 08:00, or leave it blank.");
    }
    save.mutate(
      {
        user_id: patientId,
        title: title.trim(),
        period,
        time_of_day: time.trim() || null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setTime("");
          setShowForm(false);
        },
        onError: (error) => setFormError(error.message),
      },
    );
  }

  return (
    <>
      <Text style={styles.summaryLine}>
        Steps for {name}&apos;s day — they check these off themselves.
      </Text>

      <Button
        label={showForm ? "Cancel" : `Add a routine step for ${name}`}
        variant={showForm ? "secondary" : "primary"}
        onPress={() => setShowForm((v) => !v)}
      />

      {showForm && (
        <Card>
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Text style={styles.fieldLabel}>What&apos;s the step?</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Brush teeth"
            placeholderTextColor={colors.label4}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Time of day</Text>
          <Chips options={PERIODS} value={period} onChange={setPeriod} />
          <Text style={styles.fieldLabel}>
            Around what time? (optional, like 08:00)
          </Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="Leave blank if it doesn't matter"
            placeholderTextColor={colors.label4}
            style={styles.input}
            keyboardType="numbers-and-punctuation"
          />
          <Button label="Add step" loading={save.isPending} onPress={handleAdd} />
        </Card>
      )}

      {items.isLoading ? (
        <Loading />
      ) : all.length === 0 ? (
        <EmptyNote>No routine yet — add {name}&apos;s first step above.</EmptyNote>
      ) : (
        PERIODS.map((p) => {
          const periodItems = all.filter((i) => i.period === p.value);
          if (periodItems.length === 0) return null;
          return (
            <View key={p.value} style={{ gap: spacing(3) }}>
              <SectionTitle>{p.label}</SectionTitle>
              {periodItems.map((item) => (
                <ManageRow
                  key={item.id}
                  title={item.title}
                  meta={
                    item.time_of_day ? `around ${item.time_of_day}` : "any time"
                  }
                  onDelete={() => remove.mutate(item.id)}
                />
              ))}
            </View>
          );
        })
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Vault (memory bank)
// ---------------------------------------------------------------------------

function VaultSection({
  patientId,
  name,
}: {
  patientId: string;
  name: string;
}) {
  const items = useVaultItems(patientId);
  const save = useSaveVaultItem(patientId);
  const remove = useDeleteVaultItem(patientId);

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<VaultCategory>("family");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const all = items.data ?? [];

  function handleAdd() {
    setFormError(null);
    if (!title.trim()) return setFormError("Please give this a name.");
    save.mutate(
      {
        user_id: patientId,
        category,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setSubtitle("");
          setPhone("");
          setNotes("");
          setShowForm(false);
        },
        onError: (error) => setFormError(error.message),
      },
    );
  }

  return (
    <>
      <Text style={styles.summaryLine}>
        People, doctors, and details {name} can look up any time.
      </Text>

      <Button
        label={showForm ? "Cancel" : `Add to ${name}'s memory bank`}
        variant={showForm ? "secondary" : "primary"}
        onPress={() => setShowForm((v) => !v)}
      />

      {showForm && (
        <Card>
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Text style={styles.fieldLabel}>What kind of thing is this?</Text>
          <Chips
            options={VAULT_CATEGORIES}
            value={category}
            onChange={setCategory}
          />
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Dr. Alvarez, or Sarah (daughter)"
            placeholderTextColor={colors.label4}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Short description (optional)</Text>
          <TextInput
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="e.g. Primary care doctor"
            placeholderTextColor={colors.label4}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Phone number (optional)</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. (555) 123-4567"
            placeholderTextColor={colors.label4}
            style={styles.input}
            keyboardType="phone-pad"
          />
          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything helpful to remember"
            placeholderTextColor={colors.label4}
            style={[styles.input, styles.multiline]}
            multiline
          />
          <Button
            label="Save to memory bank"
            loading={save.isPending}
            onPress={handleAdd}
          />
        </Card>
      )}

      {items.isLoading ? (
        <Loading />
      ) : all.length === 0 ? (
        <EmptyNote>
          Nothing saved yet — add the first person or detail above.
        </EmptyNote>
      ) : (
        all.map((item) => (
          <ManageRow
            key={item.id}
            title={item.title}
            meta={
              item.subtitle ||
              item.phone ||
              VAULT_CATEGORIES.find((c) => c.value === item.category)?.label ||
              "Note"
            }
            onDelete={() => remove.mutate(item.id)}
          />
        ))
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          style={[styles.chip, value === option.value && styles.chipSelected]}
        >
          <Text
            style={[
              styles.chipText,
              value === option.value && styles.chipTextSelected,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ManageRow({
  title,
  meta,
  onDelete,
}: {
  title: string;
  meta: string;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <Pressable
        accessibilityLabel={`Delete ${title}`}
        accessibilityRole="button"
        onPress={onDelete}
        style={styles.deleteButton}
      >
        <Ionicons name="trash" size={20} color={colors.red} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.elev1,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md - 4,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: { backgroundColor: colors.label },
  segmentText: { color: colors.label2, fontSize: font.sm, fontWeight: "600" },
  segmentTextActive: { color: "#000" },
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
  multiline: { minHeight: 88, paddingTop: spacing(3), textAlignVertical: "top" },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  rowTitle: { color: colors.label, fontSize: font.base, fontWeight: "700" },
  rowMeta: { color: colors.label3, fontSize: font.sm, marginTop: 2 },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,69,58,0.12)",
  },
});
