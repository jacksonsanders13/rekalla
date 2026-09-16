/**
 * Draws every app icon from Rekalla himself.
 *
 * The geometry below is copied verbatim from components/ui/rekalla-avatar.tsx,
 * so the icon on the home screen is literally the same drawing as the mascot
 * inside the app. If you change his shape there, run this again:
 *
 *   node scripts/make-icons.mjs
 *
 * The old mark was an outlined "R" with an anatomical brain fused to it, in
 * white on black. It looked nothing like the app it opened, and thin outline
 * strokes turn to grey mush at 60pt on a home screen.
 *
 * He is stemless everywhere, which is the point: one character, one drawing,
 * no second version of him to keep in step.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---- geometry, in step with components/ui/rekalla-avatar.tsx ----------------
const BODY = "#f7a8c8"; // brain pink
const FOLD = "#d4779f"; // the sulci, a deeper pink
const INK = "#43202f"; // his eyes and his smile
const BASE = "#000000"; // the app's own background

const OUTLINE =
  "M50 10C62 6 74 10 76 20C88 18 94 28 88 38C96 44 96 56 86 60C92 70 84 80 73 76C70 86 60 90 50 86C40 90 30 86 27 76C16 80 8 70 14 60C4 56 4 44 12 38C6 28 12 18 24 20C26 10 38 6 50 10Z";

const LEFT_FOLDS = [
  "M32 26C26 30 28 36 22 40",
  "M14 52C22 50 24 56 20 62",
  "M30 74C34 70 30 66 34 62",
];

const MIRROR = "translate(100, 0) scale(-1, 1)";

/** The bounds his outline actually occupies inside the 100x100 avatar box. */
const BOX = { x: 4, y: 6, w: 92, h: 84 };

/**
 * Centre him on a square canvas, `fraction` of it wide. Different targets want
 * different margins: Android crops its foreground layer to a circle, so that
 * one has to sit well inside.
 */
function place(size, fraction) {
  // Fit the longer side, so he can never run off an edge.
  const scale = (size * fraction) / Math.max(BOX.w, BOX.h);
  const cx = BOX.x + BOX.w / 2;
  const cy = BOX.y + BOX.h / 2;
  return `translate(${size / 2} ${size / 2}) scale(${scale}) translate(${-cx} ${-cy})`;
}

const folds = () => LEFT_FOLDS.map((d) => `<path d="${d}"/>`).join("");

/** Him, exactly as the avatar component draws him. */
function rekalla(transform) {
  return `<g transform="${transform}">
    <path d="${OUTLINE}" fill="${BODY}"/>
    <g stroke="${FOLD}" stroke-width="3" stroke-linecap="round" fill="none">${folds()}</g>
    <g stroke="${FOLD}" stroke-width="3" stroke-linecap="round" fill="none" transform="${MIRROR}">${folds()}</g>
    <path d="M50 14V36" stroke="${FOLD}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="40" cy="52" r="4.5" fill="${INK}"/>
    <circle cx="60" cy="52" r="4.5" fill="${INK}"/>
    <path d="M42 64C45 68 55 68 58 64" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  </g>`;
}

function svg({ size, fraction, ground }) {
  const bg =
    ground === "square"
      ? `<rect width="${size}" height="${size}" fill="${BASE}"/>`
      : ground === "rounded"
        ? `<rect width="${size}" height="${size}" rx="${size * 0.219}" fill="${BASE}"/>`
        : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
${bg}
${rekalla(place(size, fraction))}
</svg>
`;
}

// ---- the files -------------------------------------------------------------
const SVGS = [
  // Header mark. The Logo component supplies the dark ground and the rounding,
  // so this one is just him.
  { out: "public/logo.svg", size: 512, fraction: 0.72, ground: "none" },
  // Browser tab. Rounds itself, since nothing else will.
  { out: "app/icon.svg", size: 512, fraction: 0.72, ground: "rounded" },
];

const PNGS = [
  // iOS home screen, and the source Expo resizes from. Square and opaque: iOS
  // applies its own mask, and the App Store rejects an icon with alpha.
  // Android's adaptive foreground is this same file, per mobile/app.json, so
  // the margin here has to survive that circular crop as well.
  { out: "mobile/assets/icon.png", size: 1024, fraction: 0.72, ground: "square", flatten: true },
  // Splash: shown "contain" on black, so no ground of its own.
  { out: "mobile/assets/splash-icon.png", size: 1024, fraction: 0.62, ground: "none" },
  // Tiny. He needs every pixel he can get here.
  { out: "mobile/assets/favicon.png", size: 96, fraction: 0.8, ground: "square", flatten: true },
];

for (const spec of SVGS) {
  writeFileSync(join(ROOT, spec.out), svg(spec), "utf8");
  console.log(`wrote ${spec.out}`);
}

for (const spec of PNGS) {
  let img = sharp(Buffer.from(svg(spec))).resize(spec.size, spec.size);
  if (spec.flatten) img = img.flatten({ background: BASE });
  await img.png({ compressionLevel: 9 }).toFile(join(ROOT, spec.out));
  console.log(`wrote ${spec.out}  ${spec.size}x${spec.size}`);
}
