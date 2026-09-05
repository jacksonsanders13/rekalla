/**
 * Contrast, by the WCAG formula.
 *
 * Pure arithmetic, no dependency, so the palettes can be checked by a test
 * rather than by somebody remembering to check them. The whole point is that
 * the accessibility floor stops being a promise and becomes something the
 * build fails on, the same way the copy guard works.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  const text = hex.replace("#", "").trim();
  const full =
    text.length === 3
      ? text
          .split("")
          .map((c) => c + c)
          .join("")
      : text;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`not a colour this can read: ${hex}`);
  }

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** One channel, 0-255, linearised. */
function channel(value: number): number {
  const proportion = value / 255;
  return proportion <= 0.03928
    ? proportion / 12.92
    : Math.pow((proportion + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The ratio between two colours, from 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const one = relativeLuminance(a);
  const two = relativeLuminance(b);
  const lighter = Math.max(one, two);
  const darker = Math.min(one, two);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The bar this app is held to, for every piece of text on every surface.
 * WCAG calls 7:1 "AAA" and treats it as optional. Here it is the minimum,
 * because the people using this are the people it was written for.
 */
export const REQUIRED_RATIO = 7;

export function meetsRequirement(text: string, background: string): boolean {
  // Rounded to two places first: a pair measuring 6.999 is not a real failure,
  // it is the last digit of a hex code.
  return Math.round(contrastRatio(text, background) * 100) / 100 >= REQUIRED_RATIO;
}
