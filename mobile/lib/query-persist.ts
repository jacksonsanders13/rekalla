import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Query } from "@tanstack/react-query";

/**
 * Keeps the calendar readable with no signal.
 *
 * A reminders app that shows an empty screen on a train is not much use, and
 * the people using this are often out of the house when they most want to
 * check what is coming up. Reminder queries are written to the device so the
 * last known calendar is there instantly, then refreshed when the network
 * comes back.
 */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "rekalla:query-cache",
});

/** A week. Long enough to cover a holiday without signal. */
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

/**
 * Only the calendar is worth keeping on disk. Chat history is fetched fresh
 * from the server, and the assistant's answers are not cached at all: a
 * stale answer about someone's week would be worse than no answer.
 */
export function shouldPersistQuery(query: Query): boolean {
  const root = query.queryKey[0];
  return root === "reminders" || root === "reminder";
}

/**
 * Wipe the stored cache. Called on sign-out so the next person to use the
 * phone never sees the previous account's appointments.
 */
export async function clearPersistedQueries(): Promise<void> {
  try {
    await queryPersister.removeClient();
  } catch {
    // Nothing usable to remove; signing out must not fail on this.
  }
}
