/**
 * Design tokens, Apple's dark system palette.
 * (elev = surface elevations, label = text hierarchy, the rest are accents)
 */
export const colors = {
  base: "#000000",
  elev1: "#1c1c1e", // cards
  elev2: "#2c2c2e", // nested / pressed surfaces
  elev3: "#3a3a3c", // filled-control borders
  label: "#ffffff",
  label2: "#d1d1d6",
  label3: "#8e8e93",
  // Placeholders, disabled text and inactive chevrons. The old #636366 failed
  // AA on every surface (3.37 on base down to 2.14 on elev3) while being used
  // 16 times, most of it placeholderTextColor. This clears 4.5:1 everywhere.
  label4: "#9b97a6",
  // Filled controls. Separate tokens because several components used to
  // hardcode #000000 as the text on a filled surface, which breaks the moment
  // that surface stops being white.
  fill: "#ffffff",
  onFill: "#000000",
  green: "#30d158",
  blue: "#0a84ff",
  teal: "#64d2ff",
  orange: "#ff9f0a",
  pink: "#ff375f",
  purple: "#bf5af2",
  yellow: "#ffd60a",
  red: "#ff453a",
} as const;

export type Palette = typeof colors;

export const radius = {
  md: 14,
  lg: 20,
  xl: 26,
  /**
   * Circles and pills. Use this instead of writing half the element's width,
   * which is what the magic 4 / 22 / 24 values in this codebase were doing:
   * they looked like scale violations but were just `size / 2`, and they break
   * silently the moment the element is resized.
   */
  full: 999,
} as const;

/** Type scale sized for older adults (matches the web app). */
export const font = {
  xs: 13,
  sm: 15,
  base: 17,
  lg: 19,
  xl: 22,
  x2: 26,
  x3: 34,
} as const;

export const spacing = (n: number) => n * 4;

/**
 * The weight ladder.
 *
 * The app previously declared only "600" (25 times) and "700" (43 times), so
 * two-thirds of all emphasis was the heaviest weight available and emphasis
 * stopped carrying meaning. Reserve bold for the one thing that leads a
 * screen; use medium for labels and structure; let body text stay regular.
 */
export const weight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

