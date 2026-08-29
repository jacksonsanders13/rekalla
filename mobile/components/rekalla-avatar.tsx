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
const CLOUD = "#fdeef4"; // the thought bubble, a near-white pink
const BLUE = "#0a84ff";

export type AvatarBadge = "camera" | "calendar" | "bell";
export type AvatarPose = "idle" | "wave" | "think";

/** The lobed outline: ten bumps, mirrored exactly about the centre line. */
const OUTLINE =
  "M50 10C62 6 74 10 76 20C88 18 94 28 88 38C96 44 96 56 86 60C92 70 84 80 73 76C70 86 60 90 50 86C40 90 30 86 27 76C16 80 8 70 14 60C4 56 4 44 12 38C6 28 12 18 24 20C26 10 38 6 50 10Z";

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
        {/* Arms sit behind the head. The resting one keeps him balanced while
            the other is up, so the silhouette never reads as lopsided. */}
        {pose === "wave" ? (
          <G>
            <Path
              d="M16 62C9 66 6 74 8 80"
              stroke={BODY}
              strokeWidth={8}
              strokeLinecap="round"
              fill="none"
            />
            <Circle cx={8} cy={84} r={6.5} fill={BODY} />
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

        <Path d={OUTLINE} fill={BODY} />

        {/* Folds, kept clear of the face */}
        <G stroke={FOLD} strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M50 14V36" />
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
            d="M45 66C48 64 52 64 55 66"
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

        {/* A thought bubble over his head, clear of the outline */}
        {thinking ? (
          <G>
            <Circle cx={70} cy={18} r={2.2} fill={CLOUD} />
            <G fill={CLOUD}>
              <Circle cx={74} cy={9} r={6} />
              <Circle cx={84} cy={6} r={7} />
              <Circle cx={93} cy={10} r={5} />
            </G>
            <G fill={INK}>
              <Circle cx={78} cy={8} r={1.7} />
              <Circle cx={84} cy={6} r={1.7} />
              <Circle cx={90} cy={8} r={1.7} />
            </G>
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
