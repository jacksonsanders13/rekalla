/**
 * Rekalla himself: a pink cartoon brain. He introduces the app in the welcome
 * tour, greets you on Home, and stands next to every answer he gives.
 *
 * `pose` changes what he's doing (waving hello, thinking about your question).
 * `badge` clips a small round icon to his lower right for the tour steps.
 * Geometry is shared with the web version in components/ui/rekalla-avatar.tsx.
 * Keep the two in step.
 */
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { View } from "react-native";

const BODY = "#f7a8c8"; // brain pink
const FOLD = "#d4779f"; // the sulci, a deeper pink
const INK = "#43202f";
const BLUE = "#0a84ff";

export type AvatarBadge = "camera" | "calendar" | "bell";
export type AvatarPose = "idle" | "wave" | "think";

/** The lobed outline. Ten bumps is what reads as "brain" rather than "cloud". */
const OUTLINE =
  "M50 14C60 8 72 12 74 22C84 20 92 28 88 38C96 44 94 56 86 60C90 70 82 79 73 76C70 86 58 90 50 84C42 90 30 86 27 76C18 79 10 70 14 60C6 56 4 44 12 38C8 28 16 20 26 22C28 12 40 8 50 14Z";

export function RekallaAvatar({
  size = 96,
  pose = "idle",
  badge,
}: {
  size?: number;
  pose?: AvatarPose;
  badge?: AvatarBadge;
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
        {/* Arm goes behind the head so it reads as coming from behind him. */}
        {pose === "wave" ? (
          <G>
            <Path
              d="M84 62C91 58 94 48 92 41"
              stroke={BODY}
              strokeWidth={8}
              strokeLinecap="round"
              fill="none"
            />
            <Circle cx={92} cy={37} r={6.5} fill={BODY} />
          </G>
        ) : null}
        {thinking ? (
          <G>
            <Path
              d="M70 74C76 76 79 82 77 88"
              stroke={BODY}
              strokeWidth={8}
              strokeLinecap="round"
              fill="none"
            />
            <Circle cx={64} cy={72} r={7} fill={BODY} />
          </G>
        ) : null}

        <Path d={OUTLINE} fill={BODY} />

        {/* Folds, kept clear of the face */}
        <G stroke={FOLD} strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M50 16C52 24 48 28 50 36" />
          <Path d="M32 26C26 30 28 36 22 40" />
          <Path d="M68 26C74 30 72 36 78 40" />
          <Path d="M14 52C22 50 24 56 20 62" />
          <Path d="M86 52C78 50 76 56 80 62" />
          <Path d="M30 74C34 70 30 66 34 62" />
          <Path d="M70 74C66 70 70 66 66 62" />
        </G>

        {/* Face */}
        <Circle cx={40 + eyeX} cy={eyeY} r={4.5} fill={INK} />
        <Circle cx={60 + eyeX} cy={eyeY} r={4.5} fill={INK} />
        {thinking ? (
          <Path
            d="M45 66C48 64 52 64 54 66"
            stroke={INK}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <Path
            d="M42 64C45 68 55 68 58 64"
            stroke={INK}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Thought dots, rising away from him */}
        {thinking ? (
          <G fill={BODY}>
            <Circle cx={84} cy={31} r={2.5} />
            <Circle cx={90} cy={23} r={3.5} />
            <Circle cx={96} cy={14} r={4} />
          </G>
        ) : null}

        {badge ? (
          <G>
            <Circle cx={78} cy={78} r={19} fill={BLUE} />
            <G stroke="#ffffff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none">
              {badge === "camera" ? (
                <>
                  <Rect x={68} y={72} width={20} height={14} rx={3} />
                  <Circle cx={78} cy={79} r={3.5} />
                  <Path d="M74 72L76 69H80L82 72" />
                </>
              ) : null}
              {badge === "calendar" ? (
                <>
                  <Rect x={68} y={70} width={20} height={17} rx={3} />
                  <Path d="M68 76H88M73 67V71M83 67V71" />
                </>
              ) : null}
              {badge === "bell" ? (
                <>
                  <Path d="M71 83C74 80 73 78 73 75C73 71 75 68 78 68C81 68 83 71 83 75C83 78 82 80 85 83Z" />
                  <Path d="M76 86H80" />
                </>
              ) : null}
            </G>
          </G>
        ) : null}
      </Svg>
    </View>
  );
}
