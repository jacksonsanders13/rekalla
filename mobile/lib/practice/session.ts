/**
 * Putting a session together, and running it.
 *
 * Two jobs live here. Assembly decides which items are practiced and in what
 * order. The state machine decides what happens when one is answered, which
 * is where the errorless rule is enforced: a wrong answer shows the right one
 * and then asks the same question again, so nobody is ever left sitting in a
 * mistake, and nothing is ever scored against them.
 *
 * Pure, like scheduler.ts, and tested on its own.
 */
import type { MemoryItem, ScheduledCard } from "./types.ts";
import { isDue } from "./scheduler.ts";
import type { CardGenerator, PracticeQuestion } from "./card-generator.ts";
import { templateCardGenerator } from "./card-generator.ts";

/** How many times a new item is shown inside the session that introduces it. */
export const INTRODUCTION_SHOWINGS = 4;

/**
 * Cards to show in between the repeats of a new item: right away, then
 * after 1 other card, then after 3, then after 6. Measured in cards rather
 * than in minutes, which is what makes it work in a session of any length.
 */
export const INTRODUCTION_GAPS = [1, 3, 6];

export interface SessionPlan {
  /** Items due today, longest overdue first. */
  reviews: ScheduledCard[];
  /** Items that have never been practiced. */
  introductions: ScheduledCard[];
  /** Only used when the session would otherwise be short. */
  padding: ScheduledCard[];
}

export function planIsEmpty(plan: SessionPlan): boolean {
  return (
    plan.reviews.length === 0 &&
    plan.introductions.length === 0 &&
    plan.padding.length === 0
  );
}

function byDueAt(a: ScheduledCard, b: ScheduledCard): number {
  return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
}

/**
 * Everything due, then anything new, and only then, if the session is still
 * short of the goal, whatever is due soonest. Anything already practiced
 * today is left out: re-asking something answered ten minutes ago teaches
 * nothing and makes the session feel like filler.
 */
export function assembleSession(
  cards: ScheduledCard[],
  now: Date,
  goal: number,
  practicedTodayCardIds: string[] = [],
): SessionPlan {
  const practiced = new Set(practicedTodayCardIds);
  const available = cards.filter((card) => !practiced.has(card.id));

  const reviews = available
    .filter((card) => card.reviewCount > 0 && isDue(card, now))
    .sort(byDueAt);

  const introductions = available
    .filter((card) => card.reviewCount === 0)
    .sort(byDueAt);

  const chosenReviews = reviews.slice(0, goal);
  const chosenIntroductions = introductions.slice(
    0,
    Math.max(0, goal - chosenReviews.length),
  );

  const taken = new Set(
    [...chosenReviews, ...chosenIntroductions].map((card) => card.id),
  );
  const remaining = goal - taken.size;

  const padding =
    remaining > 0
      ? available
          .filter((card) => !taken.has(card.id) && !isDue(card, now))
          .sort(byDueAt)
          .slice(0, remaining)
      : [];

  return { reviews: chosenReviews, introductions: chosenIntroductions, padding };
}

/**
 * Spaces the repeats of a new item through the rest of the session. When
 * there is nothing to put in between, which is the case in the very first
 * session, the repeats simply follow on, and the session is short by design.
 */
export function interleaveIntroduction(
  queue: PracticeQuestion[],
  showings: PracticeQuestion[],
  firstPosition: number,
): PracticeQuestion[] {
  if (showings.length === 0) return queue;

  const out = queue.slice();
  let at = Math.min(Math.max(firstPosition, 0), out.length);
  out.splice(at, 0, showings[0]);

  for (let i = 1; i < showings.length; i++) {
    const gap = INTRODUCTION_GAPS[Math.min(i - 1, INTRODUCTION_GAPS.length - 1)];
    at = Math.min(at + gap + 1, out.length);
    out.splice(at, 0, showings[i]);
  }

  return out;
}

export interface BuildQueueOptions {
  plan: SessionPlan;
  items: MemoryItem[];
  random: () => number;
  generator?: CardGenerator;
  /**
   * Showings for a new item, for the one caller that wants a shorter first
   * outing than the full expansion: the practice run at the end of setup,
   * which has no other cards to space the repeats through.
   */
  showings?: number;
}

