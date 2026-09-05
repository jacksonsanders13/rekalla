/**
 * How much practice a day.
 *
 * Four sizes, worded as a temperament rather than a target, because a target
 * is a thing you can fall short of. Nothing is lost by missing it and nothing
 * is counted, so the number only decides how long a session runs before it
 * says it is done.
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

export const DAILY_GOALS = [
  { cards: 5, label: "Gentle", sublabel: "About five things a day" },
  { cards: 10, label: "Steady", sublabel: "About ten things a day" },
  { cards: 15, label: "Keen", sublabel: "About fifteen things a day" },
  { cards: 20, label: "Serious", sublabel: "About twenty things a day" },
];

export default function Goal() {
  const { user, updateUser } = usePractice();
  const chosen = user?.dailyGoalCards ?? 10;

  return (
    <Screen
      onBack={() => router.back()}
      progress={3 / SETUP_STEPS}
      footer={
        <ChunkyButton
          label="Continue"
          hint="Goes on to how practice works"
          onPress={() => router.push("/setup/explain")}
        />
      }
    >
      <RekallaSays avatarSize={76}>How much practice feels right?</RekallaSays>

      <Hint>
        Nothing is lost by missing a day, and you can change this whenever you
        like.
      </Hint>

      <View style={{ gap: space(4) }}>
        {DAILY_GOALS.map((goal) => (
          <ChoiceRow
            key={goal.cards}
            label={goal.label}
            sublabel={goal.sublabel}
            selected={chosen === goal.cards}
            onPress={() => void updateUser({ dailyGoalCards: goal.cards })}
          />
        ))}
      </View>
    </Screen>
  );
}
