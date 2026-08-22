/** The in-app calendar: scanned dates land here as marked days + an agenda. */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, radius } from "../../lib/theme";
import { a11y, a11yFont } from "../../lib/a11y";
import { BodyText } from "../../components/big-ui";
import { useReminders, type Reminder } from "../../hooks/scans";
import { ReminderRow } from "./home";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const { data: reminders } = useReminders(userId);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [selected, setSelected] = useState<string>(iso(now.getFullYear(), now.getMonth(), now.getDate()));

  // date -> items on that day
  const byDay = useMemo(() => {
    const map: Record<string, Reminder[]> = {};
    for (const r of reminders ?? []) {
      (map[r.start_date] ??= []).push(r);
    }
    return map;
  }, [reminders]);

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);
  const todayISO = iso(now.getFullYear(), now.getMonth(), now.getDate());
  const dayItems = byDay[selected] ?? [];

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title} accessibilityRole="header">Calendar</Text>

        <View style={styles.monthBar}>
          <Pressable onPress={() => shift(-1)} accessibilityRole="button" accessibilityLabel="Previous month" style={styles.navBtn}>
            <Ionicons name="chevron-back" size={28} color={colors.label} />
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable onPress={() => shift(1)} accessibilityRole="button" accessibilityLabel="Next month" style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={28} color={colors.label} />
          </Pressable>
        </View>

        <View style={styles.weekHead}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} style={styles.weekHeadText}>{w}</Text>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={wi} style={styles.week}>
            {week.map((day, di) => {
              if (day === 0) return <View key={di} style={styles.cell} />;
              const dISO = iso(year, month, day);
              const has = !!byDay[dISO]?.length;
              const isSel = dISO === selected;
              const isToday = dISO === todayISO;
              return (
                <Pressable
                  key={di}
                  onPress={() => setSelected(dISO)}
                  accessibilityRole="button"
                  accessibilityLabel={`${monthLabel} ${day}${has ? ", has items" : ""}`}
                  style={[styles.cell, isSel && styles.cellSel, isToday && !isSel && styles.cellToday]}
                >
                  <Text style={[styles.cellText, isSel && { color: "#000", fontWeight: "800" }]}>{day}</Text>
                  {has ? <View style={[styles.dot, isSel && { backgroundColor: "#000" }]} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}

        <Text style={styles.section}>
          {selected === todayISO ? "Today" : new Date(selected).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </Text>
        {dayItems.length === 0 ? (
          <BodyText>Nothing on this day.</BodyText>
        ) : (
          <View style={{ gap: a11y.space(3) }}>
            {dayItems.map((r) => (
              <ReminderRow key={r.id} r={r} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function buildWeeks(year: number, month: number): number[][] {
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: number[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(0);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(0);
  const weeks: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  body: { padding: a11y.space(4), gap: a11y.space(3), paddingBottom: a11y.space(10) },
  title: { color: colors.label, fontSize: a11yFont.title, fontWeight: "700", textAlign: "center" },
  monthBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: a11y.space(2) },
  navBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  monthLabel: { color: colors.label, fontSize: a11yFont.bodyLg, fontWeight: "700" },
  weekHead: { flexDirection: "row" },
  weekHeadText: { flex: 1, textAlign: "center", color: colors.label3, fontSize: a11yFont.body - 4, fontWeight: "700" },
  week: { flexDirection: "row" },
  cell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", margin: 2, borderRadius: radius.md },
  cellSel: { backgroundColor: colors.label },
  cellToday: { borderWidth: 2, borderColor: colors.blue },
  cellText: { color: colors.label, fontSize: a11yFont.body },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.blue, marginTop: 2 },
  section: { color: colors.label, fontSize: a11yFont.bodyLg, fontWeight: "700", marginTop: a11y.space(3) },
});
