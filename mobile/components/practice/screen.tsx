/**
 * One task, one screen.
 *
 * A screen is a heading, some content, and an action pinned to the bottom.
 * The content scrolls, which is what keeps the layout intact when Dynamic
 * Type doubles every size on it: text wraps and the page gets longer rather
 * than anything being clipped or overlapped.
 *
 * Back is part of the frame rather than something each screen remembers to
 * add, so every screen has one.
 */
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TAP_MIN, space } from "../../lib/design/tokens";
import { AppText, Title } from "./text";
import { useTheme } from "../../lib/design/theme";

interface ScreenProps {
  title?: string;
  /** Shows a Back control at the top left. Omit only where there is nowhere to go back to. */
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
  /** Pinned under the content, out of the scroll. */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Fills the width edge to edge; used by the practice screen for photos. */
  bleed?: boolean;
}

export function Screen({
  title,
  onBack,
  backLabel = "Back",
  children,
  footer,
  contentStyle,
  bleed = false,
}: ScreenProps) {
  const colors = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // Keeps the pinned action above the keyboard rather than under it.
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {onBack ? (
          <View style={{ paddingHorizontal: space(3), paddingTop: space(1) }}>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              style={{
                minHeight: TAP_MIN,
                minWidth: TAP_MIN,
                justifyContent: "center",
                paddingRight: space(4),
              }}
            >
              <AppText size="body" weight="bold" color={colors.focus}>
                {`‹  ${backLabel}`}
              </AppText>
            </Pressable>
          </View>
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            {
              paddingHorizontal: bleed ? 0 : space(6),
              paddingTop: space(2),
              paddingBottom: space(6),
              gap: space(5),
            },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {title ? (
            <View style={{ paddingHorizontal: bleed ? space(6) : 0 }}>
              <Title>{title}</Title>
            </View>
          ) : null}
          {children}
        </ScrollView>

        {footer ? (
          <View
            style={{
              paddingHorizontal: space(6),
              paddingTop: space(3),
              paddingBottom: space(3),
              gap: space(3),
              borderTopWidth: 1,
              borderTopColor: colors.line,
              backgroundColor: colors.paper,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
