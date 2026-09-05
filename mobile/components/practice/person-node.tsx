/**
 * A person as a round node, with a ring showing how far along they are.
 *
 * Used on the family tree and on the path on Home, so the same face means the
 * same thing in both places. The ring fills as the gaps between practices get
 * longer, which is the honest measure of progress here: it says how far apart
 * the reminders have grown, never how many times anybody got it wrong.
 */
import { Pressable, View, Image } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { space } from "../../lib/design/tokens";
import { usePhotoUri } from "../../lib/practice/photos";
import { AppText } from "./text";
import { useTheme, type Palette } from "../../lib/design/theme";

export type NodeTone = "person" | "you" | "next";

/**
 * How settled something is, in words, for the label VoiceOver reads. Never
 * anything a person could hear as a mark out of ten, and never anything that
 * goes down: an item that slips back simply describes itself more modestly.
 */
export function settledPhrase(progress: number): string {
  if (progress <= 0.01) return "not practised yet";
  if (progress < 0.34) return "just getting started";
  if (progress < 0.67) return "coming along";
  if (progress < 1) return "well settled";
  return "second nature";
}

/** Ring and fill for each kind of node, against the palette in force. */
function tonesFor(colors: Palette) {
  return {
    person: { ring: colors.primary, border: colors.line, fill: colors.card },
    you: { ring: colors.focus, border: colors.focus, fill: colors.card },
    next: { ring: colors.primary, border: colors.primary, fill: colors.card },
  } as const;
}

export function PersonNode({
  name,
  sublabel,
  photoKey,
  /** 0 to 1, from how far up the interval ladder the item has climbed. */
  progress = 0,
  tone = "person",
  size = 104,
  onPress,
  width = 150,
}: {
  name: string;
  sublabel?: string | null;
  photoKey?: string | null;
  progress?: number;
  tone?: NodeTone;
  size?: number;
  onPress?: () => void;
  width?: number;
}) {
  const colors = useTheme();
  const uri = usePhotoUri(photoKey ?? null);
  const palette = tonesFor(colors)[tone];

  const stroke = 8;
  const ringRadius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const filled = Math.max(0, Math.min(1, progress)) * circumference;
  const inner = size - stroke * 2 - 4;

  const label = [
    name,
    sublabel ?? undefined,
    tone === "you" ? undefined : settledPhrase(progress),
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "image"}
      accessibilityLabel={label}
      style={{ width, alignItems: "center", gap: space(2) }}
    >
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={ringRadius}
            stroke={palette.border}
            strokeWidth={stroke}
            fill="none"
          />
          {filled > 0 ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={ringRadius}
              stroke={palette.ring}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              fill="none"
            />
          ) : null}
        </Svg>

        <View
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: palette.fill,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {uri ? (
            <Image
              source={{ uri }}
              accessibilityElementsHidden
              importantForAccessibility="no"
              resizeMode="cover"
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <AppText size="title" weight="bold" color={colors.inkSoft}>
              {name.trim().charAt(0).toUpperCase()}
            </AppText>
          )}
        </View>
      </View>

      <View style={{ alignItems: "center" }}>
        <AppText size="body" weight="bold" center>
          {name}
        </AppText>
        {sublabel ? (
          <AppText size="body" color={colors.inkSoft} center>
            {sublabel}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

/** A shape to add into, sitting on the tree where a person would. */
export function AddNode({
  label,
  onPress,
  size = 104,
  width = 150,
}: {
  label: string;
  onPress: () => void;
  size?: number;
  width?: number;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width, alignItems: "center", gap: space(2) }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 4,
          borderStyle: "dashed",
          borderColor: colors.line,
          backgroundColor: colors.card,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppText size="hero" weight="bold" color={colors.inkSoft}>
          +
        </AppText>
      </View>
      <AppText size="body" color={colors.inkSoft} center>
        {label}
      </AppText>
    </Pressable>
  );
}
