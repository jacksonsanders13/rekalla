/**
 * An inset grouped list, the way iOS builds them: one rounded container, rows
 * separated by hairlines rather than floating apart as separate cards.
 */
import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius } from "../lib/theme";
import { a11y } from "../lib/a11y";

export function ListGroup({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children);
  if (rows.length === 0) return null;
  return (
    <View style={styles.group}>
      {rows.map((row, i) => (
        <View key={i}>
          {i > 0 ? <View style={styles.separator} /> : null}
          {row}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.elev1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginLeft: a11y.space(4),
  },
});
