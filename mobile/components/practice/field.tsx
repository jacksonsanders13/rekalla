/**
 * A labelled field, at a size somebody can actually see what they typed in.
 *
 * The password is shown by default. Hiding what you type is a defence against
 * somebody reading over your shoulder, and for this audience the far more
 * likely outcome is three failed sign-ins and a lost account because the
 * characters were dots. The control to hide it is right there, spelled out
 * as a word rather than an eye.
 */
import { useState } from "react";
import { Pressable, TextInput, View, type KeyboardTypeOptions } from "react-native";
import {
  TAP_MIN,
  colors,
  fonts,
  lineHeightFor,
  radius,
  space,
  type as typeScale,
} from "../../lib/design/tokens";
import { useTextScale } from "../../lib/design/text-scale";
import { AppText } from "./text";

export function Field({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType,
  autoComplete,
  onSubmitEditing,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: "email" | "password" | "new-password" | "off";
  onSubmitEditing?: () => void;
}) {
  const scale = useTextScale();
  const [hidden, setHidden] = useState(false);
  const size = Math.round(typeScale.bodyLarge * scale);

  return (
    <View style={{ gap: space(2) }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space(3),
        }}
      >
        <AppText size="bodyLarge" weight="bold" style={{ flexShrink: 1 }}>
          {label}
        </AppText>

        {secure ? (
          <Pressable
            onPress={() => setHidden((was) => !was)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show the password" : "Hide the password"}
            style={{
              minHeight: TAP_MIN,
              minWidth: TAP_MIN,
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            <AppText size="body" weight="bold" color={colors.focus}>
              {hidden ? "Show" : "Hide"}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        accessibilityLabel={label}
        secureTextEntry={secure && hidden}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        style={{
          minHeight: TAP_MIN + space(2),
          borderWidth: 2,
          borderColor: colors.line,
          borderRadius: radius.button,
          backgroundColor: colors.card,
          paddingHorizontal: space(4),
          paddingVertical: space(3),
          fontFamily: fonts.semibold,
          fontSize: size,
          lineHeight: lineHeightFor(size),
          color: colors.ink,
        }}
      />

      {hint ? (
        <AppText size="body" color={colors.inkSoft}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
