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
  const { items, daysPractised } = usePractice();

  return (
    <Screen title="Shall I keep this safe?">
      <RekallaSays avatarSize={84}>
        <View style={{ gap: space(3) }}>
          <AppText size="body">
            {items.length === 1
              ? "Everything you have told me so far lives on this phone, and nowhere else."
              : `Everything you have told me, all ${items.length} of them, lives on this phone and nowhere else.`}
          </AppText>
          <AppText size="body">
            An account keeps a copy, so a lost or replaced phone does not take
            it with it. That is all it does. Nothing here is locked behind it.
          </AppText>
        </View>
      </RekallaSays>

      <View style={{ gap: space(5), paddingTop: space(2) }}>
        <ChunkyButton
          label="Keep a copy for me"
          hint="Makes an account with an email address and a password"
          onPress={() => router.push("/join/create")}
        />
        <ChunkyButton
          label="I already have an account"
          tone="secondary"
          onPress={() => router.push("/join/sign-in")}
        />
        <View style={{ paddingTop: space(4) }}>
          <ChunkyButton
            label="Not just now"
            tone="secondary"
            hint="Carries on without an account. You can do this later from Settings"
            onPress={() => router.replace("/home")}
          />
        </View>
      </View>

      {daysPractised > 0 ? (
        <AppText color={colors.inkSoft} center>
          You can do this later from Settings, whenever you like.
        </AppText>
      ) : null}
    </Screen>
  );
}
