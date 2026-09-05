/**
 * Rekalla himself: a pink cartoon brain. He introduces the app, explains
 * what each field is for, and stands next to the end of every session.
 *
 * He is built as one half, drawn twice. Every fold is defined for his left
 * side only; his right side is that same group under a mirror transform, so
 * the two halves cannot drift apart. The outline is mirror-exact the same
 * way: each control point on the right is 100 minus its partner on the left.
 */
import Svg, { Circle, G, Path } from "react-native-svg";
import { View } from "react-native";

const BODY = "#f7a8c8"; // brain pink
const FOLD = "#d4779f"; // the sulci, a deeper pink
const INK = "#43202f";

export type AvatarPose = "idle" | "think";

/** Ten lobes, mirrored about x = 50. */
const OUTLINE =
  "M50 10C62 6 74 10 76 20C88 18 94 28 88 38C96 44 96 56 86 60C92 70 84 80 73 76C70 86 60 90 50 86C40 90 30 86 27 76C16 80 8 70 14 60C4 56 4 44 12 38C6 28 12 18 24 20C26 10 38 6 50 10Z";

/** The folds on his left side. His right side is this list, mirrored. */
const LEFT_FOLDS = [
  "M32 26C26 30 28 36 22 40",
  "M14 52C22 50 24 56 20 62",
  "M30 74C34 70 30 66 34 62",
];

/** Reflects the left half onto the right. */
const MIRROR = "translate(100, 0) scale(-1, 1)";

export function RekallaAvatar({
  size = 96,
  pose = "idle",
}: {
  size?: number;
  pose?: AvatarPose;
}) {
  const thinking = pose === "think";
  // When he's thinking he looks up and away from you.
  const eyeY = thinking ? 50 : 52;
  const eyeX = thinking ? 2 : 0;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={thinking ? "Rekalla is thinking" : "Rekalla"}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Path d={OUTLINE} fill={BODY} />

        <G stroke={FOLD} strokeWidth={3} strokeLinecap="round" fill="none">
          {LEFT_FOLDS.map((d) => (
            <Path key={d} d={d} />
          ))}
        </G>
        <G stroke={FOLD} strokeWidth={3} strokeLinecap="round" fill="none" transform={MIRROR}>
          {LEFT_FOLDS.map((d) => (
            <Path key={d} d={d} />
          ))}
        </G>

        <Circle cx={38 + eyeX} cy={eyeY} r={4.6} fill={INK} />
        <Circle cx={62 + eyeX} cy={eyeY} r={4.6} fill={INK} />
        <Path
          d="M42 64C46 68 54 68 58 64"
          stroke={INK}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}
