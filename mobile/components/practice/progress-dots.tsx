/**
 * How far through the session you are, as a row of segments.
 *
 * Filled segments rather than a percentage, and never anything about how many
 * were answered wrongly. A row that grows by one when a question is repeated
 * is telling the truth: there is one more thing to do than there was.
 */
import { View } from "react-native";
import { colors, space } from "../../lib/design/tokens";

export function ProgressDots({ total, done }: { total: number; done: number }) {
  if (total <= 0) return null;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Question ${Math.min(done + 1, total)} of ${total}`}
      style={{
        flexDirection: "row",
        gap: space(1.5),
        paddingVertical: space(2),
      }}
    >
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 10,
            borderRadius: 5,
            backgroundColor: index < done ? colors.primary : colors.line,
          }}
        />
      ))}
    </View>
  );
}
