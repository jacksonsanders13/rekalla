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

export const colors = {
  /** App background: warm off-white. */
  paper: "#FFFDF9",
  /** Raised surfaces and unselected options. */
  card: "#FFFFFF",
  /** The 4pt bottom edge under a white button. */
  cardEdge: "#E0D8CB",
  /** Quiet dividers and outlines. Never used to carry meaning on its own. */
  line: "#D8CFC2",

  /** Body and heading text: 17.8:1 on paper. */
  ink: "#1A1523",
  /** Supporting text: 9.4:1 on paper. Still well past the bar. */
  inkSoft: "#4B4355",

  /** Primary action: 7.6:1 with white text. */
  primary: "#A3134B",
  primaryEdge: "#71062F",
  primaryInk: "#FFFFFF",

  /** Correct: a wash with dark text on it, 9.2:1. */
  success: "#E4F6E9",
  successEdge: "#B6DFC4",
  successInk: "#0C4A28",

  /** Showing the answer after a miss: warm sand, 10.3:1. Never red. */
  reveal: "#FFF3D6",
  revealEdge: "#EBD9A8",
  revealInk: "#4A3707",

  /** Focus and selection outline: 7.7:1 with white. */
  focus: "#1B4DB1",
} as const;

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
