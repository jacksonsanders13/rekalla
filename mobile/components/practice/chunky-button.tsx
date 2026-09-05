/**
 * The button the whole app is built on.
 *
 * A solid fill with a darker edge underneath, which the face drops onto when
 * pressed. It is the most recognisable thing about this style, and it happens
 * to be exactly what an imprecise tap needs: a large, obvious, physical
 * target that says plainly whether it was hit.
 *
 * Full width and at least 60pt tall before Dynamic Type, with the label free
 * to wrap onto as many lines as it needs.
 */
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import {
  BUTTON_EDGE,
  TAP_MIN,
  colors,
  radius,
  space,
} from "../../lib/design/tokens";
import { AppText } from "./text";

export type ButtonTone = "primary" | "secondary";

interface ChunkyButtonProps {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  /** Spoken after the label, to say what happens next. */
  hint?: string;
  disabled?: boolean;
  /** For a button that is one of a set of choices, so VoiceOver says which is on. */
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TONES = {
  primary: {
    face: colors.primary,
    edge: colors.primaryEdge,
    text: colors.primaryInk,
    border: "transparent",
  },
  secondary: {
    face: colors.card,
    edge: colors.cardEdge,
    text: colors.ink,
    border: colors.line,
  },
} as const;

export function ChunkyButton({
  label,
  onPress,
  tone = "primary",
  hint,
  disabled = false,
  selected,
  style,
}: ChunkyButtonProps) {
  const palette = TONES[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={selected === undefined ? { disabled } : { disabled, selected }}
      style={[
        {
          backgroundColor: palette.edge,
          borderRadius: radius.button,
          paddingBottom: BUTTON_EDGE,
          opacity: disabled ? 0.45 : 1,
          width: "100%",
        },
        style,
      ]}
    >
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: palette.face,
            borderRadius: radius.button,
            borderWidth: 2,
            borderColor: palette.border,
            minHeight: TAP_MIN,
            paddingVertical: space(4),
            paddingHorizontal: space(5),
            alignItems: "center",
            justifyContent: "center",
            // Drops onto its own edge. A state change, not an animation, so
            // it behaves the same way with Reduce Motion on.
            transform: [{ translateY: pressed && !disabled ? BUTTON_EDGE : 0 }],
          }}
        >
          <AppText size="button" weight="bold" color={palette.text} center>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
