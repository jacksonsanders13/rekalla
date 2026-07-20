import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { useT, type TFunc } from "../../lib/i18n";
import { colors, font, radius, spacing } from "../../lib/theme";
import { firstName, formatTimeOfDay, fromDateKey, toDateKey } from "../../lib/utils";
import { pickPhoto, uploadVaultPhoto, type PickedPhoto } from "../../lib/photos";
import { occurrencesFor, completionSummary } from "../../lib/reminders";
import {
  useReminders,
  useReminderEvents,
  useSaveReminder,
  useUpdateReminder,
  useDeleteReminder,
  useRoutineItems,
  useSaveRoutineItem,
  useUpdateRoutineItem,
  useDeleteRoutineItem,
  useVaultItems,
  useSaveVaultItem,
  useUpdateVaultItem,
  useDeleteVaultItem,
} from "../../hooks/data";
import { Screen, Card, Button, SectionTitle, EmptyNote, Loading } from "../../components/ui";
import { OccurrenceRow } from "../../components/occurrence-row";
import type {
  Reminder,
  RoutineItem,
  VaultItem,
  ReminderCategory,
  RoutinePeriod,
  VaultCategory,
} from "../../lib/types";

type Tab = "reminders" | "routine" | "vault";

const TABS: { id: Tab; labelKey: string }[] = [
  { id: "reminders", labelKey: "mgr.tab.reminders" },
  { id: "routine", labelKey: "mgr.tab.routine" },
  { id: "vault", labelKey: "mgr.tab.vault" },
];

const CATEGORIES: { value: ReminderCategory; labelKey: string }[] = [
  { value: "medication", labelKey: "cat.medication" },
  { value: "meals", labelKey: "cat.meals" },
  { value: "appointments", labelKey: "cat.appointments" },
  { value: "exercise", labelKey: "cat.exercise" },
  { value: "family_calls", labelKey: "cat.family_calls" },
  { value: "custom", labelKey: "cat.custom" },
];

const RECURRENCES = [
  { value: "daily", labelKey: "freq.daily" },
  { value: "once", labelKey: "freq.once" },
  { value: "weekly", labelKey: "freq.weekly" },
] as const;

type FormRecurrence = (typeof RECURRENCES)[number]["value"];

const PERIODS: { value: RoutinePeriod; labelKey: string }[] = [
  { value: "morning", labelKey: "routine.morning" },
  { value: "afternoon", labelKey: "routine.afternoon" },
  { value: "evening", labelKey: "routine.evening" },
];

const VAULT_CATEGORIES: { value: VaultCategory; labelKey: string }[] = [
  { value: "family", labelKey: "vcat.family" },
  { value: "contact", labelKey: "vcat.contact" },
  { value: "doctor", labelKey: "vcat.doctor" },
  { value: "medication", labelKey: "vcat.medication" },
  { value: "important_date", labelKey: "vcat.important_date" },
  { value: "emergency", labelKey: "vcat.emergency" },
  { value: "note", labelKey: "vcat.note" },
];

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

function scheduleText(reminder: Reminder, t: TFunc): string {
  const time = formatTimeOfDay(reminder.time_of_day);
  switch (reminder.recurrence) {
    case "daily":
      return t("sched.everyDay", { time });
    case "once": {
      const date = fromDateKey(reminder.start_date).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      return t("sched.onDate", { date, time });
    }
    case "weekly": {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const days =
        reminder.days_of_week.length > 0
          ? reminder.days_of_week
          : [fromDateKey(reminder.start_date).getDay()];
      const list = [...days].sort().map((d) => dayNames[d]).join(", ");
      return t("sched.every", { days: list, time });
    }
    case "monthly": {
      const day = fromDateKey(reminder.start_date).getDate();
      return t("sched.monthly", { day, time });
    }
  }
}

