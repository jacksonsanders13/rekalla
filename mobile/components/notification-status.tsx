/**
 * Says whether the phone will actually speak up.
 *
 * A reminder app whose notifications have been switched off looks identical
 * to one with nothing due: both are a quiet phone. The person using this is
 * relying on it to remember for them, so silence has to be explained rather
 * than left to be discovered.
 *
 * Deliberately not an alert. It reads as a plain status line when things are
 * fine, and only takes on warning colour when reminders genuinely cannot
 * arrive. This audience is targeted by scams and reads alarm styling as a
 * red flag, so the loud version is reserved for the one case that earns it.
 */
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, spacing, weight } from "../lib/theme";
import { useT } from "../lib/i18n";
import type { NotificationStatus } from "../hooks/use-notification-sync";

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function NotificationStatusRow({
  status,
  now = new Date(),
}: {
  status: NotificationStatus;
  now?: Date;
}) {
  const t = useT();

  // Nothing is known yet. Showing a placeholder here would just flicker.
  if (status.state === "pending") return null;

  if (status.state === "blocked") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t("notifStatus.blocked")}. ${t("notifStatus.openSettings")}`}
        onPress={() => void Linking.openSettings()}
        style={({ pressed }) => [
          styles.row,
          styles.blocked,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="notifications-off"
          size={22}
          color={colors.orange}
          accessibilityElementsHidden
        />
        <View style={styles.text}>
          <Text style={styles.blockedTitle}>{t("notifStatus.blocked")}</Text>
          <Text style={styles.detail}>{t("notifStatus.blockedHow")}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.label3} />
      </Pressable>
    );
  }

  const { scheduled, nextAt } = status;

  // nextAt is only set for concretely dated notifications. A repeating daily
  // or weekly trigger has no single next date here, so say the honest thing
  // rather than inventing one.
  let label: string;
  if (nextAt) {
    const time = nextAt.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    label = sameDay(nextAt, now)
      ? t("notifStatus.nextAt", { time })
      : t("notifStatus.nextOn", {
          day: nextAt.toLocaleDateString(undefined, { weekday: "long" }),
          time,
        });
  } else if (scheduled > 0) {
    label = t("notifStatus.repeating");
  } else {
    label = t("notifStatus.none");
  }

  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={label}>
      <Ionicons
        name={scheduled > 0 ? "notifications" : "notifications-outline"}
        size={20}
        color={colors.label3}
        accessibilityElementsHidden
      />
      <Text style={styles.detail}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    paddingVertical: spacing(2),
  },
  blocked: {
    backgroundColor: colors.elev1,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    minHeight: 60,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, minWidth: 0 },
  blockedTitle: {
    color: colors.label,
    fontSize: font.base,
    fontWeight: weight.semibold,
  },
  detail: { flex: 1, color: colors.label3, fontSize: font.sm },
});
