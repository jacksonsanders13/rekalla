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
import { ChoiceRow } from "../../components/practice/choice-row";
import { RekallaSays } from "../../components/practice/rekalla-says";
import { Hint } from "../../components/practice/text";
import { usePractice } from "../../lib/practice/context";
import { space } from "../../lib/design/tokens";
import { SETUP_STEPS } from "./recall";
import type { SetupMode } from "../../lib/practice/types";

export default function Who() {
  const { user, ensureUser, updateUser } = usePractice();
  const mode = user?.setupMode ?? "self";

  async function choose(next: SetupMode) {
    await ensureUser();
    await updateUser({ setupMode: next });
  }

  return (
    <Screen
      onBack={() => router.back()}
      progress={2 / SETUP_STEPS}
      footer={
        <ChunkyButton
          label="Continue"
          hint="Goes to the next question"
          onPress={() => router.push("/setup/goal")}
        />
      }
    >
      <RekallaSays avatarSize={76}>And who is this for?</RekallaSays>

      <Hint>
        This only changes how Rekalla words things. Either way, the practice
        belongs to the person doing it.
      </Hint>

      <View style={{ gap: space(4) }}>
        <ChoiceRow
          label="It is for me"
          selected={mode === "self"}
          onPress={() => void choose("self")}
        />
        <ChoiceRow
          label="I am helping someone set it up"
          sublabel="You will be adding things on their behalf"
          selected={mode === "helper"}
          onPress={() => void choose("helper")}
        />
      </View>
    </Screen>
  );
}
