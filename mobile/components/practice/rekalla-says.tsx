/**
 * Rekalla explaining himself.
 *
 * Every screen that asks for something says why it is asking, in his voice,
 * before the field. A form that collects four things without telling you what
 * any of them are for is a form people abandon, and this audience has more
 * reason than most to be wary of one.
 */
import type { ReactNode } from "react";
import { View } from "react-native";
import { RekallaAvatar } from "../rekalla-avatar";
import { AppText } from "./text";
import { radius, space } from "../../lib/design/tokens";
import { useTheme } from "../../lib/design/theme";

export function RekallaSays({
  children,
  avatarSize = 72,
}: {
  children: ReactNode;
  avatarSize?: number;
}) {
  const colors = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space(2) }}>
      <View style={{ paddingTop: space(2) }}>
        <RekallaAvatar size={avatarSize} />
      </View>

      {/* The tail. A square on its corner, tucked under the bubble's edge. */}
      <View
        style={{
          width: 18,
          height: 18,
          backgroundColor: colors.card,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: colors.line,
          transform: [{ rotate: "45deg" }],
          marginTop: space(7),
          marginRight: -11,
          zIndex: 1,
        }}
      />

      <View
        style={{
          flex: 1,
          minWidth: 0,
          backgroundColor: colors.card,
          borderWidth: 2,
          borderColor: colors.line,
          borderRadius: radius.card,
          padding: space(4),
        }}
      >
        {typeof children === "string" ? <AppText size="body">{children}</AppText> : children}
      </View>
    </View>
  );
}
