/**
 * The first screen. One sentence about what this is, and one way forward.
 */
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/practice/screen";
import { ChunkyButton } from "../components/practice/chunky-button";
import { AppText, Title } from "../components/practice/text";
import { RekallaAvatar } from "../components/rekalla-avatar";
import { space } from "../lib/design/tokens";
import { useTheme } from "../lib/design/theme";

export default function Welcome() {
  const colors = useTheme();
  return (
    <Screen
      footer={
        <ChunkyButton
          label="Get started"
          hint="Goes to the next step of setting up"
          onPress={() => router.push("/setup/recall")}
        />
      }
      contentStyle={{ paddingTop: space(8) }}
    >
      <View style={{ alignItems: "center", gap: space(6) }}>
        <RekallaAvatar size={140} />
        <Title center>Remember the people who matter</Title>
        <AppText size="bodyLarge" color={colors.inkSoft} center>
          A few minutes a day. Real names, real faces, from your own life.
        </AppText>
      </View>
    </Screen>
  );
}
