/** Home: the big Scan button + what's coming up. The front door of Rekalla. */
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, radius } from "../../lib/theme";
import { a11y, a11yFont } from "../../lib/a11y";
import { BodyText } from "../../components/big-ui";
import { AskBox } from "../../components/ask-box";
import { LogoMark } from "../../components/logo-mark";
import { useUpcomingReminders, type Reminder } from "../../hooks/scans";
import { formatDay, formatTime, isToday } from "../../lib/format";

export default function Home() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const router = useRouter();
  const { data: upcoming, isLoading } = useUpcomingReminders(userId);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.brand} accessibilityRole="header">
          <LogoMark size={76} />
        </View>

        {/* The hero: Scan */}
        <Pressable
          onPress={() => router.push("/scan")}
          accessibilityRole="button"
          accessibilityLabel="Scan a paper document"
          style={({ pressed }) => [styles.scan, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="camera" size={64} color="#ffffff" />
          <Text style={styles.scanLabel}>Scan something</Text>
          <Text style={styles.scanSub}>A calendar, an appointment card, or a bill</Text>
        </Pressable>

        {/* Basic chat: ask about your calendar */}
        <AskBox />

        {/* What's coming up */}
        <Text style={styles.section}>What's coming up</Text>
        {isLoading ? (
          <BodyText>Loading…</BodyText>
        ) : !upcoming || upcoming.length === 0 ? (
          <View style={styles.empty}>
            <BodyText>
              Nothing yet. Tap “Scan something” to add your paper calendar,
              appointments, or bills — Rekalla will remind you.
            </BodyText>
          </View>
        ) : (
          <View style={{ gap: a11y.space(3) }}>
            {upcoming.map((r) => (
              <ReminderRow key={r.id} r={r} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** One event in a list. Tapping it opens the editor. */
export function ReminderRow({ r }: { r: Reminder }) {
  const router = useRouter();
  const time = r.time_of_day ? formatTime(r.time_of_day) : "All day";
  return (
    <Pressable
      onPress={() => router.push(`/event/${r.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${r.title}, ${formatDay(r.start_date)}, ${time}. Tap to edit`}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.rowMark, isToday(r.start_date) && { backgroundColor: colors.blue }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{r.title}</Text>
        <Text style={styles.rowWhen}>
          {formatDay(r.start_date)} · {time}
          {r.description ? ` · ${r.description}` : ""}
        </Text>
      </View>
      <Ionicons name={iconFor(r.category)} size={a11yFont.body} color={colors.label3} />
      <Ionicons name="chevron-forward" size={a11yFont.body} color={colors.label4} />
    </Pressable>
  );
}

function iconFor(category: string): keyof typeof Ionicons.glyphMap {
  if (category === "bill") return "cash";
  if (category === "appointments") return "medkit";
  return "calendar";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  body: { padding: a11y.space(4), gap: a11y.space(4), paddingBottom: a11y.space(10) },
  brand: { alignItems: "center", paddingTop: a11y.space(1) },
  scan: {
    backgroundColor: colors.blue,
    borderRadius: radius.xl,
    paddingVertical: a11y.space(8),
    paddingHorizontal: a11y.space(4),
    alignItems: "center",
    gap: a11y.space(2),
  },
  scanLabel: { color: "#ffffff", fontSize: a11yFont.title, fontWeight: "800" },
  scanSub: { color: "rgba(255,255,255,0.9)", fontSize: a11yFont.body - 2, textAlign: "center" },
  ask: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: a11y.space(2),
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.elev1,
  },
  askText: { color: colors.label, fontSize: a11yFont.body, fontWeight: "700" },
  section: { color: colors.label, fontSize: a11yFont.bodyLg, fontWeight: "700", marginTop: a11y.space(2) },
  empty: { backgroundColor: colors.elev1, borderRadius: radius.lg, padding: a11y.space(4) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: a11y.space(3),
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: a11y.space(4),
  },
  rowMark: { width: 8, height: 44, borderRadius: 4, backgroundColor: colors.elev3 },
  rowTitle: { color: colors.label, fontSize: a11yFont.body, fontWeight: "700" },
  rowWhen: { color: colors.label3, fontSize: a11yFont.body - 4, marginTop: 2 },
});
