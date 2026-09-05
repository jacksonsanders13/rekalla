/**
 * Turning a stored item into something to answer.
 *
 * Everything here is template driven and deterministic. It runs offline, it
 * costs nothing, it behaves the same way twice, and it cannot invent a fact
 * about somebody's granddaughter, which matters more here than variety does.
 * The content is supplied by the family in the first place, so there is
 * nothing to generate, only to arrange.
 *
 * `CardGenerator` is the seam. A different implementation can be dropped in
 * later without the session engine or any screen knowing about it.
 */
import type { ItemCategory, MemoryItem } from "./types.ts";

export type QuestionKind =
  | "photoToName"
  | "nameToRelationship"
  | "promptToAnswer";

export interface PracticeQuestion {
  id: string;
  itemId: string;
  cardId: string;
  kind: QuestionKind;
  /** Read aloud by VoiceOver exactly as written. */
  prompt: string;
  photoKey: string | null;
  /** Three of them, one of which is `answer`. */
  options: string[];
  answer: string;
  /** Shown only after a correct answer. */
  detail: string | null;
  /**
   * A second showing of something already answered wrongly in this session.
   * It never moves the schedule; it exists so nobody is left sitting in a
   * wrong answer.
   */
  isRemediation: boolean;
}

export interface GenerateOptions {
  /** Every other active item, for drawing plausible wrong options from. */
  pool: MemoryItem[];
  /** How many questions to make for this item. */
  count: number;
  /** Injected so a session can be reproduced exactly in a test. */
  random: () => number;
}

export interface CardGenerator {
  generate(
    item: MemoryItem,
    cardId: string,
    options: GenerateOptions,
  ): PracticeQuestion[];
}

export const OPTIONS_PER_QUESTION = 3;

/**
 * Names used only when the person has not added enough others to draw real
 * wrong options from, which is mostly the very first session. Common enough
 * to be plausible without resembling anyone in particular.
 */
const FALLBACK_NAMES = [
  "Anna", "Michael", "Ruth", "David", "Grace", "Peter", "Sarah", "Tom",
  "Helen", "James", "Clara", "Robert", "Alice", "Henry", "Rose", "Frank",
];

const FALLBACK_RELATIONSHIPS = [
  "granddaughter", "grandson", "daughter", "son", "sister", "brother",
  "niece", "nephew", "neighbor", "friend",
];

const FALLBACK_ANSWERS: Record<ItemCategory, string[]> = {
  person: FALLBACK_NAMES,
  routine: ["Have a cup of tea", "Go for a walk", "Water the plants", "Read the paper"],
  place: ["In the kitchen drawer", "On the hall table", "In the bedside drawer", "By the front door"],
  fact: ["I am not sure", "Next week", "In the morning", "After lunch"],
};

/** A small deterministic generator, so a seed reproduces a whole session. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = out[i];
    const b = out[j];
    out[i] = b;
    out[j] = a;
  }
  return out;
}

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Builds the option list: the right answer plus wrong ones taken first from
 * the person's own items, which makes the choice a real one, and topped up
 * from the fallback bank when there are not enough.
 */
function buildOptions(
  answer: string,
  candidates: string[],
  fallback: string[],
  random: () => number,
): string[] {
  const chosen: string[] = [];
  const take = (source: string[]) => {
    for (const candidate of shuffle(source, random)) {
      if (chosen.length >= OPTIONS_PER_QUESTION - 1) return;
      const text = candidate.trim();
      if (!text) continue;
      if (sameText(text, answer)) continue;
      if (chosen.some((existing) => sameText(existing, text))) continue;
      chosen.push(text);
    }
  };

  take(candidates);
  take(fallback);

  return shuffle([answer, ...chosen], random);
}

function relationshipLabel(relationship: string): string {
  const text = relationship.trim();
  return `Your ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

/** The only generator in v1. */
export class TemplateCardGenerator implements CardGenerator {
  generate(
    item: MemoryItem,
    cardId: string,
    options: GenerateOptions,
  ): PracticeQuestion[] {
    const { pool, count, random } = options;
    const others = pool.filter((candidate) => candidate.id !== item.id && candidate.isActive);

    const templates: PracticeQuestion[] = [];
    const base = {
      itemId: item.id,
      cardId,
      detail: item.detail,
      isRemediation: false,
    };

    if (item.category === "person") {
      const nameCandidates = others
        .filter((candidate) => candidate.category === "person")
        .map((candidate) => candidate.answer);

      if (item.photoKey) {
        templates.push({
          ...base,
          id: `${item.id}:photoToName`,
          kind: "photoToName",
          prompt: "Who is this?",
          photoKey: item.photoKey,
          answer: item.answer,
          options: buildOptions(item.answer, nameCandidates, FALLBACK_NAMES, random),
        });
      }

      if (item.relationship) {
        const answer = relationshipLabel(item.relationship);
        const relationshipCandidates = others
          .filter((candidate) => candidate.relationship)
          .map((candidate) => relationshipLabel(candidate.relationship as string));

        templates.push({
          ...base,
          id: `${item.id}:nameToRelationship`,
          kind: "nameToRelationship",
          prompt: `Who is ${item.answer} to you?`,
          photoKey: item.photoKey,
          answer,
          options: buildOptions(
            answer,
            relationshipCandidates,
            FALLBACK_RELATIONSHIPS.map(relationshipLabel),
            random,
          ),
        });
      }
    }

    if (templates.length === 0) {
      const candidates = others
        .filter((candidate) => candidate.category === item.category)
        .map((candidate) => candidate.answer);

      templates.push({
        ...base,
        id: `${item.id}:promptToAnswer`,
        kind: "promptToAnswer",
        prompt: item.prompt,
        photoKey: item.photoKey,
        answer: item.answer,
        options: buildOptions(
          item.answer,
          candidates,
          FALLBACK_ANSWERS[item.category],
          random,
        ),
      });
    }

    // Cycle through the available templates when more showings are asked for
    // than there are distinct questions, re-rolling the options each time so
    // a repeat is not answerable from where the right answer sat last time.
    const out: PracticeQuestion[] = [];
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      out.push({
        ...template,
        id: `${template.id}:${i}`,
        options: shuffle(template.options, random),
      });
    }
    return out;
  }
}

export const templateCardGenerator = new TemplateCardGenerator();
