/**
 * A tappable month of days. Shared by the Calendar screen (where dots mark the
 * days that have something on them) and the event editor (where it's the date
 * picker) so both months look and behave identically.
 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, fonts } from "../lib/theme";
import { a11y, a11yFont } from "../lib/a11y";
import { parseISODate, todayISO, toISODate } from "../lib/format";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthGrid({
  selected,
  onSelect,
  marked,
}: {
  /** YYYY-MM-DD */
  selected: string;
  onSelect: (dateISO: string) => void;
  /** Days to dot, as YYYY-MM-DD. */
  marked?: Set<string>;
}) {
  const start = parseISODate(selected) ?? new Date();
  const [cursor, setCursor] = useState({ year: start.getFullYear(), month: start.getMonth() });

  // Follow the selection if it jumps to another month.
  useEffect(() => {
    const d = parseISODate(selected);
    if (!d) return;
    setCursor((c) =>
      c.year === d.getFullYear() && c.month === d.getMonth()
        ? c
        : { year: d.getFullYear(), month: d.getMonth() },
    );
  }, [selected]);

  const today = todayISO();
  const weeks = buildWeeks(cursor.year, cursor.month);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function shift(delta: number) {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <View>
      <View style={styles.monthBar}>
        <Pressable
          onPress={() => shift(-1)}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          style={styles.navBtn}
        >
          <Ionicons name="chevron-back" size={28} color={colors.label} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          onPress={() => shift(1)}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          style={styles.navBtn}
        >
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
            const dISO = toISODate(new Date(cursor.year, cursor.month, day));
            const has = marked?.has(dISO) ?? false;
            const isSel = dISO === selected;
            const isToday = dISO === today;
            return (
              <Pressable
                key={di}
                onPress={() => onSelect(dISO)}
                accessibilityRole="button"
                accessibilityLabel={`${monthLabel} ${day}${has ? ", has items" : ""}`}
                style={[styles.cell, isSel && styles.cellSel, isToday && !isSel && styles.cellToday]}
              >
                <Text style={[styles.cellText, isSel && styles.cellTextSel]}>{day}</Text>
                {has ? <View style={[styles.dot, isSel && { backgroundColor: "#000" }]} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
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
  monthBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: a11y.space(2) },
  navBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  monthLabel: { color: colors.label, fontSize: a11yFont.bodyLg, fontFamily: fonts.bold, fontWeight: "700" },
  weekHead: { flexDirection: "row" },
  weekHeadText: { flex: 1, textAlign: "center", color: colors.label3, fontSize: a11yFont.body - 4, fontFamily: fonts.bold, fontWeight: "700" },
  week: { flexDirection: "row" },
  cell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", margin: 2, borderRadius: radius.md },
  cellSel: { backgroundColor: colors.label },
  cellToday: { borderWidth: 2, borderColor: colors.blue },
  cellText: { color: colors.label, fontSize: a11yFont.body },
  cellTextSel: { color: "#000", fontWeight: "800" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.blue, marginTop: 2 },
});
