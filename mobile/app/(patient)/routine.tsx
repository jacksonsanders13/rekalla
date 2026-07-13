import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, font, radius, spacing } from "../../lib/theme";
import { formatTimeOfDay, toDateKey } from "../../lib/utils";
import {
  useRoutineItems,
  useRoutineCompletions,
  useToggleRoutine,
} from "../../hooks/data";
import { Screen, Subtitle, SectionTitle, EmptyNote, Loading } from "../../components/ui";
import type { RoutinePeriod } from "../../lib/types";

const PERIODS: { id: RoutinePeriod; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];

export default function Routine() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const todayKey = toDateKey();

  const items = useRoutineItems(userId);
  const completions = useRoutineCompletions(userId, todayKey);
  const toggle = useToggleRoutine(userId, todayKey);

  const doneIds = new Set((completions.data ?? []).map((c) => c.routine_item_id));

  if (items.isLoading || completions.isLoading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  const all = items.data ?? [];

  return (
    <Screen>
      <Subtitle>Check off each step as your day goes on.</Subtitle>
      {all.length === 0 ? (
        <EmptyNote>
          Your caregiver hasn&apos;t set up a routine yet. Steps will appear
          here when they do.
        </EmptyNote>
      ) : (
        PERIODS.map((period) => {
          const periodItems = all.filter((i) => i.period === period.id);
          if (periodItems.length === 0) return null;
          return (
            <View key={period.id} style={{ gap: spacing(3) }}>
              <SectionTitle>{period.label}</SectionTitle>
              {periodItems.map((item) => {
                const done = doneIds.has(item.id);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    disabled={toggle.isPending}
                    onPress={() => toggle.mutate({ itemId: item.id, done: !done })}
                    style={styles.row}
                  >
                    <View style={[styles.check, done && styles.checkDone]}>
                      {done && (
                        <Ionicons name="checkmark" size={22} color="#000" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.title, done && styles.titleDone]}>
                        {item.title}
                      </Text>
                      {item.time_of_day && (
                        <Text style={styles.time}>
                          around {formatTimeOfDay(item.time_of_day)}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: colors.elev2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: colors.label, borderColor: colors.label },
  title: { color: colors.label, fontSize: font.lg, fontWeight: "600" },
  titleDone: { textDecorationLine: "line-through", color: colors.label3 },
  time: { color: colors.label3, fontSize: font.sm, marginTop: 2 },
});
