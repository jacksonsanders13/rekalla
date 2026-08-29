/** Home: the big Scan button + what's coming up. The front door of Rekalla. */
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, radius, fonts } from "../../lib/theme";
import { a11y, a11yFont } from "../../lib/a11y";
import { BodyText } from "../../components/big-ui";
import { ListGroup } from "../../components/list-group";
import { AskBox } from "../../components/ask-box";
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
        {/* The hero: Scan */}
        <Pressable
          onPress={() => router.push("/scan")}
          accessibilityRole="button"
          accessibilityLabel="Scan a paper document"
          style={({ pressed }) => [styles.scan, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="camera" size={44} color="#ffffff" />
          <Text style={styles.scanLabel}>Scan something</Text>
          <Text style={styles.scanSub}>A calendar, an appointment card, or a bill</Text>
        </Pressable>

        {/* Basic chat: ask about your calendar */}
        <AskBox userId={userId} />

        {/* What's coming up */}
        <Text style={styles.section}>What's coming up</Text>
        {isLoading ? (
          <BodyText>Loading…</BodyText>
        ) : !upcoming || upcoming.length === 0 ? (
          <View style={styles.empty}>
            <BodyText>
              Nothing here yet. Scan a paper calendar, an appointment card, or a
              bill, and it will show up here.
            </BodyText>
          </View>
        ) : (
          <ListGroup>
            {upcoming.map((r) => (
              <ReminderRow key={r.id} r={r} />
            ))}
          </ListGroup>
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
      <Ionicons name={iconFor(r.category)} size={a11yFont.body} color={colors.label3} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{r.title}</Text>
        <Text style={styles.rowWhen}>
          {formatDay(r.start_date)} · {time}
          {r.description ? ` · ${r.description}` : ""}
        </Text>
      </View>
      {isToday(r.start_date) ? <View style={styles.todayDot} /> : null}
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
  scan: {
    backgroundColor: colors.blue,
    borderRadius: radius.lg,
    paddingVertical: a11y.space(7),
    paddingHorizontal: a11y.space(4),
    alignItems: "center",
    gap: a11y.space(2),
  },
  scanLabel: { color: "#ffffff", fontSize: a11yFont.title, fontFamily: fonts.semibold, fontWeight: "600", letterSpacing: -0.4 },
  scanSub: { color: "rgba(255,255,255,0.85)", fontSize: a11yFont.body - 3, fontFamily: fonts.regular, textAlign: "center" },
  section: {
    color: colors.label,
    fontSize: a11yFont.bodyLg,
    fontFamily: fonts.bold,
    fontWeight: "700",
    marginTop: a11y.space(3),
  },
  empty: { backgroundColor: colors.elev1, borderRadius: radius.md, padding: a11y.space(4) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: a11y.space(3),
    paddingHorizontal: a11y.space(4),
    paddingVertical: a11y.space(4),
    minHeight: a11y.tapMin,
  },
  todayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue },
  rowTitle: { color: colors.label, fontSize: a11yFont.body, fontFamily: fonts.semibold, fontWeight: "600" },
  rowWhen: { color: colors.label3, fontSize: a11yFont.body - 4, fontFamily: fonts.regular, marginTop: 2 },
});
