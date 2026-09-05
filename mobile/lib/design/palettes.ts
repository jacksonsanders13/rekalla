/**
 * The palettes, and the pairs that have to hold up.
 *
 * Both themes use the same key names so that switching between them is one
 * assignment rather than a rename across every screen. `paper` is the app's
 * ground, `card` a raised surface, and the three washes are the states an
 * answer can be in.
 *
 * Dark is where the app is going (see docs/v3-plan.md, M1); light is what it
 * ships with today. Both are checked by contrast.test.ts, so a value cannot be
 * changed to something unreadable without the build saying so.
 *
 * Two rules hold in both:
 *
 *   - The bright fill carries DARK text, never white. White on a saturated
 *     green or pink lands near 2.5:1 — it reads fine in a mockup and vanishes
 *     for the person holding the phone.
 *   - There is no red. A wrong answer is shown in the warm wash, and red is
 *     absent from the palette so it cannot creep back in later.
 */

export interface Palette {
  /** The app's ground. */
  paper: string;
  /** A raised surface: unselected options, panels. */
  card: string;
  /** The 4pt edge under a raised button. */
  cardEdge: string;
  /** Dividers and outlines. Never carries meaning on its own. */
  line: string;

  ink: string;
  inkSoft: string;

  primary: string;
  primaryEdge: string;
  primaryInk: string;

  /** Correct. */
  success: string;
  successEdge: string;
  successInk: string;

  /** The answer, shown after a miss. Warm, never red. */
  reveal: string;
  revealEdge: string;
  revealInk: string;

  focus: string;
}

export const light: Palette = {
  paper: "#FFFDF9",
  card: "#FFFFFF",
  cardEdge: "#E0D8CB",
  line: "#D8CFC2",

  ink: "#1A1523",
  inkSoft: "#4B4355",

  primary: "#A3134B",
  primaryEdge: "#71062F",
  primaryInk: "#FFFFFF",

  success: "#E4F6E9",
  successEdge: "#B6DFC4",
  successInk: "#0C4A28",

  reveal: "#FFF3D6",
  revealEdge: "#EBD9A8",
  revealInk: "#4A3707",

  focus: "#1B4DB1",
};

export const dark: Palette = {
  paper: "#12181C",
  card: "#1B2429",
  cardEdge: "#35434B",
  line: "#35434B",

  ink: "#F2F7F9",
  inkSoft: "#A9BAC3",

  primary: "#7DD53F",
  primaryEdge: "#57A324",
  primaryInk: "#0E1417",

  success: "#16311E",
  successEdge: "#2E6B3C",
  successInk: "#B7EFA0",

  reveal: "#33280E",
  revealEdge: "#6E5A22",
  revealInk: "#FFD98A",

  focus: "#4CBEFF",
};

export const PALETTES = { light, dark } as const;

export type ThemeName = keyof typeof PALETTES;

/**
 * Every pair of colours that ends up as text on a surface somewhere in the
 * app. If a screen puts a colour on a background that is not listed here, add
 * it — an unlisted pair is an unchecked pair.
 */
export const CONTRAST_PAIRS: {
  text: keyof Palette;
  on: keyof Palette;
  where: string;
}[] = [
  { text: "ink", on: "paper", where: "body text and headings on the app ground" },
  { text: "inkSoft", on: "paper", where: "supporting text on the app ground" },
  { text: "ink", on: "card", where: "option labels and panel text" },
  { text: "inkSoft", on: "card", where: "quiet text inside a panel" },
  { text: "primaryInk", on: "primary", where: "the label on a primary button" },
  { text: "successInk", on: "success", where: "the wash after a correct answer" },
  { text: "revealInk", on: "reveal", where: "the wash showing the answer after a miss" },
  { text: "focus", on: "paper", where: "the Back control and links" },
  { text: "focus", on: "card", where: "the Show and Hide control on a field" },
];
