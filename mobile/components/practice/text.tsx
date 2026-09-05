/**
 * Text, at a size this app is willing to use.
 *
 * Every size comes from the scale in tokens.ts, which starts at 20. Font
 * scaling is left on, so iOS enlarges these again for Dynamic Type, and the
 * in-app setting multiplies once more. Nothing here caps that: a layout that
 * cannot cope with the largest size is a layout to fix, not a size to limit.
 */
import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, fonts, lineHeightFor, type } from "../../lib/design/tokens";
import { useTextScale } from "../../lib/design/text-scale";

type Size = keyof typeof type;

interface AppTextProps extends TextProps {
  size?: Size;
  weight?: keyof typeof fonts;
  color?: string;
  center?: boolean;
}

export function AppText({
  size = "body",
  weight = "semibold",
  color = colors.ink,
  center = false,
  style,
  ...rest
}: AppTextProps) {
  const scale = useTextScale();
  const fontSize = Math.round(type[size] * scale);

  const base: TextStyle = {
    fontSize,
    lineHeight: lineHeightFor(fontSize),
    fontFamily: fonts[weight],
    color,
    textAlign: center ? "center" : "auto",
  };

  return <Text {...rest} style={[base, style]} />;
}

/** A screen's own heading. There is one per screen and it comes first. */
export function Title(props: Omit<AppTextProps, "size" | "weight">) {
  return <AppText {...props} size="title" weight="bold" accessibilityRole="header" />;
}

/** Supporting text under a heading or a field. */
export function Hint(props: Omit<AppTextProps, "size" | "color">) {
  return <AppText {...props} size="body" color={colors.inkSoft} />;
}
