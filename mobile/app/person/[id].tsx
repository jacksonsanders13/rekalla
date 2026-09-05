/**
 * One person, from the tree or the path.
 *
 * Their photo at a size worth looking at, what you told me about them, where
 * they sit on the tree, and when they next come round. The place to say where
 * somebody belongs if the word they were described by was not one I knew.
 */
import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../components/practice/screen";
import { ChunkyButton } from "../../components/practice/chunky-button";
import { MemoryPhoto } from "../../components/practice/memory-photo";
import { AppText, Hint } from "../../components/practice/text";
import { settledPhrase } from "../../components/practice/person-node";
import { usePractice } from "../../lib/practice/context";
import { ladderProgress } from "../../lib/practice/scheduler";
import { PLACEMENT_CHOICES, bandHeading } from "../../lib/practice/relations";
import { radius, space } from "../../lib/design/tokens";
import { useTheme } from "../../lib/design/theme";

/** "In 4 days", "Tomorrow", "Ready now". Never a date to work out. */
function nextUp(dueAt: string): string {
  const due = new Date(dueAt);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.round(
    (new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() -
      startOfToday.getTime()) /
      86_400_000,
  );

  if (days <= 0) return "Ready now";
  if (days === 1) return "Back tomorrow";
  if (days < 14) return `Back in ${days} days`;
  const weeks = Math.round(days / 7);
  return `Back in about ${weeks} weeks`;
}

export default function Person() {
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, data, updateItem, removeItem } = usePractice();
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const item = items.find((candidate) => candidate.id === id);
  const card = data.cards.find((candidate) => candidate.memoryItemId === id);

  if (!item) {
    return (
      <Screen title="Not here" onBack={() => router.back()}>
        <AppText color={colors.inkSoft}>
          This was removed. Everything else is where you left it.
        </AppText>
      </Screen>
    );
  }

  const progress = card ? ladderProgress(card) : 0;

  return (
    <Screen
      title={item.answer}
      onBack={() => router.back()}
      footer={
        <ChunkyButton
          label="Practice this now"
          onPress={() =>
            router.replace({
              pathname: "/practice",
              params: { mode: "intro", itemId: item.id, after: "home" },
            })
          }
        />
      }
    >
      <MemoryPhoto photoKey={item.photoKey} />

      <View style={{ gap: space(2) }}>
        {item.relationship ? (
          <AppText size="bodyLarge" weight="bold">
            {`Your ${item.relationship.toLowerCase()}`}
          </AppText>
        ) : (
          <AppText size="bodyLarge" weight="bold">
            {item.prompt}
          </AppText>
        )}
        {item.detail ? <AppText color={colors.inkSoft}>{item.detail}</AppText> : null}
      </View>

      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 2,
          borderColor: colors.line,
          borderRadius: radius.card,
          padding: space(5),
          gap: space(2),
        }}
      >
        <AppText weight="bold">{settledPhrase(progress)}</AppText>
        {card ? <AppText color={colors.inkSoft}>{nextUp(card.dueAt)}</AppText> : null}
      </View>

      {item.category === "person" ? (
        <View style={{ gap: space(4), paddingTop: space(2) }}>
          <AppText size="bodyLarge" weight="bold">
            Where they go on the tree
          </AppText>
          {item.placement === null ? (
            <Hint>
              I couldn't tell from the word you used. Pick the one that fits.
            </Hint>
          ) : (
            <Hint>{bandHeading(item.placement)}</Hint>
          )}

          {PLACEMENT_CHOICES.map((choice) => (
            <ChunkyButton
              key={String(choice.placement)}
              label={choice.label}
              tone={item.placement === choice.placement ? "primary" : "secondary"}
              selected={item.placement === choice.placement}
              onPress={() => void updateItem(item.id, { placement: choice.placement })}
            />
          ))}
        </View>
      ) : null}

      <View style={{ gap: space(4), paddingTop: space(10) }}>
        {confirmingRemoval ? (
          <View style={{ gap: space(6) }}>
            <AppText weight="bold" accessibilityLiveRegion="polite">
              {item.category === "person"
                ? `Remove ${item.answer}? Their photo and details go too.`
                : "Remove this, along with everything you wrote about it?"}
            </AppText>
            <ChunkyButton
              label="Cancel"
              onPress={() => setConfirmingRemoval(false)}
            />
            <View style={{ paddingTop: space(6) }}>
              <ChunkyButton
                label={`Remove ${item.answer}`}
                tone="secondary"
                onPress={async () => {
                  await removeItem(item.id);
                  router.back();
                }}
              />
            </View>
          </View>
        ) : (
          <ChunkyButton
            label={item.category === "person" ? "Remove from tree" : "Remove this"}
            tone="secondary"
            hint="Asks you to confirm first"
            onPress={() => setConfirmingRemoval(true)}
          />
        )}
      </View>
    </Screen>
  );
}
