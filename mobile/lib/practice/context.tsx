/**
 * The app's state, in one place.
 *
 * Everything is held in memory, written through to the device on every
 * change, and read back once at launch. No query client, no network, no
 * loading spinners inside a session. When an account arrives, sign-up copies
 * this document up and sync keeps it level; none of the screens will need to
 * know that happened.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TextScaleProvider } from "../design/text-scale";
import {
  asyncStorageStore,
  emptyData,
  makeId,
  type PracticeData,
  type PracticeStore,
} from "./store";
import { deletePhoto, savePhoto } from "./photos";
import { isDue, localDayKey, newCard, settleCard } from "./scheduler";
import { currentRun, daysPractised, recordPracticeDay } from "./progress";
import { inferPlacement } from "./relations";
import {
  deleteAccountEverywhere,
  linkAccount as linkAccountRemotely,
  pushEverything,
} from "./sync";
import { TEMPLATES } from "./templates";
import type { ItemCategory, LocalUser, MemoryItem, SetupMode } from "./types";

export const DEFAULT_DAILY_GOAL = 10;

export interface AddItemInput {
  category: ItemCategory;
  /** Keyed by the template's field keys. */
  values: Record<string, string>;
  photoBase64?: string | null;
  createdBy?: "self" | "familyMember";
}

interface PracticeApi {
  ready: boolean;
  data: PracticeData;
  user: LocalUser | null;
  items: MemoryItem[];
  /** Items ready to practise right now, new ones included. */
  dueCount: number;
  daysPractised: number;
  currentRun: number;
  beginSetup(setupMode: SetupMode): Promise<LocalUser>;
  updateUser(patch: Partial<LocalUser>): Promise<void>;
  addItem(input: AddItemInput): Promise<MemoryItem>;
  updateItem(itemId: string, patch: Partial<MemoryItem>): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  settle(cardId: string, wasCorrect: boolean): Promise<void>;
  clearEverything(): Promise<void>;
  /** True once this document belongs to an account. */
  backedUpTo: string | null;
  lastPushedAt: string | null;
  /** Called on signing in. Decides which way the data goes, and does it. */
  linkAccount(userId: string): Promise<"pushed" | "pulled">;
  /** Best effort. Never throws, never blocks anything. */
  backUpQuietly(): Promise<void>;
  /** Photos out of the bucket, then the account itself, then the phone. */
  closeAccount(userId: string): Promise<void>;
}

const PracticeContext = createContext<PracticeApi | null>(null);

export function usePractice(): PracticeApi {
  const api = useContext(PracticeContext);
  if (!api) throw new Error("usePractice was called outside PracticeProvider");
  return api;
}

