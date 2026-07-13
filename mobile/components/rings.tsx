import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { colors, font, spacing } from "../lib/theme";

export interface RingSpec {
  label: string;
  value: string;
  color: string;
  /** 0..1 completion. */
  progress: number;
}

const STROKE = 16;
const GAP = 5;

/** Apple Fitness-style rings with a text legend beside them. */
export function ActivityRings({
  rings,
  size = 168,
}: {
  rings: RingSpec[];
  size?: number;
}) {
  const center = size / 2;

  return (
    <View style={styles.row}>
      <Svg width={size} height={size}>
        {rings.map((ring, index) => {
          const r = center - STROKE / 2 - index * (STROKE + GAP);
          const c = 2 * Math.PI * r;
          const progress = Math.min(Math.max(ring.progress, 0), 1);
          const dash = Math.max(progress, 0.005) * c;
          return (
            <G key={ring.label} rotation={-90} origin={`${center}, ${center}`}>
              <Circle
                cx={center}
                cy={center}
                r={r}
                stroke={ring.color}
                strokeOpacity={0.2}
                strokeWidth={STROKE}
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={r}
                stroke={ring.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c}`}
                fill="none"
              />
            </G>
          );
        })}
      </Svg>
      <View style={styles.legend}>
        {rings.map((ring) => (
          <View key={ring.label}>
            <View style={styles.legendHeader}>
              <View style={[styles.dot, { backgroundColor: ring.color }]} />
              <Text style={styles.legendLabel}>{ring.label.toUpperCase()}</Text>
            </View>
            <Text style={[styles.legendValue, { color: ring.color }]}>
              {ring.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing(6) },
  legend: { flex: 1, gap: spacing(4) },
  legendHeader: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: {
    color: colors.label3,
    fontSize: font.xs,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  legendValue: { fontSize: font.xl, fontWeight: "700" },
});
