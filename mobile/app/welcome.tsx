/**
 * The first screen. One sentence about what this is, and one way forward.
 */
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/practice/screen";
import { ChunkyButton } from "../components/practice/chunky-button";
import { AppText, Title } from "../components/practice/text";
import { RekallaAvatar } from "../components/rekalla-avatar";
import { colors, space } from "../lib/design/tokens";

export default function Welcome() {
  return (
    <Screen
      footer={
        <ChunkyButton
          label="Continue"
          hint="Goes to the next step of setting up"
          onPress={() => router.push("/setup/who")}
        />
      }
      contentStyle={{ paddingTop: space(8) }}
    >
      <View style={{ alignItems: "center", gap: space(6) }}>
        <RekallaAvatar size={140} />
        <Title center>Practise the things that matter to you</Title>
        <AppText size="bodyLarge" color={colors.inkSoft} center>
          Rekalla asks you about your own people, your own days. A few minutes,
          whenever it suits you.
        </AppText>
      </View>
    </Screen>
  );
}
