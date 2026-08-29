/** A rounded speech bubble with a tail pointing left, at Rekalla. */
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, fonts } from "../lib/theme";
import { a11y, a11yFont } from "../lib/a11y";

export function SpeechBubble({ children }: { children: ReactNode }) {
  return (
    <View style={styles.wrap}>
      {/* A square turned 45 degrees is the tail; it sits under the bubble. */}
      <View style={styles.tail} />
      <View style={styles.bubble}>
        <Text style={styles.text}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center" },
  tail: {
    position: "absolute",
    left: -5,
    top: "50%",
    marginTop: -6,
    width: 12,
    height: 12,
    backgroundColor: colors.elev1,
    transform: [{ rotate: "45deg" }],
  },
  bubble: {
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    paddingHorizontal: a11y.space(4),
    paddingVertical: a11y.space(3),
  },
  text: {
    color: colors.label,
    fontSize: a11yFont.body, fontFamily: fonts.regular,
    lineHeight: a11y.lineHeight(a11yFont.body),
  },
});
