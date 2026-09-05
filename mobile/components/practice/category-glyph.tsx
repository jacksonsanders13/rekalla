/**
 * A small mark for each kind of thing you can add.
 *
 * Drawn here rather than pulled from an icon set: four shapes is not worth a
 * dependency, and it keeps every drawn thing in the app original. If a wider
 * set is ever needed, Lucide (ISC) is the one to reach for — see
 * docs/v3-plan.md.
 *
 * Stroked in the current text colour so a row carries one colour, and sized
 * in points so it grows with the text beside it.
 */
import Svg, { Path } from "react-native-svg";
import type { ItemCategory } from "../../lib/practice/types";

const PATHS: Record<ItemCategory, string[]> = {
  // Two heads, one behind the other.
  person: [
    "M9 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4",
    "M3.5 20c0-3.2 2.5-5.4 5.5-5.4s5.5 2.2 5.5 5.4",
    "M16.5 10.5a2.6 2.6 0 1 0 0-5.2",
    "M17 14.8c2.2.4 3.8 2.4 3.8 5.2",
  ],
  // A clock: the day, and when in it.
  routine: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "M12 7.5V12l3 2"],
  // A pin: where a thing lives.
  place: [
    "M12 21s6.5-5.6 6.5-10a6.5 6.5 0 1 0-13 0c0 4.4 6.5 10 6.5 10",
    "M12 13.2a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6",
  ],
  // A page with a corner turned.
  fact: ["M6 3.5h9L19 8v12.5H6z", "M14.5 3.5V8H19", "M9 12.5h7", "M9 16.5h5"],
};

export function CategoryGlyph({
  category,
  size = 34,
  color,
}: {
  category: ItemCategory;
  size?: number;
  color: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {PATHS[category].map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
