/**
 * Fails the build if a claim we are not allowed to make, or a word we have
 * decided not to use, appears anywhere in the app's source.
 *
 * This is not stylistic tidiness. The FTC fined Lumosity two million dollars
 * for telling people that its exercises would hold off memory problems, and
 * the evidence for what this app does supports nothing of the kind: practice
 * at recalling a particular fact helps with recalling that fact. Every claim
 * has to stay that specific.
 *
 * It runs over source rather than over a strings file on purpose. Copy lives
 * next to the screen it belongs to, and a rule that only covered one file
 * would be a rule that stopped applying the moment somebody typed a sentence
 * somewhere else. Comments are included: a claim written in a comment is a
 * claim somebody will later paste onto a screen.
 *
 * Screens from the earlier app are skipped while they are still in the tree.
 * They are unreachable and they are going.
 *
 *   node scripts/check-copy.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

/** Where the new app lives. */
const ROOTS = ["app", "components", "lib", "scripts"];

/**
 * Retired code, still in the tree until this app is on TestFlight. Prefixes,
 * matched against the path from mobile/.
 */
const LEGACY = [
  "app/(auth)/",
  "app/(caregiver)/",
  "app/(patient)/",
  "app/event/",
  "app/patient/",
  "app/connect.tsx",
  "app/profile-section.tsx",
  "app/scan.tsx",
  "app/settings.tsx",
  "hooks/",
];

/** Under these, only the new folders are ours. */
const PARTIAL = [
  { dir: "lib", keep: ["lib/practice/", "lib/design/"] },
  { dir: "components", keep: ["components/practice/", "components/rekalla-avatar.tsx"] },
];

/**
 * Words that carry a clinical framing we have no business using, or that
 * describe the person as a case rather than as someone practising.
 */
const WORDS = [
  "dementia",
  "alzheimer",
  "alzheimers",
  "decline",
  "declines",
  "declining",
  "deterioration",
  "deteriorate",
  "disease",
  "patient",
  "patients",
  "therapy",
  "therapeutic",
  "treatment",
  "treat",
  "diagnosis",
  "diagnose",
  "cognitive",
  "cognition",
  "symptom",
  "symptoms",
];

/** Whole claims, which can be made without using any single banned word. */
const PHRASES = [
  /brain\s*train(ing|er)?/i,
  /train\s+(your|his|her|their)\s+brain/i,
  /memory\s+loss/i,
  /(improve|improves|improving|boost|boosts|sharpen|sharpens)\s+(your\s+|his\s+|her\s+|their\s+)?(memory|mind|brain|recall)\b/i,
  /(prevent|prevents|delay|delays|slow|slows|halt|halts|protect against)\s+\w*\s*(memory|forgetting|loss)/i,
  /keeps?\s+(your|his|her|their)\s+(mind|brain)\s+(sharp|young|active)/i,
  /clinically\s+proven/i,
  /scientifically\s+proven/i,
];

function isOurs(path) {
  const unix = path.split(sep).join("/");
  if (LEGACY.some((prefix) => unix.startsWith(prefix))) return false;
  for (const { dir, keep } of PARTIAL) {
    if (unix.startsWith(`${dir}/`) && !keep.some((prefix) => unix.startsWith(prefix))) {
      return false;
    }
  }
  return true;
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      yield* walk(full);
    } else if (/\.(ts|tsx|js|jsx|mjs|json)$/.test(entry)) {
      yield full;
    }
  }
}

const wordPattern = new RegExp(`\\b(${WORDS.join("|")})\\b`, "i");
const findings = [];

for (const top of ROOTS) {
  for (const file of walk(join(ROOT, top))) {
    const path = relative(ROOT, file);
    if (!isOurs(path)) continue;
    // The guards are exempt from each other. This one lists the terms it
    // looks for, and check-a11y names the retired route folders it skips —
    // one of which is a directory called "(patient)". Naming a path is not
    // making a claim.
    if (/^scripts\/check-[a-z0-9-]+\.mjs$/.test(path.split(sep).join("/"))) continue;

    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      const word = line.match(wordPattern);
      if (word) {
        findings.push({ path, line: index + 1, found: word[1], text: line.trim() });
      }
      for (const phrase of PHRASES) {
        const hit = line.match(phrase);
        if (hit) {
          findings.push({ path, line: index + 1, found: hit[0], text: line.trim() });
        }
      }
    });
  }
}

if (findings.length === 0) {
  console.log("check-copy: nothing to report.");
  process.exit(0);
}

console.error(
  `check-copy: ${findings.length} thing${findings.length === 1 ? "" : "s"} we cannot say.\n`,
);
for (const finding of findings) {
  const unix = finding.path.split(sep).join("/");
  console.error(`  ${unix}:${finding.line}  "${finding.found}"`);
  console.error(`    ${finding.text.slice(0, 120)}`);
}
console.error(
  "\nEvery claim has to be about the particular thing someone is practising.",
);
process.exit(1);