/** The ordered list of questions a session will ask. */
export function buildQueue(options: BuildQueueOptions): PracticeQuestion[] {
  const { plan, items, random } = options;
  const generator = options.generator ?? templateCardGenerator;
  const byId = new Map(items.map((item) => [item.id, item]));

  const single = (card: ScheduledCard): PracticeQuestion[] => {
    const item = byId.get(card.memoryItemId);
    if (!item || !item.isActive) return [];
    return generator.generate(item, card.id, { pool: items, count: 1, random });
  };

  let queue: PracticeQuestion[] = [
    ...plan.reviews.flatMap(single),
    ...plan.padding.flatMap(single),
  ];

  plan.introductions.forEach((card, index) => {
    const item = byId.get(card.memoryItemId);
    if (!item || !item.isActive) return;
    const showings = generator.generate(item, card.id, {
      pool: items,
      count: options.showings ?? INTRODUCTION_SHOWINGS,
      random,
    });
    queue = interleaveIntroduction(queue, showings, index);
  });

  return queue;
}

export type SessionPhase = "asking" | "correct" | "reveal" | "finished";

export interface SessionState {
  queue: PracticeQuestion[];
  index: number;
  phase: SessionPhase;
  /** The option that was tapped, so the screen can mark it. */
  chosen: string | null;
  /** Cards whose first attempt this session has already moved the schedule. */
  settledCardIds: string[];
  /** Distinct cards practiced, for the day's count. */
  practicedCardIds: string[];
}

export function startSession(queue: PracticeQuestion[]): SessionState {
  return {
    queue,
    index: 0,
    phase: queue.length === 0 ? "finished" : "asking",
    chosen: null,
    settledCardIds: [],
    practicedCardIds: [],
  };
}

export function currentQuestion(state: SessionState): PracticeQuestion | null {
  return state.queue[state.index] ?? null;
}

/**
 * What the caller has to do to storage as a result of an answer. Returned
 * rather than performed, so the state machine stays pure and testable.
 */
export interface AnswerOutcome {
  state: SessionState;
  wasCorrect: boolean;
  /**
   * Set only on an item's first attempt in this session. The schedule moves
   * once per item per session; the repeat after a miss is practice, and must
   * not count as a success on top of the miss.
   */
  settle: { cardId: string; wasCorrect: boolean } | null;
}

/**
 * A wrong answer inserts the same question again, directly after this one.
 * There is no path through this function that leaves the queue on a question
 * the person has not answered correctly.
 */
export function answerQuestion(state: SessionState, choice: string): AnswerOutcome {
  const question = currentQuestion(state);
  if (!question || state.phase !== "asking") {
    return { state, wasCorrect: false, settle: null };
  }

  const wasCorrect = choice === question.answer;
  const alreadySettled = state.settledCardIds.includes(question.cardId);
  const settle =
    alreadySettled || question.isRemediation
      ? null
      : { cardId: question.cardId, wasCorrect };

  const queue = state.queue.slice();
  if (!wasCorrect) {
    queue.splice(state.index + 1, 0, {
      ...question,
      id: `${question.id}:again`,
      isRemediation: true,
    });
  }

  const practicedCardIds = state.practicedCardIds.includes(question.cardId)
    ? state.practicedCardIds
    : [...state.practicedCardIds, question.cardId];

  return {
    wasCorrect,
    settle,
    state: {
      ...state,
      queue,
      phase: wasCorrect ? "correct" : "reveal",
      chosen: choice,
      settledCardIds: settle
        ? [...state.settledCardIds, question.cardId]
        : state.settledCardIds,
      practicedCardIds,
    },
  };
}

/** Moves on from a correct answer, or from a revealed one to its repeat. */
export function advance(state: SessionState): SessionState {
  if (state.phase !== "correct" && state.phase !== "reveal") return state;
  const next = state.index + 1;
  return {
    ...state,
    index: next,
    chosen: null,
    phase: next >= state.queue.length ? "finished" : "asking",
  };
}

/**
 * How far through the session the person is, for the row of dots. The total
 * grows when a question is repeated, which is honest: there is one more
 * thing to do than there was a moment ago.
 */
export function sessionProgress(state: SessionState): {
  total: number;
  done: number;
} {
  return {
    total: state.queue.length,
    done: Math.min(state.index, state.queue.length),
  };
}
