/**
 * The practice data model.
 *
 * These are the shapes the app stores locally and the ones Supabase mirrors,
 * one table per interface, with row-level security tying every row to its
 * owner. Local storage is the source of truth: a session must work with the
 * phone in aeroplane mode, so nothing here waits on the network.
 *
 * Dates are ISO strings rather than Date objects so a record survives
 * JSON.stringify into storage and comes back identical.
 */
import type { Placement } from "./relations.ts";
import type { ThemeName } from "../design/palettes.ts";

/** What kind of thing the person wants to be able to recall. */
export type ItemCategory = "person" | "routine" | "place" | "fact";

/** Who put the item in. A family member may help on the device. */
export type CreatedBy = "self" | "familyMember";

/**
 * Chosen once during setup. It changes pronouns and helper text only, never
 * structure or permissions, and there is exactly one account either way.
 */
export type SetupMode = "self" | "helper";

export interface LocalUser {
  id: string;
  displayName: string;
  createdAt: string;
  /** How many items one session aims for. */
  dailyGoalCards: number;
  /** "HH:MM" in the phone's own time zone, or null for no reminder. */
  reminderTime: string | null;
  setupMode: SetupMode;
  /**
   * An in-app multiplier on top of the system text size, for someone who
   * wants larger text than iOS alone gives them. 1 means system size.
   */
  textScale: number;
  /** Confirming sound on a correct answer. Off until asked for. */
  soundOn: boolean;
  /** Dark unless they say otherwise. Light is a real need for some eyes. */
  theme: ThemeName;
  /** The tap you feel on a correct answer. On unless it is unwelcome. */
  hapticsOn: boolean;
  /** What they said they wanted to recall, during setup. */
  wants: ItemCategory[];
}

/** One thing the person wants to be able to recall. */
export interface MemoryItem {
  id: string;
  userId: string;
  category: ItemCategory;
  /** The question as it is read aloud: "Who is this?" */
  prompt: string;
  /** The whole right answer: "Ellie". */
  answer: string;
  /**
   * Key of the stored photo. Local today, a Storage path once sync lands;
   * either way the app reads it through lib/practice/photos.
   */
  photoKey: string | null;
  /** Optional voice note recorded on the device by a family member. */
  audioKey: string | null;
  /** One warm extra line, shown only after a correct answer. */
  detail: string | null;
  /**
   * Not in the original model, and needed: distractors should be other people
   * of the same relationship, so "granddaughter" has to be a field rather
   * than prose inside `answer`.
   */
  relationship: string | null;
  /**
   * Where they sit on the family tree, worked out from the relationship word
   * where possible. Null means it has not been settled yet, and the tree asks.
   */
  placement: Placement | null;
  createdAt: string;
  createdBy: CreatedBy;
  isActive: boolean;
}

/** Scheduling state for one MemoryItem. */
export interface ScheduledCard {
  id: string;
  memoryItemId: string;
  /** Index into the ladder in scheduler.ts. */
  intervalIndex: number;
  /** The highest rung this item has actually been cleared at. */
  lastSuccessIntervalIndex: number;
  dueAt: string;
  consecutiveSuccesses: number;
  /**
   * Also an addition: it separates an item's first outing, which is an
   * introduction and does not move the ladder, from every later review.
   */
  reviewCount: number;
}

/**
 * Kept for scheduling and for future analysis. Never surfaced as a score, an
 * accuracy figure, or a history of what someone got wrong.
 */
export interface ReviewLog {
  id: string;
  scheduledCardId: string;
  reviewedAt: string;
  wasCorrect: boolean;
  intervalIndexAtReview: number;
}

/**
 * How much practice has happened. Counted in days and items, never in misses,
 * so there is nothing here that could be rendered as a failure rate.
 */
export interface Progress {
  /** Local calendar days on which at least one item was practised, "YYYY-MM-DD". */
  practiceDays: string[];
  /** Running total of items practised, for the home screen. */
  cardsPractised: number;
}
