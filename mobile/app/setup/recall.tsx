/**
 * The first question, and the one the rest of setting up hangs off.
 *
 * It is not a survey. What gets picked here decides which template is filled
 * in first, and the screen after the first practice offers the next thing on
 * the list by name. A question that changes nothing is one people can feel is
 * pointless, and they are right.
 *
 * More than one answer is allowed, and at least one is required — Continue
 * stays dead until something is chosen, so nobody taps through it by accident
 * and ends up with an app about nothing in particular.
 */
import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/practice/screen";
import { ChunkyButton } from "../../components/practice/chunky-button";
import { ChoiceRow } from "../../components/practice/choice-row";
import { CategoryGlyph } from "../../components/practice/category-glyph";
import { RekallaSays } from "../../components/practice/rekalla-says";
import { Hint } from "../../components/practice/text";
import { useTheme } from "../../lib/design/theme";
import { usePractice } from "../../lib/practice/context";
import { CATEGORY_ORDER, TEMPLATES } from "../../lib/practice/templates";
import { space } from "../../lib/design/tokens";
import type { ItemCategory } from "../../lib/practice/types";

/** How each kind is described when it is being offered, rather than added. */
const OFFERS: Record<ItemCategory, string> = {
  person: "The people in my life",
  routine: "How my day goes",
  place: "Where I keep things",
  fact: "Names, numbers and facts",
};

export const SETUP_STEPS = 4;

export default function Recall() {
  const colors = useTheme();
  const { user, ensureUser, updateUser } = usePractice();
  const [wants, setWants] = useState<ItemCategory[]>(user?.wants ?? []);

  function toggle(category: ItemCategory) {
    setWants((current) =>
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category],
    );
  }

  async function onward() {
    await ensureUser();
    await updateUser({ wants });
    router.push("/setup/who");
  }

  return (
    <Screen
      onBack={() => router.back()}
      progress={1 / SETUP_STEPS}
      footer={
        <ChunkyButton
          label="Continue"
          disabled={wants.length === 0}
          hint={
            wants.length === 0
              ? "Choose at least one to carry on"
              : "Goes to the next question"
          }
          onPress={() => void onward()}
        />
      }
    >
      <RekallaSays avatarSize={76}>
        What would you like to be able to recall?
      </RekallaSays>

      <Hint>Choose as many as you like. It decides what we start with.</Hint>

      <View style={{ gap: space(4) }}>
        {CATEGORY_ORDER.map((category) => (
          <ChoiceRow
            key={category}
            label={OFFERS[category]}
            sublabel={TEMPLATES[category].blurb}
            selected={wants.includes(category)}
            onPress={() => toggle(category)}
            glyph={
              <CategoryGlyph
                category={category}
                color={wants.includes(category) ? colors.primary : colors.inkSoft}
              />
            }
          />
        ))}
      </View>
    </Screen>
  );
}
