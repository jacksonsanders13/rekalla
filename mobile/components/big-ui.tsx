/**
 * v2 accessible UI primitives for the older-adult surfaces (Part D).
 * Every interactive element is >= 60x60pt, text is >= 20pt, and every control
 * takes an explicit accessibilityLabel. Meaning is never carried by color alone
 * (icon + text label always paired).
 */
import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, fonts } from "../lib/theme";
import { a11y, a11yFont, TAP_MIN } from "../lib/a11y";

export function BodyText({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function BigTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.title} accessibilityRole="header">{children}</Text>;
}

export function BigButton({
  label,
  icon,
  variant = "primary",
  style,
  accessibilityLabel,
  ...props
}: PressableProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary" | "danger" | "emergency";
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const palette = {
    primary: { bg: colors.label, fg: "#000000" },
    secondary: { bg: colors.elev2, fg: colors.label },
    danger: { bg: colors.red, fg: "#ffffff" },
    emergency: { bg: colors.red, fg: "#ffffff" },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.button,
        variant === "emergency" && styles.emergencyButton,
        { backgroundColor: palette.bg, opacity: pressed ? 0.75 : 1 },
        style,
      ]}
      {...props}
    >
      {icon ? <Ionicons name={icon} size={28} color={palette.fg} /> : null}
      <Text style={[styles.buttonLabel, { color: palette.fg }]}>{label}</Text>
    </Pressable>
  );
}

export function BigField({
  label,
  hint,
  style,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: a11y.space(2) }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.label4}
        // iOS keyboard dictation (the mic on the keyboard) is the interim
        // voice-input path for every free-text field until on-device STT lands.
        {...props}
        style={[styles.input, props.multiline && styles.inputMultiline, style]}
      />
    </View>
  );
}

/** Large circular mic button for the assistant. min 60, rendered much larger. */
export function MicButton({
  active,
  onPress,
  accessibilityLabel,
}: {
  active?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.mic,
        { backgroundColor: active ? colors.red : colors.blue, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons name={active ? "stop" : "mic"} size={56} color="#ffffff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.label, fontSize: a11yFont.body, fontFamily: fonts.regular, lineHeight: a11y.lineHeight(a11yFont.body) },
  title: { color: colors.label, fontSize: a11yFont.title, fontFamily: fonts.bold, fontWeight: "700" },
  button: {
    minHeight: TAP_MIN,
    minWidth: TAP_MIN,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: a11y.space(2),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: a11y.space(6),
    paddingVertical: a11y.space(4),
  },
  emergencyButton: { minHeight: 84 }, // 911 must be unmissable
  buttonLabel: { fontSize: a11yFont.button, fontFamily: fonts.bold, fontWeight: "700" },
  fieldLabel: { color: colors.label, fontSize: a11yFont.body, fontFamily: fonts.bold, fontWeight: "700" },
  hint: { color: colors.label3, fontSize: a11yFont.body - 2, fontFamily: fonts.regular, lineHeight: a11y.lineHeight(a11yFont.body - 2) },
  input: {
    minHeight: TAP_MIN,
    borderRadius: radius.md,
    backgroundColor: colors.elev1,
    color: colors.label,
    paddingHorizontal: a11y.space(4),
    fontSize: a11yFont.body, fontFamily: fonts.regular,
  },
  inputMultiline: { minHeight: 120, paddingTop: a11y.space(3), textAlignVertical: "top" },
  mic: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});
