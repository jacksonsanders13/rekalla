/**
 * Fails the build on the accessibility mistakes that are easy to make and
 * invisible until somebody who needs them turns VoiceOver on.
 *
 * Three rules, all of them things that have gone wrong in real apps:
 *
 *   1. Anything you can tap has to say what it is. An unlabelled Pressable is
 *      read out as "button" and nothing else.
 *   2. An image is either labelled or explicitly hidden. Silently unlabelled
 *      is the worst of the three, because it reads as a filename.
 *   3. No text smaller than the floor. The scale in tokens.ts starts at 20,
 *      so a number below that can only have arrived as an inline literal.
 *
 * It reads source rather than rendering, which means it cannot tell whether a
 * label is a *good* one. That is what the VoiceOver pass in docs/v3-plan.md is
 * for. This catches the absences.
 *
 *   node scripts/check-a11y.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

/** Only the new app. The retired screens are unreachable and are going. */
const INCLUDE = ["app/", "components/practice/", "components/rekalla-avatar.tsx"];
const EXCLUDE = [
  "app/(auth)/", "app/(caregiver)/", "app/(patient)/",
  "app/event/", "app/patient/", "app/connect.tsx",
  "app/profile-section.tsx", "app/scan.tsx", "app/settings.tsx",
];

const TEXT_FLOOR = 20;

function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      yield* walk(full);
    } else if (/\.tsx$/.test(entry)) {
      yield full;
    }
  }
}

function ours(path) {
  const unix = path.split(sep).join("/");
  if (EXCLUDE.some((p) => unix.startsWith(p))) return false;
  return INCLUDE.some((p) => unix.startsWith(p));
}

/** The text of a JSX opening tag starting at `from`, up to its closing >. */
function openingTag(source, from) {
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    const c = source[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return source.slice(from, i + 1);
  }
  return source.slice(from, from + 800);
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

const findings = [];

for (const file of walk(ROOT)) {
  const path = relative(ROOT, file);
  if (!ours(path)) continue;
  const src = readFileSync(file, "utf8");
  const unix = path.split(sep).join("/");

  // 1. tappable things must introduce themselves
  for (const m of src.matchAll(/<(Pressable|TouchableOpacity|TouchableHighlight)\b/g)) {
    const tag = openingTag(src, m.index);
    const labelled =
      /accessibilityLabel\s*=/.test(tag) ||
      /accessibilityRole\s*=\s*["'{]/.test(tag) ||
      /\{\.\.\.rest\}/.test(tag);
    if (!labelled) {
      findings.push({
        unix, line: lineOf(src, m.index),
        what: `<${m[1]}> with no accessibilityLabel — VoiceOver reads it as "button" and nothing more`,
      });
    }
  }

  // 2. images are labelled, or hidden on purpose
  for (const m of src.matchAll(/<Image\b/g)) {
    const tag = openingTag(src, m.index);
    const handled =
      /accessibilityLabel\s*=/.test(tag) ||
      /accessibilityElementsHidden/.test(tag) ||
      /importantForAccessibility\s*=\s*["']no/.test(tag);
    if (!handled) {
      findings.push({
        unix, line: lineOf(src, m.index),
        what: "<Image> is neither labelled nor explicitly hidden",
      });
    }
  }

  // 3. nothing below the floor
  for (const m of src.matchAll(/fontSize:\s*(\d+(?:\.\d+)?)\b/g)) {
    const size = Number(m[1]);
    if (size < TEXT_FLOOR) {
      findings.push({
        unix, line: lineOf(src, m.index),
        what: `fontSize ${size} is below the ${TEXT_FLOOR}pt floor`,
      });
    }
  }
}

if (findings.length === 0) {
  console.log("check-a11y: nothing to report.");
  process.exit(0);
}

console.error(`check-a11y: ${findings.length} thing${findings.length === 1 ? "" : "s"} to fix.\n`);
for (const f of findings) console.error(`  ${f.unix}:${f.line}  ${f.what}`);
console.error("\nEvery control has to say what it is, out loud.");
process.exit(1);
