import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "../../lib/session";
import { useT } from "../../lib/i18n";
import { colors, font, radius, spacing } from "../../lib/theme";
import { toDateKey, fromDateKey } from "../../lib/utils";
import { useWellnessEntries, useSaveWellness } from "../../hooks/data";
import { Screen, Card, Subtitle, SectionTitle, Button, Loading } from "../../components/ui";

const MOODS = [
  { value: 1, labelKey: "wellness.mood1", emoji: "😞" },
  { value: 2, labelKey: "wellness.mood2", emoji: "🙁" },
  { value: 3, labelKey: "wellness.mood3", emoji: "😐" },
  { value: 4, labelKey: "wellness.mood4", emoji: "🙂" },
  { value: 5, labelKey: "wellness.mood5", emoji: "😄" },
];

export default function Wellness() {
  const { session } = useSession();
  const t = useT();
  const userId = session?.user.id ?? "";
  const todayKey = toDateKey();

  const entries = useWellnessEntries(userId, 14);
  const save = useSaveWellness(userId);

  const today = (entries.data ?? []).find((e) => e.entry_date === todayKey);
  const [mood, setMood] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (today) {
      setMood(today.mood);
      setSleep(today.sleep_hours != null ? Number(today.sleep_hours) : null);
      setEnergy(today.energy);
    }
  }, [today?.id]);

  function adjustSleep(delta: number) {
    setSaved(false);
    setSleep((current) => {
      const next = (current ?? 7) + delta;
      return Math.min(24, Math.max(0, Math.round(next * 2) / 2));
    });
  }

  if (entries.isLoading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  const history = [...(entries.data ?? [])]
    .reverse()
    .filter((e) => e.entry_date !== todayKey)
    .slice(0, 7);

  return (
    <Screen>
      <Subtitle>{t("wellness.subtitle")}</Subtitle>

      <Card>
        <Text style={styles.question}>{t("wellness.mood")}</Text>
        <View style={styles.moodRow}>
          {MOODS.map((option) => {
            const selected = mood === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={t(option.labelKey)}
                accessibilityState={{ selected }}
                onPress={() => {
                  setSaved(false);
                  setMood(selected ? null : option.value);
                }}
                style={[styles.mood, selected && styles.moodSelected]}
              >
                <Text style={styles.moodEmoji}>{option.emoji}</Text>
                <Text style={styles.moodLabel}>{t(option.labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.question}>{t("wellness.sleep")}</Text>
        <View style={styles.sleepRow}>
          <Pressable
            accessibilityLabel="-0.5h"
            onPress={() => adjustSleep(-0.5)}
            style={styles.stepper}
          >
            <Text style={styles.stepperText}>−</Text>
          </Pressable>
          <Text style={styles.sleepValue}>
            {sleep === null ? "—" : t("wellness.hours", { n: sleep })}
          </Text>
          <Pressable
            accessibilityLabel="+0.5h"
            onPress={() => adjustSleep(0.5)}
            style={styles.stepper}
          >
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.question}>{t("wellness.energy")}</Text>
        <View style={styles.energyRow}>
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = energy === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={t("wellness.energyOf", { n: value })}
                accessibilityState={{ selected }}
                onPress={() => {
                  setSaved(false);
                  setEnergy(selected ? null : value);
                }}
                style={[styles.energy, selected && styles.moodSelected]}
              >
                <Text style={styles.energyText}>{value}</Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={today ? t("wellness.update") : t("wellness.save")}
          loading={save.isPending}
          onPress={() =>
            save.mutate(
              {
                entryDate: todayKey,
                mood,
                sleepHours: sleep,
                energy,
                notes: today?.notes ?? null,
              },
              { onSuccess: () => setSaved(true) },
            )
          }
        />
        {saved && <Text style={styles.saved}>{t("wellness.saved")}</Text>}
      </Card>

      {history.length > 0 && (
        <>
          <SectionTitle>{t("wellness.recent")}</SectionTitle>
          {history.map((entry) => (
            <View key={entry.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>
                {fromDateKey(entry.entry_date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              <Text style={styles.historyValues}>
                {entry.mood ? `${MOODS.find((m) => m.value === entry.mood)?.emoji ?? ""} ` : ""}
                {entry.sleep_hours != null ? t("wellness.hSleep", { n: Number(entry.sleep_hours) }) : ""}
                {entry.energy != null ? `  ·  ${t("wellness.energyOf", { n: entry.energy })}` : ""}
              </Text>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  question: { color: colors.label, fontSize: font.lg, fontWeight: "700" },
  moodRow: { flexDirection: "row", gap: spacing(2) },
  mood: {
    flex: 1,
    minHeight: 76,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.elev2,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: spacing(2),
  },
  moodSelected: { borderColor: colors.label, backgroundColor: "rgba(255,255,255,0.10)" },
  moodEmoji: { fontSize: 26 },
  moodLabel: { color: colors.label3, fontSize: 11, textAlign: "center" },
  sleepRow: { flexDirection: "row", alignItems: "center", gap: spacing(4) },
  stepper: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.elev2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: { color: colors.label, fontSize: 28, fontWeight: "600" },
  sleepValue: {
    flex: 1,
    textAlign: "center",
    color: colors.label,
    fontSize: font.x2,
    fontWeight: "700",
  },
  energyRow: { flexDirection: "row", gap: spacing(2) },
  energy: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.elev2,
    alignItems: "center",
    justifyContent: "center",
  },
  energyText: { color: colors.label, fontSize: font.lg, fontWeight: "700" },
  saved: { color: colors.green, fontSize: font.base, fontWeight: "600", textAlign: "center" },
  historyRow: {
    backgroundColor: colors.elev1,
    borderRadius: radius.md,
    padding: spacing(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: { color: colors.label2, fontSize: font.base, fontWeight: "600" },
  historyValues: { color: colors.label3, fontSize: font.sm },
});
