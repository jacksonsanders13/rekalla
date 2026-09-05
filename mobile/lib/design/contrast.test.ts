import test from "node:test";
import assert from "node:assert/strict";

import { REQUIRED_RATIO, contrastRatio, hexToRgb, relativeLuminance } from "./contrast.ts";
import { CONTRAST_PAIRS, PALETTES, type ThemeName } from "./palettes.ts";

test("the formula agrees with the two ends of the scale", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#FFFFFF")), 21);
  assert.equal(contrastRatio("#FF0000", "#FF0000"), 1);
  assert.equal(relativeLuminance("#000000"), 0);
  assert.equal(relativeLuminance("#FFFFFF"), 1);
});

test("short hex and long hex read the same", () => {
  assert.deepEqual(hexToRgb("#fff"), hexToRgb("#FFFFFF"));
  assert.deepEqual(hexToRgb("1A1523"), { r: 26, g: 21, b: 35 });
  assert.throws(() => hexToRgb("nonsense"));
});

for (const name of Object.keys(PALETTES) as ThemeName[]) {
  test(`every text pair in the ${name} palette clears ${REQUIRED_RATIO}:1`, () => {
    const palette = PALETTES[name];
    const failures: string[] = [];

    for (const pair of CONTRAST_PAIRS) {
      const ratio = contrastRatio(palette[pair.text], palette[pair.on]);
      const rounded = Math.round(ratio * 100) / 100;
      if (rounded < REQUIRED_RATIO) {
        failures.push(
          `${pair.text} on ${pair.on} is ${rounded}:1 — ${pair.where}`,
        );
      }
    }

    assert.deepEqual(failures, [], `\n  ${failures.join("\n  ")}\n`);
  });
}

test("the wash shown after a miss is never a warning red", () => {
  // The rule is about the miss state, not about the palette's hues: the
  // brand's deep raspberry is a legitimate primary, and an earlier version of
  // this test wrongly flagged it. What must never happen is the screen shown
  // after a wrong answer reading as an error.
  for (const name of Object.keys(PALETTES) as ThemeName[]) {
    const palette = PALETTES[name];
    for (const key of ["reveal", "revealEdge", "revealInk"] as const) {
      const { r, g, b } = hexToRgb(palette[key]);
      assert.equal(
        r > 140 && r > g * 2 && r > b * 2,
        false,
        `${name}.${key} (${palette[key]}) reads as a warning red`,
      );
    }
  }
});

test("the bright primary fill carries dark text, not white", () => {
  // The most common way a friendly-looking interface fails the person using
  // it: white on a saturated fill, which measures about 2.5:1.
  for (const name of Object.keys(PALETTES) as ThemeName[]) {
    const palette = PALETTES[name];
    assert.ok(
      contrastRatio(palette.primaryInk, palette.primary) >= REQUIRED_RATIO,
      `${name}: the primary button label does not clear the bar`,
    );
  }
});
