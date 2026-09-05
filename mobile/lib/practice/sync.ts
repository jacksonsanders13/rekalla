/**
 * Backing practice up, and getting it back.
 *
 * The phone stays the source of truth. Nothing in a session waits on any of
 * this, and every function here can fail without the app noticing: a failed
 * backup is a backup that has not happened yet, not an error to put in front
 * of somebody mid-practice.
 *
 * The ids pushed are the ones the device already generated, so sending the
 * same document twice writes the same rows twice and changes nothing. That
 * is what makes a retry after a dropped connection safe, and it is the whole
 * reason the tables are keyed the way they are.
 *
 * On signing in, one of two things happens, and the rule is deliberately
 * blunt rather than clever: if the account already holds items, the account
 * wins and the phone is replaced. If it does not, the phone is pushed up.
 * Merging two divergent histories of the same single-user shelf is a problem
 * this app does not need to have, and a wrong merge would silently reshuffle
 * somebody's schedule.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { emptyData, type PracticeData } from "./store";
import { loadPhoto, savePhotoWithKey } from "./photos";
import type { LocalUser, MemoryItem, ReviewLog, ScheduledCard } from "./types";
import type { Placement } from "./relations";

/**
 * The client is typed against the tables the earlier app uses. Rather than
 * regenerate that file and drag every retired screen through a type change,
 * the practice tables are reached through one untyped handle and the rows
 * are given their shape here.
 */
const db = supabase as unknown as SupabaseClient;

const BUCKET = "practice-photos";

/** Supabase takes a few thousand rows happily; this keeps requests small. */
const CHUNK = 200;

interface ProfileRow {
  user_id: string;
  display_name: string;
  daily_goal_cards: number;
  reminder_time: string | null;
  setup_mode: string;
  text_scale: number;
  sound_on: boolean;
}

interface ItemRow {
  user_id: string;
  id: string;
  category: string;
  prompt: string;
  answer: string;
  photo_key: string | null;
  audio_key: string | null;
  detail: string | null;
  relationship: string | null;
  placement: string | null;
  created_at: string;
  created_by: string;
  is_active: boolean;
}

interface CardRow {
  user_id: string;
  id: string;
  memory_item_id: string;
  interval_index: number;
  last_success_interval_index: number;
  due_at: string;
  consecutive_successes: number;
  review_count: number;
}

interface LogRow {
  user_id: string;
  id: string;
  scheduled_card_id: string;
  reviewed_at: string;
  was_correct: boolean;
  interval_index_at_review: number;
}

function chunked<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

function photoPath(userId: string, photoKey: string): string {
  return `${userId}/${photoKey}.jpg`;
}

/** 'beside' and the numbers both live in one text column. */
function placementToText(placement: Placement | null): string | null {
  return placement === null ? null : String(placement);
}

function placementFromText(text: string | null): Placement | null {
  if (text === null) return null;
  if (text === "beside") return "beside";
  const value = Number(text);
  if (!Number.isInteger(value) || value < -3 || value > 3) return null;
  return value as Placement;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("could not read the photo"));
    reader.onloadend = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

// ---------------------------------------------------------------------------
// Going up
// ---------------------------------------------------------------------------

/**
 * Sends the whole document. Returns the photo keys that are now in the
 * bucket, so the next push can skip them.
 */
