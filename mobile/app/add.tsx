/**
 * Adding something, any time.
 *
 * Pick one of four kinds, then answer the questions for it. There is no
 * blank card and no free-form authoring: every prompt in the app is phrased
 * by a template, which is what keeps them answerable and consistent.
 *
 * Whatever is added is practised straight away, while the person still has it
 * in mind. That is also its introduction, so it comes back tomorrow.
 */
import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../components/practice/screen";
import { AddFlow } from "../components/practice/add-flow";
import { ChunkyButton } from "../components/practice/chunky-button";
import { AppText, Hint } from "../components/practice/text";
import { usePractice } from "../lib/practice/context";
import { CATEGORY_ORDER, TEMPLATES } from "../lib/practice/templates";
import { space } from "../lib/design/tokens";
import type { ItemCategory } from "../lib/practice/types";
import { useTheme } from "../lib/design/theme";

export default function Add() {
  const colors = useTheme();
  const { addItem } = usePractice();
  const params = useLocalSearchParams<{ category?: string }>();

  // The tree adds people directly, so it skips the picker.
  const preset = CATEGORY_ORDER.find((key) => key === params.category) ?? null;
  const [category, setCategory] = useState<ItemCategory | null>(preset);

  if (category) {
    return (
      <AddFlow
        template={TEMPLATES[category]}
        finishLabel="Save"
        onCancel={() => (preset ? router.back() : setCategory(null))}
        onDone={async (values, photoBase64) => {
          const item = await addItem({ category, values, photoBase64 });
          router.replace({
            pathname: "/practice",
            params: { mode: "intro", itemId: item.id, after: "home" },
          });
        }}
      />
    );
  }

  return (
    <Screen title="What would you like to remember?" onBack={() => router.back()}>
      <Hint>Rekalla will ask you about it, starting today.</Hint>

      <View style={{ gap: space(5), paddingTop: space(2) }}>
        {CATEGORY_ORDER.map((key) => (
          <View key={key} style={{ gap: space(1) }}>
            <ChunkyButton
              label={TEMPLATES[key].label}
              tone="secondary"
              hint={TEMPLATES[key].blurb}
              onPress={() => setCategory(key)}
            />
            <AppText color={colors.inkSoft} center>
              {TEMPLATES[key].blurb}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}
