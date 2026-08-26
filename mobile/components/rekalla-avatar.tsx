/**
 * Rekalla himself: a friendly cartoon brain. He introduces the app in the
 * welcome tour and stands next to every answer he gives, so the voice you're
 * reading always has a face attached.
 *
 * `badge` clips a small round icon to his lower right for the tour steps.
 * Geometry is shared with the web version in components/ui/rekalla-avatar.tsx.
 */
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { View } from "react-native";

const BODY = "#ededf2";
const FOLD = "#c3c3ce";
const INK = "#1c1c1e";
const BLUE = "#0a84ff";

export type AvatarBadge = "camera" | "calendar" | "bell";

export function RekallaAvatar({
  size = 96,
  badge,
}: {
  size?: number;
  badge?: AvatarBadge;
}) {
  return (
    <View accessibilityRole="image" accessibilityLabel="Rekalla">
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Head */}
        <Path
          d="M50 12C34 12 22 22 22 34C14 38 12 48 18 55C14 62 18 72 27 75C30 84 40 88 50 85C60 88 70 84 73 75C82 72 86 62 82 55C88 48 86 38 78 34C78 22 66 12 50 12Z"
          fill={BODY}
        />
        {/* Folds, kept above the face so they never crowd it */}
        <G stroke={FOLD} strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M50 14C50 21 44 23 44 29" />
          <Path d="M36 21C30 27 32 33 28 37" />
          <Path d="M64 21C70 27 68 33 72 37" />
          <Path d="M20 53C26 51 30 55 30 59" />
          <Path d="M80 53C74 51 70 55 70 59" />
        </G>
        {/* Face */}
        <Circle cx={40} cy={52} r={4.5} fill={INK} />
        <Circle cx={60} cy={52} r={4.5} fill={INK} />
        <Path
          d="M42 64C45 68 55 68 58 64"
          stroke={INK}
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
        />

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