export default function ManagePatient() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const t = useT();
  const patientId = params.id;
  const patientName = params.name ?? t("auth.signUp.patient");
  const name = firstName(patientName);
  const [tab, setTab] = useState<Tab>("reminders");

  return (
    <>
      <Stack.Screen options={{ title: patientName }} />
      <Screen>
        <View style={styles.segmented}>
          {TABS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === item.id }}
              onPress={() => setTab(item.id)}
              style={[styles.segment, tab === item.id && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  tab === item.id && styles.segmentTextActive,
                ]}
              >
                {t(item.labelKey)}
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
  const t = useT();
  const caregiverId = session?.user.id ?? "";
  const todayKey = toDateKey();

  const reminders = useReminders(patientId);
  const events = useReminderEvents(patientId, todayKey);
  const save = useSaveReminder(patientId);
  const update = useUpdateReminder(patientId);
  const remove = useDeleteReminder(patientId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ReminderCategory>("medication");
  const [time, setTime] = useState("09:00");
  const [recurrence, setRecurrence] = useState<FormRecurrence>("daily");
  const [formError, setFormError] = useState<string | null>(null);

  const occurrences = useMemo(
    () => occurrencesFor(reminders.data ?? [], events.data ?? [], todayKey),
    [reminders.data, events.data, todayKey],
  );
  const summary = completionSummary(occurrences);
  const loading = reminders.isLoading || events.isLoading;

  function reset() {
    setEditingId(null);
    setTitle("");
    setCategory("medication");
    setTime("09:00");
    setRecurrence("daily");
    setFormError(null);
    setShowForm(false);
  }

  function startEdit(reminder: Reminder) {
    setEditingId(reminder.id);
    setTitle(reminder.title);
    setCategory(reminder.category);
    setTime(reminder.time_of_day);
    setRecurrence(
      RECURRENCES.some((r) => r.value === reminder.recurrence)
        ? (reminder.recurrence as FormRecurrence)
        : "daily",
    );
    setFormError(null);
    setShowForm(true);
  }

  function handleSubmit() {
    setFormError(null);
    if (!title.trim()) return setFormError(t("mgr.err.name"));
    if (!TIME_RE.test(time.trim())) {
      return setFormError(t("mgr.err.time"));
    }
    if (editingId) {
      update.mutate(
        {
          id: editingId,
          values: {
            title: title.trim(),
            category,
            time_of_day: time.trim(),
            recurrence,
          },
        },
        { onSuccess: reset, onError: (e) => setFormError(e.message) },
      );
    } else {
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
        { onSuccess: reset, onError: (e) => setFormError(e.message) },
      );
    }
  }

  return (
    <>
      <Text style={styles.summaryLine}>
        {loading
          ? t("common.loading")
          : summary.total === 0
            ? t("mgr.rem.none")
            : t("mgr.rem.summary", { done: summary.done, total: summary.total })}
      </Text>

      <Button
        label={showForm ? t("common.cancel") : t("mgr.rem.add", { name })}
        variant={showForm ? "secondary" : "primary"}
        onPress={() => (showForm ? reset() : setShowForm(true))}
      />

      {showForm && (
        <Card>
          {editingId && <Text style={styles.editingLabel}>{t("mgr.rem.editing")}</Text>}
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Text style={styles.fieldLabel}>{t("mgr.rem.q1", { name })}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("mgr.rem.q1Placeholder")}
            placeholderTextColor={colors.label4}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>{t("mgr.rem.category")}</Text>
          <Chips options={CATEGORIES} value={category} onChange={setCategory} />
          <Text style={styles.fieldLabel}>{t("mgr.rem.time")}</Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="09:00"
            placeholderTextColor={colors.label4}
            style={styles.input}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.fieldLabel}>{t("mgr.rem.freq")}</Text>
          <Chips
            options={RECURRENCES}
            value={recurrence}
            onChange={setRecurrence}
          />
          <Button
            label={editingId ? t("mgr.rem.saveBtn") : t("mgr.rem.addBtn")}
            loading={save.isPending || update.isPending}
            onPress={handleSubmit}
          />
        </Card>
      )}

      <SectionTitle>{t("mgr.rem.today")}</SectionTitle>
      {loading ? (
        <Loading />
      ) : occurrences.length === 0 ? (
        <EmptyNote>{t("mgr.rem.nothingToday", { name })}</EmptyNote>
      ) : (
        occurrences.map((occurrence) => (
          <OccurrenceRow
            key={occurrence.reminder.id}
            occurrence={occurrence}
            readOnly
          />
        ))
      )}

      <SectionTitle>{t("mgr.rem.all")}</SectionTitle>
      {(reminders.data ?? []).length === 0 ? (
        <EmptyNote>{t("mgr.rem.allEmpty")}</EmptyNote>
      ) : (
        (reminders.data ?? []).map((reminder) => (
          <ManageRow
            key={reminder.id}
            title={reminder.title}
            meta={scheduleText(reminder, t)}
            active={editingId === reminder.id}
            onEdit={() => startEdit(reminder)}
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
  const t = useT();
  const items = useRoutineItems(patientId);
  const save = useSaveRoutineItem(patientId);
  const update = useUpdateRoutineItem(patientId);
  const remove = useDeleteRoutineItem(patientId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState<RoutinePeriod>("morning");
  const [time, setTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const all = items.data ?? [];

  function reset() {
    setEditingId(null);
    setTitle("");
    setPeriod("morning");
    setTime("");
    setFormError(null);
    setShowForm(false);
  }

  function startEdit(item: RoutineItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setPeriod(item.period);
    setTime(item.time_of_day ?? "");
    setFormError(null);
    setShowForm(true);
  }

  function handleSubmit() {
    setFormError(null);
    if (!title.trim()) return setFormError(t("mgr.err.stepName"));
    if (time.trim() && !TIME_RE.test(time.trim())) {
      return setFormError(t("mgr.err.timeOptional"));
    }
    if (editingId) {
      update.mutate(
        {
          id: editingId,
          values: {
            title: title.trim(),
            period,
            time_of_day: time.trim() || null,
          },
        },
        { onSuccess: reset, onError: (e) => setFormError(e.message) },
      );
    } else {
      save.mutate(
        {
          user_id: patientId,
          title: title.trim(),
          period,
          time_of_day: time.trim() || null,
        },
        { onSuccess: reset, onError: (e) => setFormError(e.message) },
      );
    }
  }

  return (
    <>
      <Text style={styles.summaryLine}>{t("mgr.rt.summary", { name })}</Text>

      <Button
        label={showForm ? t("common.cancel") : t("mgr.rt.add", { name })}
        variant={showForm ? "secondary" : "primary"}
        onPress={() => (showForm ? reset() : setShowForm(true))}
      />

      {showForm && (
        <Card>
          {editingId && <Text style={styles.editingLabel}>{t("mgr.rt.editing")}</Text>}
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Text style={styles.fieldLabel}>{t("mgr.rt.q1")}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("mgr.rt.q1Placeholder")}
            placeholderTextColor={colors.label4}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>{t("mgr.rt.period")}</Text>
          <Chips options={PERIODS} value={period} onChange={setPeriod} />
          <Text style={styles.fieldLabel}>{t("mgr.rt.time")}</Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder={t("mgr.rt.timePlaceholder")}
            placeholderTextColor={colors.label4}
            style={styles.input}
            keyboardType="numbers-and-punctuation"
          />
          <Button
            label={editingId ? t("mgr.rem.saveBtn") : t("mgr.rt.addBtn")}
            loading={save.isPending || update.isPending}
            onPress={handleSubmit}
          />
        </Card>
      )}

      {items.isLoading ? (
        <Loading />
      ) : all.length === 0 ? (
        <EmptyNote>{t("mgr.rt.empty", { name })}</EmptyNote>
      ) : (
        PERIODS.map((p) => {
          const periodItems = all.filter((i) => i.period === p.value);
          if (periodItems.length === 0) return null;
          return (
            <View key={p.value} style={{ gap: spacing(3) }}>
              <SectionTitle>{t(p.labelKey)}</SectionTitle>
              {periodItems.map((item) => (
                <ManageRow
                  key={item.id}
                  title={item.title}
                  meta={
                    item.time_of_day
                      ? t("routine.around", { time: item.time_of_day })
                      : t("mgr.rt.anyTime")
                  }
                  active={editingId === item.id}
                  onEdit={() => startEdit(item)}
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
  const { session } = useSession();
  const t = useT();
  const caregiverId = session?.user.id ?? "";
  const items = useVaultItems(patientId);
  const save = useSaveVaultItem(patientId);
  const update = useUpdateVaultItem(patientId);
  const remove = useDeleteVaultItem(patientId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<VaultCategory>("family");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const all = items.data ?? [];

  function reset() {
    setEditingId(null);
    setCategory("family");
    setTitle("");
    setSubtitle("");
    setPhone("");
    setNotes("");
    setPhoto(null);
    setExistingPhotoUrl(null);
    setSaving(false);
    setFormError(null);
    setShowForm(false);
  }

  function startEdit(item: VaultItem) {
    setEditingId(item.id);
    setCategory(item.category);
    setTitle(item.title);
    setSubtitle(item.subtitle ?? "");
    setPhone(item.phone ?? "");
    setNotes(item.notes ?? "");
    setPhoto(null);
    setExistingPhotoUrl(item.photo_url);
    setFormError(null);
    setShowForm(true);
  }

  async function handlePickPhoto() {
    setFormError(null);
    const picked = await pickPhoto();
    if (picked) setPhoto(picked);
  }

  async function handleSubmit() {
    setFormError(null);
    if (!title.trim()) return setFormError(t("mgr.err.vaultName"));
    setSaving(true);

    let photoUrl: string | null = existingPhotoUrl;
    if (photo) {
      try {
        photoUrl = await uploadVaultPhoto(caregiverId, photo);
      } catch {
        setSaving(false);
        setFormError(t("mgr.vt.photoErr"));
        return;
      }
    }

    const values = {
      category,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      photo_url: photoUrl,
    };

    if (editingId) {
      update.mutate(
        { id: editingId, values },
        {
          onSuccess: reset,
          onError: (e) => {
            setSaving(false);
            setFormError(e.message);
          },
        },
      );
    } else {
      save.mutate(
        { user_id: patientId, ...values },
        {
          onSuccess: reset,
          onError: (e) => {
            setSaving(false);
            setFormError(e.message);
          },
        },
      );
    }
  }

  const shownPhotoUri = photo?.previewUri ?? existingPhotoUrl ?? null;

  return (
    <>
      <Text style={styles.summaryLine}>{t("mgr.vt.summary", { name })}</Text>

      <Button
        label={showForm ? t("common.cancel") : t("mgr.vt.add", { name })}
        variant={showForm ? "secondary" : "primary"}
        onPress={() => (showForm ? reset() : setShowForm(true))}
      />

      {showForm && (
        <Card>
          {editingId && <Text style={styles.editingLabel}>{t("mgr.vt.editing")}</Text>}
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Text style={styles.fieldLabel}>{t("mgr.vt.kind")}</Text>
          <Chips
            options={VAULT_CATEGORIES}
            value={category}
            onChange={setCategory}
          />
          <Text style={styles.fieldLabel}>{t("mgr.vt.name")}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("mgr.vt.namePlaceholder")}
            placeholderTextColor={colors.label4}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>{t("mgr.vt.desc")}</Text>
          <TextInput
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder={t("mgr.vt.descPlaceholder")}
            placeholderTextColor={colors.label4}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>{t("mgr.vt.phone")}</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder={t("mgr.vt.phonePlaceholder")}
            placeholderTextColor={colors.label4}
            style={styles.input}
            keyboardType="phone-pad"
          />
          <Text style={styles.fieldLabel}>{t("mgr.vt.notes")}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t("mgr.vt.notesPlaceholder")}
            placeholderTextColor={colors.label4}
            style={[styles.input, styles.multiline]}
            multiline
          />
          <Text style={styles.fieldLabel}>{t("mgr.vt.photo")}</Text>
          {shownPhotoUri ? (
            <View style={styles.photoRow}>
              <Image source={{ uri: shownPhotoUri }} style={styles.photoPreview} />
              <View style={{ flex: 1, gap: spacing(2) }}>
                <Button
                  label={t("mgr.vt.changePhoto")}
                  variant="secondary"
                  onPress={handlePickPhoto}
                />
                <Button
                  label={t("mgr.vt.removePhoto")}
                  variant="ghost"
                  onPress={() => {
                    setPhoto(null);
                    setExistingPhotoUrl(null);
                  }}
                />
              </View>
            </View>
          ) : (
            <Button
              label={t("mgr.vt.addPhoto")}
              variant="secondary"
              onPress={handlePickPhoto}
            />
          )}
          <Button
            label={editingId ? t("mgr.rem.saveBtn") : t("mgr.vt.saveBtn")}
            loading={saving || save.isPending || update.isPending}
            onPress={handleSubmit}
          />
        </Card>
      )}

      {items.isLoading ? (
        <Loading />
      ) : all.length === 0 ? (
        <EmptyNote>{t("mgr.vt.empty")}</EmptyNote>
      ) : (
        all.map((item) => (
          <ManageRow
            key={item.id}
            title={item.title}
            meta={
              item.subtitle ||
              item.phone ||
              t(`vcat.${item.category}`)
            }
            photoUrl={item.photo_url}
            active={editingId === item.id}
            onEdit={() => startEdit(item)}
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
  options: readonly { value: T; labelKey: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useT();
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
            {t(option.labelKey)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ManageRow({
  title,
  meta,
  photoUrl,
  active,
  onEdit,
  onDelete,
}: {
  title: string;
  meta: string;
  photoUrl?: string | null;
  active?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  return (
    <View style={[styles.row, active && styles.rowActive]}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.rowPhoto} />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <Pressable
        accessibilityLabel={t("common.edit")}
        accessibilityRole="button"
        onPress={onEdit}
        style={styles.editButton}
      >
        <Ionicons name="pencil" size={19} color={colors.label2} />
      </Pressable>
      <Pressable
        accessibilityLabel={t("delete.open")}
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
  editingLabel: {
    color: colors.label3,
    fontSize: font.sm,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
  rowActive: { borderWidth: 1, borderColor: colors.label3 },
  rowTitle: { color: colors.label, fontSize: font.base, fontWeight: "700" },
  rowMeta: { color: colors.label3, fontSize: font.sm, marginTop: 2 },
  rowPhoto: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.elev2,
  },
  photoRow: {
    flexDirection: "row",
    gap: spacing(3),
    alignItems: "center",
  },
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.elev2,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.elev2,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,69,58,0.12)",
  },
});
