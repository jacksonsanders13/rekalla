/**
 * The look of the practice app: bright, flat, chunky, generous.
 *
 * This is a deliberate break from the dark iOS palette the earlier app used.
 * Practice should feel like something an adult chose to do, not like an
 * assistive tool, so the surfaces are warm paper rather than black glass.
 *
 * Every text-on-background pair below is at or above 7:1, which is the
 * standard the whole app is held to. Two consequences worth knowing before
 * changing a value:
 *
 *   - The primary fill is deep on purpose. A brighter pink cannot carry white
 *     text at 7:1, so a lighter fill has to take dark text instead.
 *   - Nothing here is red. A wrong answer is shown in the warm sand wash, and
 *     red is not in the palette at all so it cannot creep back in.
 */

/**
 * Colour deliberately does not live here any more. It is a hook —
 * `useTheme()` from ./theme — because the app has two palettes and the person
 * using it chooses. A static export here would be a way for a screen to
 * silently pin itself to one theme, so there is not one.
 *
 * The palettes themselves are in ./palettes, and contrast.test.ts holds both
 * of them to 7:1.
 */

/**
 * Type scale. 20 is the floor for anything a person reads, and a primary
 * action is never smaller than 24. These are base sizes: iOS scales them
 * again for Dynamic Type, and the text-size setting scales them once more on
 * top of that, so every layout has to survive several times these numbers.
 */
export const type = {
  body: 20,
  bodyLarge: 24,
  button: 24,
  title: 30,
  hero: 40,
} as const;

/** Line heights that stay readable when the text grows. */
export function lineHeightFor(size: number): number {
  return Math.round(size * 1.35);
}

/**
 * The smallest anything tappable may be, in points, before Dynamic Type
 * enlarges it. Nothing interactive in this app is allowed to be smaller.
 */
export const TAP_MIN = 60;

/** The bottom edge that gives a button its weight, and compresses on press. */
export const BUTTON_EDGE = 4;

export const radius = {
  button: 16,
  card: 20,
  photo: 24,
} as const;

/** 4pt grid. space(4) is 16. */
export function space(steps: number): number {
  return steps * 4;
}

export const fonts = {
  /** Body weight. Quicksand's lighter faces are too fine at this size. */
  semibold: "Quicksand_600SemiBold",
  bold: "Quicksand_700Bold",
} as const;