export function PracticeProvider({
  children,
  store = asyncStorageStore,
}: {
  children: ReactNode;
  store?: PracticeStore;
}) {
  const [data, setData] = useState<PracticeData>(emptyData);
  const [ready, setReady] = useState(false);
  const latest = useRef(data);

  useEffect(() => {
    let cancelled = false;
    store
      .load()
      .then((loaded) => {
        if (cancelled) return;
        latest.current = loaded;
        setData(loaded);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const mutate = useCallback(
    (updater: (previous: PracticeData) => PracticeData): PracticeData => {
      const next = updater(latest.current);
      latest.current = next;
      setData(next);
      void store.save(next).catch((error) => {
        console.error(`[practice] could not save: ${String(error)}`);
      });
      return next;
    },
    [store],
  );

  const beginSetup = useCallback(
    async (setupMode: SetupMode) => {
      const user: LocalUser = {
        id: makeId("user"),
        displayName: "",
        createdAt: new Date().toISOString(),
        dailyGoalCards: DEFAULT_DAILY_GOAL,
        reminderTime: null,
        setupMode,
        textScale: 1,
        soundOn: false,
        wants: [],
      };
      mutate((previous) => ({ ...previous, user }));
      return user;
    },
    [mutate],
  );

  const updateUser = useCallback(
    async (patch: Partial<LocalUser>) => {
      mutate((previous) =>
        previous.user ? { ...previous, user: { ...previous.user, ...patch } } : previous,
      );
    },
    [mutate],
  );

  const addItem = useCallback(
    async (input: AddItemInput) => {
      const template = TEMPLATES[input.category];
      const photoKey = input.photoBase64 ? await savePhoto(input.photoBase64) : null;
      const now = new Date();
      const detail = input.values.detail?.trim();

      const item: MemoryItem = {
        id: makeId("item"),
        userId: latest.current.user?.id ?? "local",
        category: input.category,
        prompt: template.buildPrompt(input.values),
        answer: template.buildAnswer(input.values),
        photoKey,
        audioKey: null,
        detail: detail ? detail : null,
        relationship: input.values.relationship?.trim() || null,
        placement:
          input.category === "person"
            ? inferPlacement(input.values.relationship ?? null)
            : null,
        createdAt: now.toISOString(),
        createdBy: input.createdBy ?? "self",
        isActive: true,
      };

      mutate((previous) => ({
        ...previous,
        items: [...previous.items, item],
        cards: [...previous.cards, newCard(makeId("card"), item.id, now)],
      }));

      return item;
    },
    [mutate],
  );

  const updateItem = useCallback(
    async (itemId: string, patch: Partial<MemoryItem>) => {
      mutate((previous) => ({
        ...previous,
        items: previous.items.map((candidate) =>
          candidate.id === itemId ? { ...candidate, ...patch } : candidate,
        ),
      }));
    },
    [mutate],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const item = latest.current.items.find((candidate) => candidate.id === itemId);
      if (item?.photoKey) await deletePhoto(item.photoKey);
      mutate((previous) => ({
        ...previous,
        items: previous.items.filter((candidate) => candidate.id !== itemId),
        cards: previous.cards.filter((card) => card.memoryItemId !== itemId),
      }));
    },
    [mutate],
  );

  /**
   * Called once per item per session, the moment its first attempt resolves,
   * so leaving halfway through keeps everything practised up to that point.
   */
  const settle = useCallback(
    async (cardId: string, wasCorrect: boolean) => {
      const now = new Date();
      const day = localDayKey(now);

      mutate((previous) => {
        const card = previous.cards.find((candidate) => candidate.id === cardId);
        if (!card) return previous;

        const updated = settleCard(card, wasCorrect, now);
        const practisedIds =
          previous.practisedToday.day === day ? previous.practisedToday.cardIds : [];

        return {
          ...previous,
          cards: previous.cards.map((candidate) =>
            candidate.id === cardId ? updated : candidate,
          ),
          logs: [
            ...previous.logs,
            {
              id: makeId("log"),
              scheduledCardId: cardId,
              reviewedAt: now.toISOString(),
              wasCorrect,
              intervalIndexAtReview: card.intervalIndex,
            },
          ],
          practisedToday: {
            day,
            cardIds: practisedIds.includes(cardId) ? practisedIds : [...practisedIds, cardId],
          },
          progress: {
            practiceDays: recordPracticeDay(previous.progress.practiceDays, day),
            cardsPractised: previous.progress.cardsPractised + 1,
          },
        };
      });
    },
    [mutate],
  );

  const linkAccount = useCallback(
    async (userId: string) => {
      const result = await linkAccountRemotely(userId, latest.current);
      latest.current = result.data;
      setData(result.data);
      await store.save(result.data);
      return result.direction;
    },
    [store],
  );

  const backUpQuietly = useCallback(async () => {
    const current = latest.current;
    const userId = current.migratedToUserId;
    if (!userId) return;
    try {
      const syncedPhotoKeys = await pushEverything(userId, current);
      mutate((previous) => ({
        ...previous,
        syncedPhotoKeys,
        lastPushedAt: new Date().toISOString(),
      }));
    } catch (error) {
      // A backup that did not happen is a backup that has not happened yet.
      console.warn(`[practice] backup will retry: ${String(error)}`);
    }
  }, [mutate]);

  const clearEverything = useCallback(async () => {
    for (const item of latest.current.items) {
      if (item.photoKey) await deletePhoto(item.photoKey);
    }
    await store.clear();
    latest.current = emptyData();
    setData(latest.current);
  }, [store]);

  const closeAccount = useCallback(
    async (userId: string) => {
      await deleteAccountEverywhere(userId, latest.current);
      await clearEverything();
    },
    [clearEverything],
  );

  const derived = useMemo(() => {
    const now = new Date();
    const activeItemIds = new Set(
      data.items.filter((item) => item.isActive).map((item) => item.id),
    );
    return {
      dueCount: data.cards.filter(
        (card) => activeItemIds.has(card.memoryItemId) && isDue(card, now),
      ).length,
      daysPractised: daysPractised(data.progress.practiceDays),
      currentRun: currentRun(data.progress.practiceDays, localDayKey(now)),
    };
  }, [data]);

  const api = useMemo<PracticeApi>(
    () => ({
      ready,
      data,
      user: data.user,
      items: data.items,
      dueCount: derived.dueCount,
      daysPractised: derived.daysPractised,
      currentRun: derived.currentRun,
      beginSetup,
      updateUser,
      addItem,
      updateItem,
      removeItem,
      settle,
      clearEverything,
      backedUpTo: data.migratedToUserId,
      lastPushedAt: data.lastPushedAt,
      linkAccount,
      backUpQuietly,
      closeAccount,
    }),
    [
      ready,
      data,
      derived,
      beginSetup,
      updateUser,
      addItem,
      updateItem,
      removeItem,
      settle,
      clearEverything,
      linkAccount,
      backUpQuietly,
      closeAccount,
    ],
  );

  return (
    <PracticeContext.Provider value={api}>
      <TextScaleProvider scale={data.user?.textScale ?? 1}>{children}</TextScaleProvider>
    </PracticeContext.Provider>
  );
}
