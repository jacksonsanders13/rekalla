import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, spacing } from "../lib/theme";
import { formatTimeOfDay } from "../lib/utils";
import { useT } from "../lib/i18n";
import type { ReminderOccurrence } from "../lib/types";
import { Button } from "./ui";

const CATEGORY_META: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  medication: { icon: "medkit", color: colors.pink },
  meals: { icon: "restaurant", color: colors.orange },
  appointments: { icon: "calendar", color: colors.blue },
  exercise: { icon: "walk", color: colors.green },
  family_calls: { icon: "call", color: colors.purple },
  custom: { icon: "star", color: colors.teal },
};

/** One reminder for today with the two big actions: Done and Snooze. */
export function OccurrenceRow({
  occurrence,
  busy,
  onAction,
  readOnly = false,
}: {
  occurrence: ReminderOccurrence;
  busy?: boolean;
  onAction?: (action: "complete" | "snooze" | "reopen") => void;
  readOnly?: boolean;
}) {
  const t = useT();
  const { reminder, status, event } = occurrence;
  const meta = CATEGORY_META[reminder.category] ?? CATEGORY_META.custom;
  const done = status === "completed";
  const overdue = status === "overdue";
  const snoozed = status === "snoozed";

  return (
    <View style={[styles.card, overdue && styles.cardOverdue]}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: `${meta.color}26` }]}>
          <Ionicons
            name={done ? "checkmark" : meta.icon}
            size={22}
            color={done ? colors.green : meta.color}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, done && styles.titleDone]}>
            {reminder.title}
          </Text>
          <Text style={styles.meta}>
            {formatTimeOfDay(reminder.time_of_day)} · {t(`cat.${reminder.category}`)}
            {overdue ? `  ·  ${t("reminders.stillWaiting")}` : ""}
            {snoozed && event?.snoozed_until
              ? `  ·  ${t("reminders.snoozedUntil", {
                  time: new Date(event.snoozed_until).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  }),
                })}`
              : ""}
          </Text>
          {reminder.description && !done ? (
            <Text style={styles.description}>{reminder.description}</Text>
          ) : null}
        </View>
      </View>

      {!readOnly && onAction && !done && (
        <View style={styles.actions}>
          <Button
            label={t("common.done")}
            style={{ flex: 1 }}
            disabled={busy}
            onPress={() => onAction("complete")}
          />
          {!snoozed && (
            <Button
              label={t("common.snooze")}
              variant="secondary"
              style={{ flex: 1 }}
              disabled={busy}
              onPress={() => onAction("snooze")}
            />
          )}
        </View>
      )}
      {!readOnly && onAction && done && (
        <Button
          label={t("common.undo")}
          variant="ghost"
          disabled={busy}
          onPress={() => onAction("reopen")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: spacing(4),
    gap: spacing(3),
  },
  cardOverdue: { backgroundColor: "#2a1215" },
  top: { flexDirection: "row", gap: spacing(3), alignItems: "flex-start" },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.label, fontSize: font.lg, fontWeight: "700" },
  titleDone: { textDecorationLine: "line-through", color: colors.label3 },
  meta: { color: colors.label3, fontSize: font.sm, marginTop: 2 },
  description: { color: colors.label3, fontSize: font.sm, marginTop: spacing(1) },
  actions: { flexDirection: "row", gap: spacing(3) },
});