export async function pushEverything(
  userId: string,
  data: PracticeData,
): Promise<string[]> {
  const user = data.user;
  if (user) {
    const profile: ProfileRow = {
      user_id: userId,
      display_name: user.displayName,
      daily_goal_cards: user.dailyGoalCards,
      reminder_time: user.reminderTime,
      setup_mode: user.setupMode,
      text_scale: user.textScale,
      sound_on: user.soundOn,
    };
    const { error } = await db.from("practice_profiles").upsert(profile);
    if (error) throw error;
  }

  // Items before cards: a card points at an item, and the constraint that
  // enforces that would reject the pair in the other order.
  for (const batch of chunked(data.items)) {
    const rows: ItemRow[] = batch.map((item) => ({
      user_id: userId,
      id: item.id,
      category: item.category,
      prompt: item.prompt,
      answer: item.answer,
      photo_key: item.photoKey,
      audio_key: item.audioKey,
      detail: item.detail,
      relationship: item.relationship,
      placement: placementToText(item.placement),
      created_at: item.createdAt,
      created_by: item.createdBy,
      is_active: item.isActive,
    }));
    const { error } = await db.from("memory_items").upsert(rows);
    if (error) throw error;
  }

  for (const batch of chunked(data.cards)) {
    const rows: CardRow[] = batch.map((card) => ({
      user_id: userId,
      id: card.id,
      memory_item_id: card.memoryItemId,
      interval_index: card.intervalIndex,
      last_success_interval_index: card.lastSuccessIntervalIndex,
      due_at: card.dueAt,
      consecutive_successes: card.consecutiveSuccesses,
      review_count: card.reviewCount,
    }));
    const { error } = await db.from("scheduled_cards").upsert(rows);
    if (error) throw error;
  }

  for (const batch of chunked(data.logs)) {
    const rows: LogRow[] = batch.map((log) => ({
      user_id: userId,
      id: log.id,
      scheduled_card_id: log.scheduledCardId,
      reviewed_at: log.reviewedAt,
      was_correct: log.wasCorrect,
      interval_index_at_review: log.intervalIndexAtReview,
    }));
    const { error } = await db.from("review_logs").upsert(rows);
    if (error) throw error;
  }

  for (const batch of chunked(data.progress.practiceDays)) {
    const rows = batch.map((day) => ({ user_id: userId, day }));
    const { error } = await db.from("practice_days").upsert(rows);
    if (error) throw error;
  }

  // Photographs last. They are the slowest part and the least urgent: the
  // rows above are what make the shelf recoverable at all.
  const alreadyUp = new Set(data.syncedPhotoKeys);
  const uploaded: string[] = [...data.syncedPhotoKeys];

  for (const item of data.items) {
    if (!item.photoKey || alreadyUp.has(item.photoKey)) continue;
    const base64 = await loadPhoto(item.photoKey);
    if (!base64) continue;

    const bytes = base64ToBytes(base64);
    const { error } = await db.storage
      .from(BUCKET)
      .upload(photoPath(userId, item.photoKey), bytes.buffer as ArrayBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (error) throw error;
    uploaded.push(item.photoKey);
  }

  return uploaded;
}

// ---------------------------------------------------------------------------
// Coming down
// ---------------------------------------------------------------------------

/** Reads the account back. Null when there is nothing in it yet. */
export async function pullEverything(userId: string): Promise<PracticeData | null> {
  const items = await db.from("memory_items").select("*").eq("user_id", userId);
  if (items.error) throw items.error;
  const itemRows = (items.data ?? []) as ItemRow[];
  if (itemRows.length === 0) return null;

  const [cards, logs, days, profile] = await Promise.all([
    db.from("scheduled_cards").select("*").eq("user_id", userId),
    db.from("review_logs").select("*").eq("user_id", userId),
    db.from("practice_days").select("day").eq("user_id", userId),
    db.from("practice_profiles").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (cards.error) throw cards.error;
  if (logs.error) throw logs.error;
  if (days.error) throw days.error;

  const profileRow = (profile.data ?? null) as ProfileRow | null;
  const restored = emptyData();

  const user: LocalUser | null = profileRow
    ? {
        id: userId,
        displayName: profileRow.display_name,
        createdAt: new Date().toISOString(),
        dailyGoalCards: profileRow.daily_goal_cards,
        reminderTime: profileRow.reminder_time,
        setupMode: profileRow.setup_mode === "helper" ? "helper" : "self",
        textScale: Number(profileRow.text_scale) || 1,
        soundOn: Boolean(profileRow.sound_on),
        wants: [],
      }
    : null;

  const restoredItems: MemoryItem[] = itemRows.map((row) => ({
    id: row.id,
    userId,
    category: row.category as MemoryItem["category"],
    prompt: row.prompt,
    answer: row.answer,
    photoKey: row.photo_key,
    audioKey: row.audio_key,
    detail: row.detail,
    relationship: row.relationship,
    placement: placementFromText(row.placement),
    createdAt: row.created_at,
    createdBy: row.created_by === "familyMember" ? "familyMember" : "self",
    isActive: row.is_active,
  }));

  const restoredCards: ScheduledCard[] = ((cards.data ?? []) as CardRow[]).map((row) => ({
    id: row.id,
    memoryItemId: row.memory_item_id,
    intervalIndex: row.interval_index,
    lastSuccessIntervalIndex: row.last_success_interval_index,
    dueAt: row.due_at,
    consecutiveSuccesses: row.consecutive_successes,
    reviewCount: row.review_count,
  }));

  const restoredLogs: ReviewLog[] = ((logs.data ?? []) as LogRow[]).map((row) => ({
    id: row.id,
    scheduledCardId: row.scheduled_card_id,
    reviewedAt: row.reviewed_at,
    wasCorrect: row.was_correct,
    intervalIndexAtReview: row.interval_index_at_review,
  }));

  const practiceDays = ((days.data ?? []) as { day: string }[])
    .map((row) => row.day)
    .sort();

  // Photographs, one at a time. A face that does not come down leaves the
  // item in place with its name and its question: worse, but not lost.
  const downloaded: string[] = [];
  for (const item of restoredItems) {
    if (!item.photoKey) continue;
    const file = await db.storage.from(BUCKET).download(photoPath(userId, item.photoKey));
    if (file.error || !file.data) continue;
    try {
      await savePhotoWithKey(item.photoKey, await blobToBase64(file.data));
      downloaded.push(item.photoKey);
    } catch {
      // Left off the list, so the next backup puts it back up.
    }
  }

  return {
    ...restored,
    user,
    items: restoredItems,
    cards: restoredCards,
    logs: restoredLogs,
    progress: { practiceDays, cardsPractised: restoredLogs.length },
    migratedToUserId: userId,
    syncedPhotoKeys: downloaded,
    lastPushedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Joining the two up
// ---------------------------------------------------------------------------

export interface LinkResult {
  data: PracticeData;
  direction: "pushed" | "pulled";
}

/**
 * Called the moment somebody signs in or creates an account. Decides which
 * way the data goes, does it, and hands back the document to keep.
 */
export async function linkAccount(
  userId: string,
  local: PracticeData,
): Promise<LinkResult> {
  const remote = await pullEverything(userId);

  if (remote) return { data: remote, direction: "pulled" };

  const syncedPhotoKeys = await pushEverything(userId, local);
  return {
    data: {
      ...local,
      user: local.user ? { ...local.user, id: userId } : local.user,
      migratedToUserId: userId,
      syncedPhotoKeys,
      lastPushedAt: new Date().toISOString(),
    },
    direction: "pushed",
  };
}

/**
 * Removes the photographs, then the account. The rows go with the user
 * because every table cascades from it; storage objects do not, so they are
 * taken out first and by name.
 */
export async function deleteAccountEverywhere(
  userId: string,
  data: PracticeData,
): Promise<void> {
  const paths = data.items
    .filter((item) => item.photoKey)
    .map((item) => photoPath(userId, item.photoKey as string));

  if (paths.length > 0) {
    const { error } = await db.storage.from(BUCKET).remove(paths);
    if (error) throw error;
  }

  const { error } = await db.rpc("delete_practice_account");
  if (error) throw error;
}
