import test from "node:test";
import assert from "node:assert/strict";

import {
  INTRODUCTION_SHOWINGS,
  advance,
  answerQuestion,
  assembleSession,
  buildQueue,
  currentQuestion,
  interleaveIntroduction,
  sessionProgress,
  startSession,
} from "./session.ts";
import { OPTIONS_PER_QUESTION, seededRandom } from "./card-generator.ts";
import type { PracticeQuestion } from "./card-generator.ts";
import type { MemoryItem, ScheduledCard } from "./types.ts";

const NOW = new Date(2026, 8, 3, 9, 0);

function iso(daysFromNow: number): string {
  return new Date(2026, 8, 3 + daysFromNow, 9, 0).toISOString();
}

function card(id: string, overrides: Partial<ScheduledCard> = {}): ScheduledCard {
  return {
    id,
    memoryItemId: `item-${id}`,
    intervalIndex: 1,
    lastSuccessIntervalIndex: 1,
    dueAt: iso(0),
    consecutiveSuccesses: 1,
    reviewCount: 2,
    ...overrides,
  };
}

function person(id: string, name: string, relationship: string): MemoryItem {
  return {
    id,
    userId: "user-1",
    category: "person",
    prompt: "Who is this?",
    answer: name,
    photoKey: `photo-${id}`,
    audioKey: null,
    detail: `${name} lives nearby.`,
    relationship,
    placement: 2,
    createdAt: iso(-10),
    createdBy: "self",
    isActive: true,
  };
}

function question(overrides: Partial<PracticeQuestion> = {}): PracticeQuestion {
  return {
    id: "q1",
    itemId: "item-1",
    cardId: "c1",
    kind: "photoToName",
    prompt: "Who is this?",
    photoKey: "photo-1",
    options: ["Ellie", "Anna", "Ruth"],
    answer: "Ellie",
    detail: "Ellie is your granddaughter.",
    isRemediation: false,
    ...overrides,
  };
}

test("due items come first, longest overdue first", () => {
  const plan = assembleSession(
    [
      card("a", { dueAt: iso(-1) }),
      card("b", { dueAt: iso(-5) }),
      card("c", { dueAt: iso(0) }),
    ],
    NOW,
    10,
  );

  assert.deepEqual(plan.reviews.map((c) => c.id), ["b", "a", "c"]);
  assert.equal(plan.padding.length, 0);
});

test("new items follow the due ones", () => {
  const plan = assembleSession(
    [card("due", { dueAt: iso(-1) }), card("new", { reviewCount: 0, dueAt: iso(0) })],
    NOW,
    10,
  );

  assert.deepEqual(plan.reviews.map((c) => c.id), ["due"]);
  assert.deepEqual(plan.introductions.map((c) => c.id), ["new"]);
});

test("the session is capped at the daily goal, due items winning the places", () => {
  const cards = [
    card("d1", { dueAt: iso(-3) }),
    card("d2", { dueAt: iso(-2) }),
    card("n1", { reviewCount: 0 }),
    card("n2", { reviewCount: 0 }),
  ];

  const plan = assembleSession(cards, NOW, 3);

  assert.deepEqual(plan.reviews.map((c) => c.id), ["d1", "d2"]);
  assert.deepEqual(plan.introductions.map((c) => c.id), ["n1"]);
  assert.equal(plan.padding.length, 0);
});

test("items due in the future are only used to fill a short session", () => {
  const cards = [card("due", { dueAt: iso(-1) }), card("soon", { dueAt: iso(2) }), card("later", { dueAt: iso(9) })];

  const short = assembleSession(cards, NOW, 10);
  assert.deepEqual(short.padding.map((c) => c.id), ["soon", "later"]);

  const full = assembleSession(cards, NOW, 1);
  assert.equal(full.padding.length, 0);
});

test("nothing practiced today is asked again as filler", () => {
  const cards = [card("done", { dueAt: iso(4) }), card("fresh", { dueAt: iso(6) })];

  const plan = assembleSession(cards, NOW, 10, ["done"]);

  assert.deepEqual(plan.padding.map((c) => c.id), ["fresh"]);
});

test("an empty shelf produces an empty plan rather than invented work", () => {
  const plan = assembleSession([], NOW, 10);

  assert.deepEqual(plan, { reviews: [], introductions: [], padding: [] });
});

test("repeats of a new item are spaced by one, three and six cards", () => {
  const filler = Array.from({ length: 12 }, (_, i) =>
    question({ id: `f${i}`, cardId: `fc${i}`, itemId: `fi${i}` }),
  );
  const showings = Array.from({ length: 4 }, (_, i) =>
    question({ id: `new${i}`, cardId: "new", itemId: "new-item" }),
  );

  const queue = interleaveIntroduction(filler, showings, 0);
  const positions = queue
    .map((q, index) => (q.cardId === "new" ? index : -1))
    .filter((index) => index >= 0);

  assert.deepEqual(positions, [0, 2, 6, 13]);
  assert.equal(queue.length, filler.length + showings.length);
});

test("repeats fall in line behind each other when there is nothing to space them through", () => {
  const showings = Array.from({ length: 4 }, (_, i) =>
    question({ id: `new${i}`, cardId: "new" }),
  );

  const queue = interleaveIntroduction([], showings, 0);

  assert.equal(queue.length, 4);
  assert.ok(queue.every((q) => q.cardId === "new"));
});

