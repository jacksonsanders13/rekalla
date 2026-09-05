/**
 * Spaced retrieval scheduling.
 *
 * Recall is prompted at gaps that widen each time the person succeeds, and
 * narrow to the last gap they actually cleared when they do not. This file is
 * deliberately pure: no React, no storage, no native modules, so it can be
 * run and tested on its own.
 *
 * Two rules here are load bearing and easy to get wrong later:
 *
 *   1. A miss drops the item back to the last rung it was cleared at, never
 *      to the bottom. Starting from scratch every time someone stumbles is
 *      demoralising and it undoes work that was genuinely done.
 *   2. An item's very first outing is an introduction. It is practiced
 *      several times inside that one session (see session.ts) and then lands
 *      on rung 0, one day later. Treating the introduction as a review would
 *      skip rung 0 entirely, since a success advances the index before the
 *      next gap is measured.
 */
import type { ScheduledCard } from "./types.ts";

/** The gaps between sessions, in days. */
export const INTERVAL_LADDER_DAYS = [1, 2, 4, 9, 21, 42, 90] as const;

export const MAX_INTERVAL_INDEX = INTERVAL_LADDER_DAYS.length - 1;
export const MIN_INTERVAL_INDEX = 0;

/** Keeps an index on the ladder however it was arrived at. */
export function clampIndex(index: number): number {
  if (!Number.isFinite(index)) return MIN_INTERVAL_INDEX;
  return Math.min(MAX_INTERVAL_INDEX, Math.max(MIN_INTERVAL_INDEX, Math.trunc(index)));
}

export function intervalDaysFor(index: number): number {
  return INTERVAL_LADDER_DAYS[clampIndex(index)];
}

/**
 * Midnight at the start of the day `date` falls in, in the phone's own zone.
 */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Due dates land at the start of a day rather than at the clock time of the
 * last session. Someone who practices at three in the afternoon and then
 * picks the phone up at nine the next morning should find their practice
 * waiting, not be told to come back later. Built from calendar fields rather
 * than by adding milliseconds, so a clock change does not shift the day.
 */
export function dueDateFor(now: Date, index: number): Date {
  const start = startOfLocalDay(now);
  return new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + intervalDaysFor(index),
  );
}

/** "YYYY-MM-DD" for the local day a date falls in. */
export function localDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * A brand new item, ready to be introduced. It is due immediately: the point
 * of adding something is to practice it now.
 */
export function newCard(
  id: string,
  memoryItemId: string,
  now: Date,
): ScheduledCard {
  return {
    id,
    memoryItemId,
    intervalIndex: MIN_INTERVAL_INDEX,
    lastSuccessIntervalIndex: MIN_INTERVAL_INDEX,
    dueAt: now.toISOString(),
    consecutiveSuccesses: 0,
    reviewCount: 0,
  };
}

export function isDue(card: ScheduledCard, now: Date): boolean {
  return new Date(card.dueAt).getTime() <= now.getTime();
}

/**
 * How far up the ladder an item has climbed, from 0 to 1, for the ring drawn
 * around it. It measures how far apart the practices have grown, which is the
 * only thing this app has any business calling progress. It is not a mark:
 * nothing here counts what somebody got wrong.
 */
export function ladderProgress(card: ScheduledCard): number {
  if (card.reviewCount === 0) return 0;
  return clampIndex(card.intervalIndex) / MAX_INTERVAL_INDEX;
}

/**
 * The first session an item appears in. However it went, the item settles on
 * rung 0 and comes back tomorrow: it has been seen several times in the last
 * few minutes, which is not evidence it will still be there in two days.
 */
export function applyIntroduction(card: ScheduledCard, now: Date): ScheduledCard {
  return {
    ...card,
    intervalIndex: MIN_INTERVAL_INDEX,
    lastSuccessIntervalIndex: MIN_INTERVAL_INDEX,
    dueAt: dueDateFor(now, MIN_INTERVAL_INDEX).toISOString(),
    consecutiveSuccesses: 1,
    reviewCount: card.reviewCount + 1,
  };
}

/** Recalled it. Bank the rung that was just cleared, then widen the gap. */
export function applyCorrect(card: ScheduledCard, now: Date): ScheduledCard {
  const cleared = clampIndex(card.intervalIndex);
  const next = clampIndex(cleared + 1);
  return {
    ...card,
    intervalIndex: next,
    lastSuccessIntervalIndex: cleared,
    dueAt: dueDateFor(now, next).toISOString(),
    consecutiveSuccesses: card.consecutiveSuccesses + 1,
    reviewCount: card.reviewCount + 1,
  };
}

/**
 * Did not recall it. The answer has already been shown and answered
 * correctly by the time this runs (see session.ts); this only decides when
 * the item comes back, which is at the last gap the person did clear.
 */
export function applyIncorrect(card: ScheduledCard, now: Date): ScheduledCard {
  const back = clampIndex(card.lastSuccessIntervalIndex);
  return {
    ...card,
    intervalIndex: back,
    lastSuccessIntervalIndex: back,
    dueAt: dueDateFor(now, back).toISOString(),
    consecutiveSuccesses: 0,
    reviewCount: card.reviewCount + 1,
  };
}

/**
 * The one entry point the app should call when an item's first attempt in a
 * session resolves. Applied as soon as that attempt resolves rather than at
 * the end, so leaving halfway through keeps everything already practiced.
 */
export function settleCard(
  card: ScheduledCard,
  wasCorrect: boolean,
  now: Date,
): ScheduledCard {
  if (card.reviewCount === 0) return applyIntroduction(card, now);
  return wasCorrect ? applyCorrect(card, now) : applyIncorrect(card, now);
}
