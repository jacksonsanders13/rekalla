/** The in-app calendar: scanned dates land here as marked days + an agenda. */
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../lib/session";
import { colors, fonts } from "../../lib/theme";
import { a11y, a11yFont } from "../../lib/a11y";
import { BodyText } from "../../components/big-ui";
import { ListGroup } from "../../components/list-group";
import { MonthGrid } from "../../components/month-grid";
import { useReminders, type Reminder } from "../../hooks/scans";
import { ReminderRow } from "./home";
import { formatFullDay, todayISO } from "../../lib/format";

export default function CalendarScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const { data: reminders } = useReminders(userId);

  const today = todayISO();
  const [selected, setSelected] = useState<string>(today);

  // date -> items on that day
  const byDay = useMemo(() => {
    const map: Record<string, Reminder[]> = {};
    for (const r of reminders ?? []) {
      (map[r.start_date] ??= []).push(r);
    }
    return map;
  }, [reminders]);

  const marked = useMemo(() => new Set(Object.keys(byDay)), [byDay]);
  const dayItems = byDay[selected] ?? [];

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title} accessibilityRole="header">Calendar</Text>

        <MonthGrid selected={selected} onSelect={setSelected} marked={marked} />

        <Text style={styles.section}>
          {selected === today ? "Today" : formatFullDay(selected)}
        </Text>
        {dayItems.length === 0 ? (
          <BodyText>Nothing on this day.</BodyText>
        ) : (
          <ListGroup>
            {dayItems.map((r) => (
              <ReminderRow key={r.id} r={r} />
            ))}
          </ListGroup>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  body: { padding: a11y.space(4), gap: a11y.space(3), paddingBottom: a11y.space(10) },
  title: { color: colors.label, fontSize: a11yFont.title, fontFamily: fonts.bold, fontWeight: "700", textAlign: "center", letterSpacing: -0.3 },
  section: {
    color: colors.label,
    fontSize: a11yFont.bodyLg,
    fontFamily: fonts.bold,
    fontWeight: "700",
    marginTop: a11y.space(3),
  },
});
