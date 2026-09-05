/**
 * Where practice lives on the device.
 *
 * The phone is the source of truth. A session has to work on a train, in a
 * hospital waiting room, or with the wifi off, so nothing in the practice
 * path is allowed to wait on a network call. An account, when there is one,
 * is a backup of this, not the other way round.
 *
 * One JSON document under one key, which is plenty for the volumes involved:
 * a few hundred items at most, and the whole thing is read once at launch.
 * Photos are held under their own keys so this document stays small.
 *
 * `PracticeStore` is the seam for replacing this with SQLite, or with
 * something that reconciles against Supabase, without any screen noticing.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  LocalUser,
  MemoryItem,
  Progress,
  ReviewLog,
  ScheduledCard,
} from "./types";

const KEY = "rekalla.practice.v1";

/** Logs are kept for scheduling and later analysis, not for ever. */
const MAX_LOGS = 2000;

export interface PracticeData {
  user: LocalUser | null;
  items: MemoryItem[];
  cards: ScheduledCard[];
  logs: ReviewLog[];
  progress: Progress;
  /** Cards practised on `day`, so a session is not padded with them. */
  practisedToday: { day: string; cardIds: string[] };
  /**
   * Set once this data has been copied into an account, so the migration at
   * sign-up runs once and only once.
   */
  migratedToUserId: string | null;
  /**
   * Photos already in the bucket. Kept so a backup does not re-upload every
   * picture every time somebody finishes a session.
   */
  syncedPhotoKeys: string[];
  /** When the last backup went up, for the line in Settings. */
  lastPushedAt: string | null;
}

export function emptyData(): PracticeData {
  return {
    user: null,
    items: [],
    cards: [],
    logs: [],
    progress: { practiceDays: [], cardsPractised: 0 },
    practisedToday: { day: "", cardIds: [] },
    migratedToUserId: null,
    syncedPhotoKeys: [],
    lastPushedAt: null,
  };
}

export interface PracticeStore {
  load(): Promise<PracticeData>;
  save(data: PracticeData): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Anything unreadable is treated as absent rather than thrown. A person who
 * opens the app to a crash has lost the app; a person who opens it to an
 * empty shelf has lost a list they can rebuild, and we would rather be told
 * about the second.
 */
function parse(raw: string | null): PracticeData {
  if (!raw) return emptyData();
  try {
    const parsed = JSON.parse(raw) as Partial<PracticeData>;
    const base = emptyData();
    return {
      user: parsed.user ?? base.user,
      items: Array.isArray(parsed.items) ? parsed.items : base.items,
      cards: Array.isArray(parsed.cards) ? parsed.cards : base.cards,
      logs: Array.isArray(parsed.logs) ? parsed.logs : base.logs,
      progress: parsed.progress ?? base.progress,
      practisedToday: parsed.practisedToday ?? base.practisedToday,
      migratedToUserId: parsed.migratedToUserId ?? base.migratedToUserId,
      syncedPhotoKeys: Array.isArray(parsed.syncedPhotoKeys)
        ? parsed.syncedPhotoKeys
        : base.syncedPhotoKeys,
      lastPushedAt: parsed.lastPushedAt ?? base.lastPushedAt,
    };
  } catch {
    return emptyData();
  }
}

export const asyncStorageStore: PracticeStore = {
  async load() {
    return parse(await AsyncStorage.getItem(KEY));
  },
  async save(data) {
    const trimmed: PracticeData = {
      ...data,
      logs: data.logs.slice(-MAX_LOGS),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  },
  async clear() {
    await AsyncStorage.removeItem(KEY);
  },
};

/** ids are only ever compared, never parsed, so this is enough. */
export function makeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

export type { LocalUser, MemoryItem, Progress, ReviewLog, ScheduledCard };
