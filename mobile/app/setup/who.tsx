/**
 * Who is holding the phone.
 *
 * This changes how the app words things and nothing else. There is one
 * account either way, it belongs to the person practising, and a family
 * member helps here on the device rather than from somewhere else.
 */
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/practice/screen";
import { ChunkyButton } from "../../components/practice/chunky-button";
import { Hint } from "../../components/practice/text";
import { usePractice } from "../../lib/practice/context";
import { space } from "../../lib/design/tokens";
import type { SetupMode } from "../../lib/practice/types";

export default function Who() {
  const { beginSetup } = usePractice();

  async function choose(mode: SetupMode) {
    await beginSetup(mode);
    router.push("/setup/explain");
  }

  return (
    <Screen title="Who is setting this up?" onBack={() => router.back()}>
      <Hint>
        This only changes how Rekalla words things. Either way, the practice
        belongs to the person doing it.
      </Hint>

      <View style={{ gap: space(6), paddingTop: space(2) }}>
        <ChunkyButton
          label="I am setting this up for myself"
          tone="secondary"
          onPress={() => choose("self")}
        />
        <ChunkyButton
          label="I am helping someone set it up"
          tone="secondary"
          onPress={() => choose("helper")}
        />
      </View>
    </Screen>
  );
}
