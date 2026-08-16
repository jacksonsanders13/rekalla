/**
 * v2 accessibility tokens — Part D hard requirements for the older-adult
 * surfaces (assistant, profile). Deliberately SEPARATE from theme.ts so the
 * larger sizes don't ripple through v1 screens; new v2 screens use these.
 *
 * Requirements encoded here:
 *   - body text >= 20pt (theme.font.base is 17, too small for v2)
 *   - tap targets >= 60x60pt
 *   - generous line height and spacing
 * Colors reuse theme.colors (already WCAG-AAA dark palette); we only enlarge.
 */
import { colors } from "./theme";

/** Type scale — every value is a v2 minimum or larger. body >= 20. */
export const a11yFont = {
  body: 20, // hard minimum for body text
  bodyLg: 24,
  title: 30,
  hero: 40, // assistant reply / big numbers
  button: 22,
} as const;

/** Minimum interactive target. Never render an interactive element smaller. */
export const TAP_MIN = 60;

export const a11y = {
  colors,
  font: a11yFont,
  tapMin: TAP_MIN,
  lineHeight: (size: number) => Math.round(size * 1.35),
  space: (n: number) => n * 4,
} as const;
