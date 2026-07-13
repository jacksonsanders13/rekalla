import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, font, radius, spacing } from "../lib/theme";

/** Full-screen dark scroll container with safe-area padding. */
export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenContent, { flex: 1 }]}>{children}</View>
  );
  return <SafeAreaView style={styles.screen}>{body}</SafeAreaView>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  variant = "primary",
  loading = false,
  style,
  ...props
}: PressableProps & {
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  style?: ViewStyle;
}) {
  const palette = {
    primary: { bg: colors.label, fg: "#000000" },
    secondary: { bg: colors.elev2, fg: colors.label },
    danger: { bg: colors.red, fg: "#ffffff" },
    ghost: { bg: "transparent", fg: colors.label2 },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading || props.disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, opacity: pressed || loading ? 0.7 : 1 },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text style={[styles.buttonLabel, { color: palette.fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: spacing(2) }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.label4}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <Card>
      <Text style={styles.emptyNote}>{children}</Text>
    </Card>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.label3} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  screenContent: { padding: spacing(4), paddingBottom: spacing(10), gap: spacing(4) },
  title: {
    color: colors.label,
    fontSize: font.x3,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: { color: colors.label3, fontSize: font.base, lineHeight: 24 },
  sectionTitle: {
    color: colors.label,
    fontSize: font.xl,
    fontWeight: "700",
    marginTop: spacing(2),
  },
  card: {
    backgroundColor: colors.elev1,
    borderRadius: radius.xl,
    padding: spacing(5),
    gap: spacing(3),
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing(5),
  },
  buttonLabel: { fontSize: font.base, fontWeight: "700" },
  fieldLabel: { color: colors.label2, fontSize: font.base, fontWeight: "600" },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.elev1,
    color: colors.label,
    paddingHorizontal: spacing(4),
    fontSize: font.base,
  },
  emptyNote: { color: colors.label3, fontSize: font.base, lineHeight: 24 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
});
