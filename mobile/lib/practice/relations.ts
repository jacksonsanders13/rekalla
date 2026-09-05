/**
 * Working out where somebody sits in a family.
 *
 * The tree needs to know which generation a person belongs to, and the
 * shortest way to find that out is not to ask. Somebody typing "granddaughter"
 * has already told us. So the word is looked up, and the question is only put
 * to them when it is a word we do not know.
 *
 * Nobody is asked to nominate a generation number, and nothing here is
 * required: a person with no recognised relation still appears on the tree,
 * off to the side, and can be moved.
 */

/** Generations away from the person using the app. Negative is older. */
export type Generation = -3 | -2 | -1 | 0 | 1 | 2 | 3;

/** Everyone else: friends, neighbors, anyone not on the family line. */
export const BESIDE = "beside" as const;

export type Placement = Generation | typeof BESIDE;

/**
 * The words people actually use, including the ones only used at home.
 * Checked longest first, so "great-grandmother" is not read as "grandmother".
 */
const WORDS: Record<string, Placement> = {
  greatgrandmother: -3, greatgrandfather: -3, greatgrandparent: -3,
  greatgran: -3, greatnan: -3,

  grandmother: -2, grandfather: -2, grandparent: -2, grandma: -2,
  grandad: -2, granddad: -2, grandpa: -2, granny: -2, grannie: -2,
  gran: -2, nan: -2, nana: -2, nanna: -2, nanny: -2, papa: -2, poppa: -2,

  mother: -1, father: -1, parent: -1, mum: -1, mam: -1, mom: -1,
  mummy: -1, dad: -1, daddy: -1, stepmother: -1, stepfather: -1,
  motherinlaw: -1, fatherinlaw: -1, aunt: -1, auntie: -1, aunty: -1, uncle: -1,

  wife: 0, husband: 0, partner: 0, spouse: 0, sister: 0, brother: 0,
  sibling: 0, cousin: 0, twin: 0, sisterinlaw: 0, brotherinlaw: 0,
  stepsister: 0, stepbrother: 0,

  daughter: 1, son: 1, child: 1, niece: 1, nephew: 1,
  stepdaughter: 1, stepson: 1, daughterinlaw: 1, soninlaw: 1,

  granddaughter: 2, grandson: 2, grandchild: 2, greatniece: 2, greatnephew: 2,

  greatgranddaughter: 3, greatgrandson: 3, greatgrandchild: 3,

  friend: BESIDE, neighbor: BESIDE, carer: BESIDE,
  helper: BESIDE, colleague: BESIDE, godmother: BESIDE, godfather: BESIDE,
  godson: BESIDE, goddaughter: BESIDE,
};

const KEYS_BY_LENGTH = Object.keys(WORDS).sort((a, b) => b.length - a.length);

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Reads a placement out of what somebody typed, or null when the word is not
 * one we know. Null is a perfectly good answer: the tree asks then.
 */
export function inferPlacement(relationship: string | null): Placement | null {
  if (!relationship) return null;
  const text = normalise(relationship);
  if (!text) return null;

  for (const key of KEYS_BY_LENGTH) {
    if (text.includes(key)) return WORDS[key];
  }
  return null;
}

export const BANDS: { placement: Placement; heading: string }[] = [
  { placement: -3, heading: "Great-grandparents" },
  { placement: -2, heading: "Grandparents" },
  { placement: -1, heading: "Parents, aunts and uncles" },
  { placement: 0, heading: "You, and your own generation" },
  { placement: 1, heading: "Children, nieces and nephews" },
  { placement: 2, heading: "Grandchildren" },
  { placement: 3, heading: "Great-grandchildren" },
  { placement: BESIDE, heading: "Also in your life" },
];

export function bandHeading(placement: Placement): string {
  return BANDS.find((band) => band.placement === placement)?.heading ?? "Also in your life";
}

/**
 * The choices offered when the typed word was not recognised, or when
 * somebody wants to move a person on the tree. Worded as places in a family
 * rather than as numbers.
 */
export const PLACEMENT_CHOICES: { placement: Placement; label: string }[] = [
  { placement: -2, label: "A grandparent, or older" },
  { placement: -1, label: "A parent, aunt or uncle" },
  { placement: 0, label: "Your own generation" },
  { placement: 1, label: "A child, niece or nephew" },
  { placement: 2, label: "A grandchild, or younger" },
  { placement: BESIDE, label: "Not family, but part of your life" },
];

/** Orders the bands down the screen, oldest first, others last. */
export function bandOrder(placement: Placement): number {
  return placement === BESIDE ? 100 : placement;
}
