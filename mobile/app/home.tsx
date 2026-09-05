/**
 * Home: a path of everyone you are keeping close, and one button.
 *
 * The winding column of large faces is the borrowed idea, and it earns its
 * place here for a reason it does not have elsewhere: the thing being
 * practised is a person, so a picture of them is a better label than any word
 * would be. The next one up is at the top, larger, with START on it.
 *
 * What is not borrowed: no tab bar, no hearts, no timer, nothing that runs
 * out, and no number anywhere that could be read as a mark.
 */
import { useMemo } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/practice/screen";
import { ChunkyButton } from "../components/practice/chunky-button";
import { PracticePath, type PathEntry } from "../components/practice/practice-path";
import { RekallaSays } from "../components/practice/rekalla-says";
import { AppText } from "../components/practice/text";
import { usePractice } from "../lib/practice/context";
import { colors, radius, space } from "../lib/design/tokens";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderWidth: 2,
        borderColor: colors.line,
        borderRadius: radius.card,
        paddingVertical: space(3),
        paddingHorizontal: space(3),
        alignItems: "center",
        gap: space(1),
      }}
    >
      <AppText size="bodyLarge" weight="bold">
        {value}
      </AppText>
      <AppText size="body" color={colors.inkSoft} center>
        {label}
      </AppText>
    </View>
  );
}

export default function Home() {
  const { ready, items, data, dueCount, daysPractised, currentRun, user } = usePractice();

  const entries = useMemo<PathEntry[]>(() => {
    const byId = new Map(items.map((item) => [item.id, item]));
    return data.cards
      .map((card) => ({ card, item: byId.get(card.memoryItemId) }))
      .filter(
        (entry): entry is PathEntry => entry.item !== undefined && entry.item.isActive,
      )
      .sort((a, b) => new Date(a.card.dueAt).getTime() - new Date(b.card.dueAt).getTime());
  }, [items, data.cards]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.paper }} />;

  const hasItems = entries.length > 0;
  const somethingDue = dueCount > 0;

  return (
    <Screen
      contentStyle={{ paddingTop: space(3) }}
      footer={
        hasItems ? (
          <ChunkyButton
            label={somethingDue ? "Practise" : "Practise anyway"}
            tone={somethingDue ? "primary" : "secondary"}
            hint={
              somethingDue
                ? `${dueCount} ready. Starts a practice session`
                : "Nothing is due, but you can have a short practice"
            }
            onPress={() => router.push("/practice")}
          />
        ) : (
          <ChunkyButton
            label="Add someone to remember"
            onPress={() => router.push("/add")}
          />
        )
      }
    >
      {daysPractised > 0 ? (
        <View style={{ flexDirection: "row", gap: space(3) }}>
          <Stat
            value={String(daysPractised)}
            label={daysPractised === 1 ? "day practised" : "days practised"}
          />
          <Stat
            value={String(currentRun)}
            label={currentRun === 1 ? "day on the trot" : "days on the trot"}
          />
        </View>
      ) : null}

      <AppText size="bodyLarge" weight="bold" center>
        {somethingDue
          ? dueCount === 1
            ? "One is ready for you"
            : `${dueCount} are ready for you`
          : hasItems
            ? "You are up to date"
            : "Nobody here yet"}
      </AppText>

      {hasItems ? (
        <PracticePath
          entries={entries}
          onStart={() => router.push("/practice")}
          onOpen={(itemId) => router.push(`/person/${itemId}`)}
        />
      ) : (
        <RekallaSays>
          {user?.setupMode === "helper"
            ? "Add the people who matter most, and I will start asking about them."
            : "Add the people who matter most to you, and I will start asking about them."}
        </RekallaSays>
      )}

      <View style={{ gap: space(4), paddingTop: space(4) }}>
        <ChunkyButton
          label="Your family tree"
          tone="secondary"
          hint="Everyone you have added, by generation"
          onPress={() => router.push("/tree")}
        />
        <ChunkyButton
          label="Add something to remember"
          tone="secondary"
          onPress={() => router.push("/add")}
        />
        <ChunkyButton
          label="Settings"
          tone="secondary"
          onPress={() => router.push("/preferences")}
        />
      </View>
    </Screen>
  );
}
