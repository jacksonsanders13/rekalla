/**
 * Saving your practice.
 *
 * Offered after the first session, never before it. Somebody who has already
 * recalled their granddaughter's name knows what they would be saving; a
 * sign-up form on the way in is just a wall in front of a stranger's app.
 *
 * An account is a backup and nothing more. It unlocks nothing, and every
 * route off this screen, including the one that skips it, leads to the same
 * working app.
 */
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/practice/screen";
import { ChunkyButton } from "../../components/practice/chunky-button";
import { RekallaSays } from "../../components/practice/rekalla-says";
import { AppText } from "../../components/practice/text";
import { usePractice } from "../../lib/practice/context";
import { space } from "../../lib/design/tokens";
import { useTheme } from "../../lib/design/theme";

export default function Join() {
  const colors = useTheme();
  const { items, daysPracticed } = usePractice();

  return (
    <Screen title="Save your practice?">
      <RekallaSays avatarSize={84}>
        <View style={{ gap: space(3) }}>
          <AppText size="body">
            {items.length === 1
              ? "Everything you've added is on this phone only."
              : `All ${items.length} things you've added are on this phone only.`}
          </AppText>
          <AppText size="body">
            An account keeps a backup, so a lost phone doesn't take it with it.
            That's all it does. Nothing is locked behind it.
          </AppText>
        </View>
      </RekallaSays>

      <View style={{ gap: space(5), paddingTop: space(2) }}>
        <ChunkyButton
          label="Create an account"
          hint="Email and password"
          onPress={() => router.push("/join/create")}
        />
        <ChunkyButton
          label="I already have an account"
          tone="secondary"
          onPress={() => router.push("/join/sign-in")}
        />
        <View style={{ paddingTop: space(4) }}>
          <ChunkyButton
            label="Not now"
            tone="secondary"
            hint="Continue without one. You can do this later in Settings"
            onPress={() => router.replace("/home")}
          />
        </View>
      </View>

      {daysPracticed > 0 ? (
        <AppText color={colors.inkSoft} center>
          You can do this later in Settings.
        </AppText>
      ) : null}
    </Screen>
  );
}
