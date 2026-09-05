/**
 * The path down Home.
 *
 * Everything on the shelf, in the order it comes round, winding down the
 * screen with the next one at the top. The ring on each face fills as the
 * gaps between practices grow, so progress is something you can see at a
 * glance without a number anywhere near it.
 *
 * The nodes are large and far apart on purpose. The shape is borrowed; the
 * density is not. A column of small nodes packed tight is the one part of
 * that design this app cannot have.
 */
import { View } from "react-native";
import { PersonNode } from "./person-node";
import { AppText } from "./text";
import { colors, radius, space } from "../../lib/design/tokens";
import { ladderProgress } from "../../lib/practice/scheduler";
import type { MemoryItem, ScheduledCard } from "../../lib/practice/types";

/** How far each node sits off the centre line, in points. */
function offsetFor(index: number): number {
  return Math.round(Math.sin(index * 0.95) * 56);
}

export interface PathEntry {
  item: MemoryItem;
  card: ScheduledCard;
}

export function PracticePath({
  entries,
  onStart,
  onOpen,
}: {
  entries: PathEntry[];
  /** The first node is the one that starts a session. */
  onStart: () => void;
  onOpen: (itemId: string) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <View style={{ gap: space(8), paddingVertical: space(4) }}>
      {entries.map((entry, index) => {
        const first = index === 0;
        return (
          <View
            key={entry.item.id}
            style={{
              alignItems: "center",
              transform: [{ translateX: offsetFor(index) }],
              gap: space(2),
            }}
          >
            {first ? (
              <View
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: radius.button,
                  paddingHorizontal: space(4),
                  paddingVertical: space(2),
                }}
              >
                <AppText size="body" weight="bold" color={colors.primaryInk}>
                  START
                </AppText>
              </View>
            ) : null}

            <PersonNode
              name={entry.item.answer}
              sublabel={entry.item.relationship ?? null}
              photoKey={entry.item.photoKey}
              progress={ladderProgress(entry.card)}
              tone={first ? "next" : "person"}
              size={first ? 128 : 96}
              onPress={first ? onStart : () => onOpen(entry.item.id)}
            />
          </View>
        );
      })}
    </View>
  );
}
