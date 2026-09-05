/**
 * The family tree.
 *
 * Everyone the person has added, laid out by generation with a trunk running
 * down the middle, oldest at the top. It is the answer to "who is in here",
 * and it is the reason the app asks who somebody is to you rather than just
 * taking a name.
 *
 * It is a pedigree chart rather than a full genealogy: we know how each person
 * relates to the one using the app, and nothing about how they relate to each
 * other, so the honest drawing is a trunk with people at their own height
 * along it. Inventing parent lines we were never told about would be a chart
 * that lies.
 *
 * The ring around each face is how far apart their practices have grown, so
 * this doubles as the picture of how everyone is coming along.
 */
import { useMemo } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/practice/screen";
import { ChunkyButton } from "../components/practice/chunky-button";
import { AddNode, PersonNode } from "../components/practice/person-node";
import { RekallaSays } from "../components/practice/rekalla-says";
import { AppText } from "../components/practice/text";
import { usePractice } from "../lib/practice/context";
import { ladderProgress } from "../lib/practice/scheduler";
import { BANDS } from "../lib/practice/relations";
import { space } from "../lib/design/tokens";
import type { MemoryItem } from "../lib/practice/types";
import { useTheme } from "../lib/design/theme";

export default function Tree() {
  const colors = useTheme();
  const { ready, items, data, user } = usePractice();

  const people = useMemo(
    () => items.filter((item) => item.category === "person" && item.isActive),
    [items],
  );

  const progressFor = useMemo(() => {
    const byItem = new Map(data.cards.map((card) => [card.memoryItemId, card]));
    return (item: MemoryItem) => {
      const card = byItem.get(item.id);
      return card ? ladderProgress(card) : 0;
    };
  }, [data.cards]);

  const bands = useMemo(() => {
    const placed = BANDS.map((band) => ({
      ...band,
      people: people.filter((person) => person.placement === band.placement),
    }));
    // Generation zero always shows, because the person using the app is on it.
    return placed.filter((band) => band.people.length > 0 || band.placement === 0);
  }, [people]);

  const unplaced = useMemo(
    () => people.filter((person) => person.placement === null),
    [people],
  );

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.paper }} />;

  const helping = user?.setupMode === "helper";

  return (
    <Screen
      title="Your family tree"
      onBack={() => router.back()}
      footer={
        <ChunkyButton
          label="Add someone to the tree"
          onPress={() => router.push("/add?category=person")}
        />
      }
    >
      {people.length === 0 ? (
        <RekallaSays>
          {helping
            ? "Nobody here yet. Add the people who matter most, and they will fill in around them on the tree."
            : "Nobody here yet. Add the people who matter most to you, and they will fill in around you on the tree."}
        </RekallaSays>
      ) : null}

      <View style={{ position: "relative", paddingVertical: space(2) }}>
        {/* The trunk, behind everything, from the top band to the bottom one. */}
        <View
          style={{
            position: "absolute",
            left: "50%",
            marginLeft: -2,
            top: space(6),
            bottom: space(6),
            width: 4,
            backgroundColor: colors.line,
            borderRadius: 2,
          }}
        />

        {bands.map((band) => (
          <View
            key={String(band.placement)}
            style={{ alignItems: "center", paddingVertical: space(4) }}
          >
            {/* Paper behind the heading breaks the trunk, the way a chart does. */}
            <View
              style={{
                backgroundColor: colors.paper,
                paddingHorizontal: space(3),
                paddingVertical: space(1),
              }}
            >
              <AppText size="body" weight="bold" color={colors.inkSoft} center>
                {band.heading}
              </AppText>
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: space(4),
                paddingTop: space(4),
              }}
            >
              {band.placement === 0 ? (
                <PersonNode
                  name={helping ? "Them" : "You"}
                  sublabel={helping ? "the person practising" : null}
                  tone="you"
                />
              ) : null}

              {band.people.map((person) => (
                <PersonNode
                  key={person.id}
                  name={person.answer}
                  sublabel={person.relationship}
                  photoKey={person.photoKey}
                  progress={progressFor(person)}
                  onPress={() => router.push(`/person/${person.id}`)}
                />
              ))}

              {band.placement === 0 && people.length === 0 ? (
                <AddNode
                  label="Add someone"
                  onPress={() => router.push("/add?category=person")}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {unplaced.length > 0 ? (
        <View style={{ gap: space(4), paddingTop: space(4) }}>
          <AppText size="bodyLarge" weight="bold">
            {unplaced.length === 1
              ? "One person to place"
              : `${unplaced.length} people to place`}
          </AppText>
          <AppText color={colors.inkSoft}>
            I could not tell where these sit on the tree. Tap one to say, and it
            will move up with the others.
          </AppText>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: space(4),
            }}
          >
            {unplaced.map((person) => (
              <PersonNode
                key={person.id}
                name={person.answer}
                sublabel={person.relationship}
                photoKey={person.photoKey}
                progress={progressFor(person)}
                onPress={() => router.push(`/person/${person.id}`)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
