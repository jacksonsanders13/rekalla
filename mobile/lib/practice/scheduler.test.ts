import test from "node:test";
import assert from "node:assert/strict";

import {
  INTERVAL_LADDER_DAYS,
  MAX_INTERVAL_INDEX,
  applyCorrect,
  applyIncorrect,
  applyIntroduction,
  clampIndex,
  dueDateFor,
  intervalDaysFor,
  isDue,
  ladderProgress,
  localDayKey,
  newCard,
  settleCard,
} from "./scheduler.ts";
import type { ScheduledCard } from "./types.ts";

const NOW = new Date(2026, 8, 3, 15, 30); // 3 September 2026, mid afternoon

function card(overrides: Partial<ScheduledCard> = {}): ScheduledCard {
  return {
    id: "card-1",
    memoryItemId: "item-1",
    intervalIndex: 0,
    lastSuccessIntervalIndex: 0,
    dueAt: NOW.toISOString(),
    consecutiveSuccesses: 0,
    reviewCount: 1,
    ...overrides,
  };
}

/** Whole days between the start of NOW's day and a scheduled due date. */
function daysUntil(dueAt: string): number {
  const due = new Date(dueAt);
  const start = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  return Math.round((due.getTime() - start.getTime()) / 86_400_000);
}

test("the ladder is the one in the specification", () => {
  assert.deepEqual([...INTERVAL_LADDER_DAYS], [1, 2, 4, 9, 21, 42, 90]);
  assert.equal(MAX_INTERVAL_INDEX, 6);
});

test("a correct answer banks the rung just cleared and widens the gap", () => {
  const next = applyCorrect(card({ intervalIndex: 2, lastSuccessIntervalIndex: 1 }), NOW);

  assert.equal(next.intervalIndex, 3);
  assert.equal(next.lastSuccessIntervalIndex, 2);
  assert.equal(daysUntil(next.dueAt), 9);
  assert.equal(next.consecutiveSuccesses, 1);
  assert.equal(next.reviewCount, 2);
});

test("successive correct answers climb one rung at a time", () => {
  let current = card({ intervalIndex: 0, lastSuccessIntervalIndex: 0 });
  const gaps: number[] = [];

  for (let i = 0; i < 8; i++) {
    current = applyCorrect(current, NOW);
    gaps.push(daysUntil(current.dueAt));
  }

  assert.deepEqual(gaps, [2, 4, 9, 21, 42, 90, 90, 90]);
  assert.equal(current.consecutiveSuccesses, 8);
});

test("a miss drops to the last rung cleared, not to the bottom", () => {
  const next = applyIncorrect(
    card({ intervalIndex: 5, lastSuccessIntervalIndex: 3 }),
    NOW,
  );

  assert.equal(next.intervalIndex, 3);
  assert.equal(next.lastSuccessIntervalIndex, 3);
  assert.equal(daysUntil(next.dueAt), 9);
  assert.equal(next.consecutiveSuccesses, 0);
});

test("a miss on an item that has never cleared a rung stays at the bottom", () => {
  const next = applyIncorrect(
    card({ intervalIndex: 1, lastSuccessIntervalIndex: 0 }),
    NOW,
  );

  assert.equal(next.intervalIndex, 0);
  assert.equal(daysUntil(next.dueAt), 1);
});

test("repeated misses never push the index below zero", () => {
  let current = card({ intervalIndex: 0, lastSuccessIntervalIndex: 0 });

  for (let i = 0; i < 5; i++) {
    current = applyIncorrect(current, NOW);
    assert.equal(current.intervalIndex, 0);
    assert.equal(daysUntil(current.dueAt), 1);
  }
});

test("the index is clamped at both ends", () => {
  assert.equal(clampIndex(-4), 0);
  assert.equal(clampIndex(0), 0);
  assert.equal(clampIndex(6), 6);
  assert.equal(clampIndex(99), 6);
  assert.equal(clampIndex(Number.NaN), 0);

  assert.equal(intervalDaysFor(-1), 1);
  assert.equal(intervalDaysFor(6), 90);
  assert.equal(intervalDaysFor(7), 90);

  const topped = applyCorrect(
    card({ intervalIndex: MAX_INTERVAL_INDEX, lastSuccessIntervalIndex: 5 }),
    NOW,
  );
  assert.equal(topped.intervalIndex, MAX_INTERVAL_INDEX);
  assert.equal(daysUntil(topped.dueAt), 90);
});

test("a new item is due straight away and counts as unreviewed", () => {
  const fresh = newCard("card-9", "item-9", NOW);

  assert.equal(fresh.reviewCount, 0);
  assert.equal(fresh.intervalIndex, 0);
  assert.ok(isDue(fresh, NOW));
});

test("an introduction lands on the first rung whatever happened in it", () => {
  const fresh = newCard("card-9", "item-9", NOW);

  const afterGood = settleCard(fresh, true, NOW);
  const afterBad = settleCard(fresh, false, NOW);

  for (const settled of [afterGood, afterBad]) {
    assert.equal(settled.intervalIndex, 0);
    assert.equal(settled.lastSuccessIntervalIndex, 0);
    assert.equal(daysUntil(settled.dueAt), 1);
    assert.equal(settled.reviewCount, 1);
  }

  assert.deepEqual(afterGood, applyIntroduction(fresh, NOW));
});

test("an item introduced today is not due again until tomorrow", () => {
  const settled = settleCard(newCard("card-9", "item-9", NOW), true, NOW);
  const laterToday = new Date(2026, 8, 3, 23, 59);
  const tomorrowMorning = new Date(2026, 8, 4, 6, 0);

  assert.equal(isDue(settled, laterToday), false);
  assert.ok(isDue(settled, tomorrowMorning));
});

test("due dates land at the start of a day, not at the hour of the session", () => {
  const due = dueDateFor(NOW, 0);

  assert.equal(due.getHours(), 0);
  assert.equal(due.getMinutes(), 0);
  assert.equal(localDayKey(due), "2026-09-04");
});

test("a settled review uses the review rules once the item is past its introduction", () => {
  const reviewed = card({ intervalIndex: 1, lastSuccessIntervalIndex: 1, reviewCount: 3 });

  assert.deepEqual(settleCard(reviewed, true, NOW), applyCorrect(reviewed, NOW));
  assert.deepEqual(settleCard(reviewed, false, NOW), applyIncorrect(reviewed, NOW));
});

test("the ring measures how far apart the practices have grown, and starts empty", () => {
  assert.equal(ladderProgress(newCard("c", "i", NOW)), 0);
  assert.equal(ladderProgress(card({ intervalIndex: 3, reviewCount: 2 })), 0.5);
  assert.equal(ladderProgress(card({ intervalIndex: 6, reviewCount: 9 })), 1);
});
