/**
 * A row you pick, in a list of things you might pick.
 *
 * Used by every question in setting up. It is the same chunky slab as a
 * button, laid out left to right so a mark and a second line fit, and it says
 * plainly whether it is chosen — a tick and a coloured edge, not colour alone,
 * because colour alone is not something everyone can read.
 */
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import {
  BUTTON_EDGE,
  TAP_MIN,
  radius,
  space,
} from "../../lib/design/tokens";
import { useTheme } from "../../lib/design/theme";
import { AppText } from "./text";

export function ChoiceRow({
  label,
  sublabel,
  glyph,
  selected = false,
  onPress,
  /** Said after the label, for anyone who cannot see the tick. */
  hint,
}: {
  label: string;
  sublabel?: string | null;
  glyph?: ReactNode;
  selected?: boolean;
  onPress: () => void;
  hint?: string;
}) {
  const colors = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={sublabel ? `${label}. ${sublabel}` : label}
      accessibilityHint={hint}
      style={{
        backgroundColor: selected ? colors.primaryEdge : colors.cardEdge,
        borderRadius: radius.button,
        paddingBottom: BUTTON_EDGE,
        width: "100%",
      }}
    >
      {({ pressed }) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space(3),
            backgroundColor: colors.card,
            borderRadius: radius.button,
            borderWidth: 2,
            borderColor: selected ? colors.primary : colors.line,
            minHeight: TAP_MIN + space(2),
            paddingVertical: space(4),
            paddingHorizontal: space(4),
            transform: [{ translateY: pressed ? BUTTON_EDGE : 0 }],
          }}
        >
          {glyph ? <View style={{ flexShrink: 0 }}>{glyph}</View> : null}

          <View style={{ flex: 1, minWidth: 0, gap: space(1) }}>
            <AppText size="bodyLarge" weight="bold">
              {label}
            </AppText>
            {sublabel ? (
              <AppText size="body" color={colors.inkSoft}>
                {sublabel}
              </AppText>
            ) : null}
          </View>

          {selected ? (
            <AppText size="bodyLarge" weight="bold" color={colors.primary}>
              ✓
            </AppText>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
