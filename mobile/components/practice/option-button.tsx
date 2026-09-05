/**
 * One of the three answers to choose from.
 *
 * The states matter more than the styling here. When an answer is wrong, the
 * right one lights up in the warm sand wash and the tapped one simply goes
 * quiet. There is no red, no shake, no cross and no sound: the person is told
 * what the answer is, and then asked again.
 */
import { Pressable, View } from "react-native";
import { BUTTON_EDGE, TAP_MIN, radius, space } from "../../lib/design/tokens";
import { AppText } from "./text";
import { useTheme, type Palette } from "../../lib/design/theme";

export type OptionState =
  /** Not answered yet. */
  | "idle"
  /** Chosen, and right. */
  | "chosen-correct"
  /** The right answer, shown after a miss. */
  | "shown-answer"
  /** Chosen, and not the answer. Quiet, not punished. */
  | "chosen-other"
  /** Another option, once the question is answered. */
  | "settled";

/**
 * How each state looks, against the palette in force. The important one is
 * what is absent: nothing here is red, and the option somebody tapped by
 * mistake only ever goes quiet.
 */
function statesFor(colors: Palette) {
  return {
    idle: {
      face: colors.card, edge: colors.cardEdge, border: colors.line,
      text: colors.ink, mark: "",
    },
    "chosen-correct": {
      face: colors.success, edge: colors.successEdge, border: colors.successEdge,
      text: colors.successInk, mark: "✓  ",
    },
    "shown-answer": {
      face: colors.reveal, edge: colors.revealEdge, border: colors.revealEdge,
      text: colors.revealInk, mark: "✓  ",
    },
    "chosen-other": {
      face: colors.card, edge: colors.cardEdge, border: colors.line,
      text: colors.inkSoft, mark: "",
    },
    settled: {
      face: colors.card, edge: colors.cardEdge, border: colors.line,
      text: colors.inkSoft, mark: "",
    },
  } as const;
}

/** What VoiceOver says about an option once the question has been answered. */
const SPOKEN: Record<OptionState, string> = {
  idle: "",
  "chosen-correct": "Correct",
  "shown-answer": "This is the answer",
  "chosen-other": "You chose this one",
  settled: "",
};

export function OptionButton({
  label,
  state = "idle",
  onPress,
  disabled = false,
}: {
  label: string;
  state?: OptionState;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useTheme();
  const palette = statesFor(colors)[state];
  const spoken = SPOKEN[state];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={spoken ? `${label}. ${spoken}` : label}
      accessibilityState={{
        disabled,
        selected: state === "chosen-correct" || state === "chosen-other",
      }}
      style={{
        backgroundColor: palette.edge,
        borderRadius: radius.button,
        paddingBottom: BUTTON_EDGE,
        width: "100%",
      }}
    >
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: palette.face,
            borderRadius: radius.button,
            borderWidth: 2,
            borderColor: palette.border,
            minHeight: TAP_MIN + space(2),
            paddingVertical: space(4),
            paddingHorizontal: space(5),
            justifyContent: "center",
            transform: [{ translateY: pressed && !disabled ? BUTTON_EDGE : 0 }],
          }}
        >
          <AppText size="bodyLarge" weight="bold" color={palette.text} center>
            {`${palette.mark}${label}`}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