test("the first session after setup asks about the person who was just added", () => {
  const item = person("item-1", "Ellie", "granddaughter");
  const plan = assembleSession([card("c1", { memoryItemId: "item-1", reviewCount: 0 })], NOW, 10);

  const queue = buildQueue({
    plan,
    items: [item],
    random: seededRandom(7),
    showings: 3,
  });

  assert.equal(queue.length, 3);
  for (const q of queue) {
    assert.equal(q.itemId, "item-1");
    assert.equal(q.options.length, OPTIONS_PER_QUESTION);
    assert.ok(q.options.includes(q.answer));
    assert.equal(new Set(q.options).size, OPTIONS_PER_QUESTION);
  }
  assert.ok(queue.some((q) => q.kind === "photoToName"));
  assert.ok(queue.some((q) => q.kind === "nameToRelationship"));
});

test("a full introduction is four showings by default", () => {
  const item = person("item-1", "Ellie", "granddaughter");
  const plan = assembleSession([card("c1", { memoryItemId: "item-1", reviewCount: 0 })], NOW, 10);

  const queue = buildQueue({ plan, items: [item], random: seededRandom(3) });

  assert.equal(queue.length, INTRODUCTION_SHOWINGS);
});

test("wrong options are other people the person actually knows when there are some", () => {
  const items = [
    person("item-1", "Ellie", "granddaughter"),
    person("item-2", "Tom", "grandson"),
    person("item-3", "Margaret", "sister"),
  ];
  const plan = assembleSession(
    [card("c1", { memoryItemId: "item-1", reviewCount: 0 })],
    NOW,
    10,
  );

  const queue = buildQueue({ plan, items, random: seededRandom(11), showings: 1 });
  const asked = queue[0];
  const wrong = asked.options.filter((option) => option !== asked.answer);

  assert.deepEqual(wrong.sort(), ["Margaret", "Tom"]);
});

test("a correct answer moves the session on and settles the item once", () => {
  const state = startSession([question(), question({ id: "q2", cardId: "c2" })]);

  const first = answerQuestion(state, "Ellie");

  assert.equal(first.wasCorrect, true);
  assert.equal(first.state.phase, "correct");
  assert.deepEqual(first.settle, { cardId: "c1", wasCorrect: true });
  assert.equal(first.state.queue.length, 2);

  const moved = advance(first.state);
  assert.equal(moved.phase, "asking");
  assert.equal(currentQuestion(moved)?.id, "q2");
});

test("a wrong answer reveals the answer and asks the very same question again", () => {
  const state = startSession([question(), question({ id: "q2", cardId: "c2" })]);

  const missed = answerQuestion(state, "Anna");

  assert.equal(missed.wasCorrect, false);
  assert.equal(missed.state.phase, "reveal");
  assert.deepEqual(missed.settle, { cardId: "c1", wasCorrect: false });
  assert.equal(missed.state.queue.length, 3);

  const repeat = advance(missed.state);
  const asked = currentQuestion(repeat);

  assert.equal(repeat.phase, "asking");
  assert.equal(asked?.cardId, "c1");
  assert.equal(asked?.isRemediation, true);
  assert.equal(asked?.answer, "Ellie");
});

test("the repeat after a miss is practice only and never settles the item again", () => {
  const missed = answerQuestion(startSession([question()]), "Anna");
  const repeat = advance(missed.state);

  const second = answerQuestion(repeat, "Ellie");

  assert.equal(second.wasCorrect, true);
  assert.equal(second.settle, null);
  assert.deepEqual(second.state.settledCardIds, ["c1"]);
});

test("no route through a session ends on a wrong answer", () => {
  let state = startSession([
    question(),
    question({ id: "q2", cardId: "c2", options: ["Tom", "Peter", "David"], answer: "Tom" }),
  ]);
  const missedOnce = new Set<string>();

  // Get every item wrong once, then right, and check where it leaves off.
  for (let guard = 0; guard < 20 && state.phase !== "finished"; guard++) {
    const asked = currentQuestion(state);
    assert.ok(asked);
    const wrong = asked.options.find((option) => option !== asked.answer) as string;
    const shouldMiss = !missedOnce.has(asked.cardId);
    missedOnce.add(asked.cardId);

    const outcome = answerQuestion(state, shouldMiss ? wrong : asked.answer);
    state = advance(outcome.state);
  }

  assert.equal(state.phase, "finished");

  // Each card's last answer in the session was the right one.
  const lastByCard = new Map<string, PracticeQuestion>();
  for (const q of state.queue) lastByCard.set(q.cardId, q);
  for (const [, q] of lastByCard) assert.equal(q.isRemediation, true);
});

test("progress counts questions done out of questions to do", () => {
  const state = startSession([question(), question({ id: "q2", cardId: "c2" })]);

  assert.deepEqual(sessionProgress(state), { total: 2, done: 0 });

  const after = advance(answerQuestion(state, "Ellie").state);
  assert.deepEqual(sessionProgress(after), { total: 2, done: 1 });
});

test("a session with nothing in it is finished from the start", () => {
  const state = startSession([]);

  assert.equal(state.phase, "finished");
  assert.equal(currentQuestion(state), null);
});
