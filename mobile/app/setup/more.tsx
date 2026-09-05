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
    <Screen title="That's the whole of it">
      <RekallaSays avatarSize={84}>
        <View style={{ gap: space(3) }}>
          <AppText size="body">
            {first
              ? `That is what practice looks like. ${first.answer} will come back tomorrow, then in two days, then further apart each time you get it.`
              : "That is what practice looks like, and it gets further apart each time you get one right."}
          </AppText>
          <AppText size="body">
            {next
              ? `You said you wanted ${TEMPLATES[next].label.toLowerCase()} too. We can do that now, or any time.`
              : "Add as much or as little as you like, whenever it suits. There is no hurry and nothing to finish."}
          </AppText>
        </View>
      </RekallaSays>

      <View style={{ gap: space(5), paddingTop: space(2) }}>
        <ChunkyButton
          label="Continue"
          hint="Goes on to setting a reminder"
          onPress={() => router.replace("/setup/reminder")}
        />
        <ChunkyButton
          label={next ? `Add ${TEMPLATES[next].label.toLowerCase()} first` : "Add something else first"}
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
          ? "One person on your tree so far."
          : `${items.length} on your tree so far.`}
      </AppText>
    </Screen>
  );
}
