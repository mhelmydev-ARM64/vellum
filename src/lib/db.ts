import localforage from "localforage";
import type { AppMeta, AppSettings, Card, Deck, SourceFile } from "./types";

const DB_NAME = "vellum";

function openStore(storeName: string) {
  return localforage.createInstance({
    name: DB_NAME,
    storeName,
    version: 1,
    driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
    description: "Offline study library",
  });
}

export const filesStore = openStore("files");
export const decksStore = openStore("decks");
export const cardsStore = openStore("cards");
export const metaStore = openStore("meta");

async function getAll<T>(store: LocalForage): Promise<T[]> {
  const out: T[] = [];
  await store.iterate<T, void>((value) => {
    out.push(value);
  });
  return out;
}

/* ------------------------------------------------------------------ files */

export async function listFiles(): Promise<SourceFile[]> {
  const files = await getAll<SourceFile>(filesStore);
  return files.sort((a, b) => b.addedAt - a.addedAt);
}

export async function getFile(id: string): Promise<SourceFile | null> {
  return (await filesStore.getItem<SourceFile>(id)) ?? null;
}

export async function putFile(file: SourceFile): Promise<SourceFile> {
  await filesStore.setItem(file.id, file);
  return file;
}

export async function removeFile(id: string) {
  await filesStore.removeItem(id);
}

/* ------------------------------------------------------------------ decks */

export async function listDecks(): Promise<Deck[]> {
  const decks = await getAll<Deck>(decksStore);
  return decks.sort((a, b) => b.createdAt - a.createdAt);
}

export async function putDeck(deck: Deck) {
  await decksStore.setItem(deck.id, deck);
}

export async function removeDeck(id: string) {
  await decksStore.removeItem(id);
}

/* ------------------------------------------------------------------ cards */

export async function listCards(): Promise<Card[]> {
  return getAll<Card>(cardsStore);
}

export async function putCard(card: Card) {
  await cardsStore.setItem(card.id, card);
}

export async function putCards(cards: Card[]) {
  await Promise.all(cards.map((card) => cardsStore.setItem(card.id, card)));
}

export async function removeCards(ids: string[]) {
  await Promise.all(ids.map((id) => cardsStore.removeItem(id)));
}

/** Wipe scheduling state but keep the imported cards. */
export async function resetProgress(cards: Card[]) {
  await Promise.all(
    cards.map((card) =>
      cardsStore.setItem(card.id, {
        ...card,
        reps: 0,
        streak: 0,
        interval: 0,
        nextReview: 0,
        lastReview: 0,
        lapses: 0,
      }),
    ),
  );
}

/* ------------------------------------------------------------------- meta */

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  dailyNewLimit: 20,
  sessionLimit: 60,
  flipSound: true,
};

export const DEFAULT_META: AppMeta = {
  seeded: false,
  newTodayCount: 0,
  newTodayDate: "",
  totalReviews: 0,
  reviewLog: [],
  installedAt: Date.now(),
};

export async function getSettings(): Promise<AppSettings> {
  return { ...DEFAULT_SETTINGS, ...((await metaStore.getItem<Partial<AppSettings>>("settings")) ?? {}) };
}

export async function putSettings(patch: Partial<AppSettings>) {
  const next = { ...(await getSettings()), ...patch };
  await metaStore.setItem("settings", next);
  return next;
}

export async function getMeta(): Promise<AppMeta> {
  return { ...DEFAULT_META, ...((await metaStore.getItem<Partial<AppMeta>>("meta")) ?? {}) };
}

export async function putMeta(patch: Partial<AppMeta>) {
  const next = { ...(await getMeta()), ...patch };
  await metaStore.setItem("meta", next);
  return next;
}

export async function wipeEverything() {
  await Promise.all([
    filesStore.clear(),
    decksStore.clear(),
    cardsStore.clear(),
    metaStore.removeItem("meta"),
  ]);
}
