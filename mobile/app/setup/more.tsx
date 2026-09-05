/**
 * After the first practice.
 *
 * Setting up adds one person, as an example, and this is where that is said
 * out loud: the rest of the family goes on the tree, at whatever pace suits.
 * Sitting somebody down to enter their whole family before they have seen
 * what any of it is for is how you lose them on the second screen.
 */
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/practice/screen";
import { ChunkyButton } from "../../components/practice/chunky-button";
import { RekallaSays } from "../../components/practice/rekalla-says";
import { AppText } from "../../components/practice/text";
import { usePractice } from "../../lib/practice/context";
import { TEMPLATES } from "../../lib/practice/templates";
import { space } from "../../lib/design/tokens";
import { useTheme } from "../../lib/design/theme";

export default function More() {
  const colors = useTheme();
  const { items, user } = usePractice();
  const first = items[items.length - 1];

  // The next thing they said they wanted and have not added yet. Naming it
  // is the whole reason the first question was worth asking.
  const next = (user?.wants ?? []).find(
    (want) => !items.some((item) => item.category === want),
  );

  return (
    <Screen title="That's how it works">
      <RekallaSays avatarSize={84}>
        <View style={{ gap: space(3) }}>
          <AppText size="body">
            {first
              ? `${first.answer} comes back tomorrow, then in 2 days, then further apart each time you get it right.`
              : "It comes back tomorrow, then further apart each time you get it right."}
          </AppText>
          <AppText size="body">
            {next
              ? `You also picked ${TEMPLATES[next].label.toLowerCase()}. Add it now, or later.`
              : "Add more whenever you want. There's nothing to finish."}
          </AppText>
        </View>
      </RekallaSays>

      <View style={{ gap: space(5), paddingTop: space(2) }}>
        <ChunkyButton
          label="Continue"
          hint="Next"
          onPress={() => router.replace("/setup/reminder")}
        />
        <ChunkyButton
          label={next ? `Add ${TEMPLATES[next].label.toLowerCase()} first` : "Add something else"}
          tone="secondary"
          onPress={() =>
            router.push(
              next
                ? `/add?category=${next}&after=setup`
                : "/add?after=setup",
            )
          }
        />
      </View>

      <AppText color={colors.inkSoft} center>
        {items.length === 1
          ? "1 on your tree."
          : `${items.length} on your tree.`}
      </AppText>
    </Screen>
  );
}
