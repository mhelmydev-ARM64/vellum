import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  DEFAULT_META,
  DEFAULT_SETTINGS,
  getMeta,
  getSettings,
  listCards,
  listDecks,
  listFiles,
  putCard,
  putCards,
  putDeck,
  putFile,
  putMeta,
  putSettings,
  removeCards,
  removeDeck,
  removeFile,
  resetProgress as resetStoredProgress,
  wipeEverything,
} from "@/lib/db";
import { cardId, deckIdFor, parseCsv } from "@/lib/csv";
import { createCard, mergeCards, schedule } from "@/lib/srs";
import { countWords } from "@/lib/analyze";
import { SAMPLE_CSV, SAMPLE_CSV_NAME, SAMPLE_MARKDOWN, SAMPLE_MARKDOWN_NAME } from "@/lib/sample";
import type { AppMeta, AppSettings, Card, Deck, FileKind, Rating, SourceFile } from "@/lib/types";
import { todayKey, uid } from "@/lib/utils";

export interface ImportResult {
  name: string;
  kind: FileKind | "unsupported";
  cards?: number;
  message?: string;
}

interface LibraryValue {
  ready: boolean;
  files: SourceFile[];
  decks: Deck[];
  cards: Card[];
  meta: AppMeta;
  settings: AppSettings;
  fileById: (id: string) => SourceFile | undefined;
  deckById: (id: string) => Deck | undefined;
  deckForFile: (fileId: string) => Deck | undefined;
  cardsForDeck: (deckId: string) => Card[];
  importFiles: (files: File[]) => Promise<ImportResult[]>;
  importText: (name: string, content: string) => Promise<ImportResult>;
  deleteFile: (id: string) => Promise<void>;
  rateCard: (card: Card, rating: Rating) => Promise<Card>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  resetProgress: () => Promise<void>;
  wipeLibrary: () => Promise<void>;
  seedSamples: () => Promise<void>;
}

const LibraryContext = createContext<LibraryValue | null>(null);

const MARKDOWN_EXT = ["md", "markdown", "mdown", "mkd", "mdx"];
const CSV_EXT = ["csv", "tsv", "txt"];

function kindFromName(name: string): FileKind | "unsupported" {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (MARKDOWN_EXT.includes(ext)) return "markdown";
  if (CSV_EXT.includes(ext)) return "csv";
  return "unsupported";
}

interface SeedEntry {
  id: string;
  file: SourceFile;
  deck?: Deck;
  cards: Card[];
}

/** Turns raw text into stored records. Shared by user imports and first-run seeding. */
async function materialise(name: string, content: string, at: number): Promise<SeedEntry> {
  const kind = kindFromName(name);
  const id = uid("file");
  const size = new Blob([content]).size;

  if (kind === "markdown") {
    return {
      id,
      cards: [],
      file: {
        id,
        name,
        kind,
        content,
        size,
        addedAt: at,
        updatedAt: at,
        wordCount: countWords(content),
      },
    };
  }

  if (kind === "unsupported") {
    return {
      id,
      cards: [],
      file: { id, name, kind: "markdown", content, size, addedAt: at, updatedAt: at },
    };
  }

  const parsed = parseCsv(content, name);
  const deckId = deckIdFor(id);
  const cards = parsed.cards.map((raw, index) =>
    createCard({
      id: cardId(deckId, index, raw.front),
      deckId,
      front: raw.front,
      back: raw.back,
      hint: raw.hint,
      tags: raw.tags,
      createdAt: at + index,
    }),
  );

  const deck: Deck = {
    id: deckId,
    fileId: id,
    name: parsed.name,
    cardCount: parsed.cards.length,
    createdAt: at,
  };

  return {
    id,
    deck,
    cards,
    file: {
      id,
      name,
      kind,
      content,
      size,
      addedAt: at,
      updatedAt: at,
      cardCount: parsed.cards.length,
    },
  };
}

function describe(entry: SeedEntry, skipped = 0): ImportResult {
  if (entry.file.kind === "markdown") {
    return {
      name: entry.file.name,
      kind: "markdown",
      message: `${entry.file.wordCount ?? 0} words ready to read`,
    };
  }
  const count = entry.cards.length;
  return {
    name: entry.file.name,
    kind: "csv",
    cards: count,
    message: count
      ? `${count} cards imported${skipped ? ` · ${skipped} rows skipped` : ""}`
      : "No Question/Answer rows found in this CSV",
  };
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [meta, setMeta] = useState<AppMeta>(DEFAULT_META);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const persist = useCallback(async (entries: SeedEntry[]) => {
    for (const entry of entries) {
      await putFile(entry.file);
      if (entry.deck) await putDeck(entry.deck);
      if (entry.cards.length) await putCards(entry.cards);
    }
    setFiles((prev) => [...entries.map((entry) => entry.file), ...prev]);
    setDecks((prev) => [...entries.map((entry) => entry.deck).filter(Boolean), ...prev] as Deck[]);
    setCards((prev) => mergeCards(prev, entries.flatMap((entry) => entry.cards)));
  }, []);

  const importText = useCallback(
    async (name: string, content: string): Promise<ImportResult> => {
      const kind = kindFromName(name);
      if (kind === "unsupported") {
        return { name, kind, message: "Only .md and .csv files are supported" };
      }
      const entry = await materialise(name, content, Date.now());
      if (entry.file.kind === "csv" && !entry.cards.length) return describe(entry);
      await persist([entry]);
      return describe(entry);
    },
    [persist],
  );

  const importFiles = useCallback(
    async (incoming: File[]) => {
      const results: ImportResult[] = [];
      for (const file of incoming) {
        const text = await file.text();
        results.push(await importText(file.name, text));
      }
      return results;
    },
    [importText],
  );

  /* --------------------------------------------------- hydrate + seed */
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [storedFiles, storedDecks, storedCards, storedMeta, storedSettings] = await Promise.all([
        listFiles(),
        listDecks(),
        listCards(),
        getMeta(),
        getSettings(),
      ]);
      if (cancelled) return;

      if (storedSettings) setSettings(storedSettings);

      if (storedFiles.length || storedMeta.seeded) {
        setFiles(storedFiles);
        setDecks(storedDecks);
        setCards(storedCards);
        /* The daily new-card count resets lazily inside rateCard; normalise it
           here too so the counter is correct on the first visit of a new day. */
        const fresh =
          storedMeta.newTodayDate === todayKey()
            ? storedMeta
            : await putMeta({ newTodayCount: 0, newTodayDate: todayKey() });
        setMeta(fresh);
        setReady(true);
        return;
      }

      const now = Date.now();
      const samples = [
        await materialise(SAMPLE_MARKDOWN_NAME, SAMPLE_MARKDOWN, now),
        await materialise(SAMPLE_CSV_NAME, SAMPLE_CSV, now + 1),
      ];
      if (cancelled) return;
      for (const entry of samples) {
        await putFile(entry.file);
        if (entry.deck) await putDeck(entry.deck);
        if (entry.cards.length) await putCards(entry.cards);
      }
      const seededMeta = await putMeta({ seeded: true });
      if (cancelled) return;

      setFiles(samples.map((entry) => entry.file));
      setDecks(samples.map((entry) => entry.deck).filter((deck): deck is Deck => Boolean(deck)));
      setCards(samples.flatMap((entry) => entry.cards));
      setMeta(seededMeta);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------------ theme */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
    root.style.colorScheme = settings.theme;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = settings.theme === "dark" ? "#050507" : "#fbfbfd";
  }, [settings.theme]);

  /* ---------------------------------------------------------- actions */
  const deleteFile = useCallback(
    async (id: string) => {
      const target = files.find((file) => file.id === id);
      const deck = decks.find((entry) => entry.fileId === id);
      const orphaned = cards.filter((card) => card.deckId === deck?.id).map((card) => card.id);

      await removeFile(id);
      if (deck) {
        await removeDeck(deck.id);
        await removeCards(orphaned);
      }

      setFiles((prev) => prev.filter((file) => file.id !== id));
      setDecks((prev) => prev.filter((entry) => entry.fileId !== id));
      setCards((prev) => prev.filter((card) => card.deckId !== deck?.id));
      toast.success(`${target?.name ?? "File"} removed`, { description: "Deleted from this device" });
    },
    [cards, decks, files],
  );

  const rateCard = useCallback(
    async (card: Card, rating: Rating) => {
      const now = Date.now();
      const wasNew = card.reps === 0;
      const next = schedule(card, rating, now);

      setCards((prev) => prev.map((entry) => (entry.id === next.id ? next : entry)));
      await putCard(next);

      const day = todayKey(new Date(now));
      const rollover = meta.newTodayDate !== day;
      const updated = await putMeta({
        totalReviews: meta.totalReviews + 1,
        newTodayDate: day,
        newTodayCount: (rollover ? 0 : meta.newTodayCount) + (wasNew ? 1 : 0),
        reviewLog: [...meta.reviewLog, { cardId: next.id, rating, at: now, interval: next.interval }].slice(-600),
      });
      setMeta(updated);
      return next;
    },
    [meta],
  );

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    await putSettings(patch);
  }, []);

  const resetProgress = useCallback(async () => {
    await resetStoredProgress(cards);
    setCards((prev) =>
      prev.map((card) => ({
        ...card,
        reps: 0,
        streak: 0,
        interval: 0,
        nextReview: 0,
        lastReview: 0,
        lapses: 0,
      })),
    );
    setMeta(await putMeta({ totalReviews: 0, reviewLog: [], newTodayCount: 0, newTodayDate: todayKey() }));
    toast.success("Progress reset", { description: "Every card is new again" });
  }, [cards]);

  const wipeLibrary = useCallback(async () => {
    await wipeEverything();
    setFiles([]);
    setDecks([]);
    setCards([]);
    setMeta({ ...DEFAULT_META, seeded: true });
    toast.success("Library cleared", { description: "All notes, decks and progress deleted" });
  }, []);

  const seedSamples = useCallback(async () => {
    const now = Date.now();
    const samples = [
      await materialise(SAMPLE_MARKDOWN_NAME, SAMPLE_MARKDOWN, now),
      await materialise(SAMPLE_CSV_NAME, SAMPLE_CSV, now + 1),
    ];
    await persist(samples);
    setMeta(await putMeta({ seeded: true }));
    toast.success("Sample library restored", { description: "1 note · 14 flashcards" });
  }, [persist]);

  /* -------------------------------------------------------- selectors */
  const fileById = useCallback((id: string) => files.find((file) => file.id === id), [files]);
  const deckById = useCallback((id: string) => decks.find((deck) => deck.id === id), [decks]);
  const deckForFile = useCallback((fileId: string) => decks.find((deck) => deck.fileId === fileId), [decks]);

  const cardsByDeck = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const card of cards) {
      const list = map.get(card.deckId);
      if (list) list.push(card);
      else map.set(card.deckId, [card]);
    }
    return map;
  }, [cards]);

  const cardsForDeck = useCallback((deckId: string) => cardsByDeck.get(deckId) ?? [], [cardsByDeck]);

  const value = useMemo<LibraryValue>(
    () => ({
      ready,
      files,
      decks,
      cards,
      meta,
      settings,
      fileById,
      deckById,
      deckForFile,
      cardsForDeck,
      importFiles,
      importText,
      deleteFile,
      rateCard,
      updateSettings,
      resetProgress,
      wipeLibrary,
      seedSamples,
    }),
    [
      ready,
      files,
      decks,
      cards,
      meta,
      settings,
      fileById,
      deckById,
      deckForFile,
      cardsForDeck,
      importFiles,
      importText,
      deleteFile,
      rateCard,
      updateSettings,
      resetProgress,
      wipeLibrary,
      seedSamples,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

// Hook and provider live together so the context contract stays in one file.
// eslint-disable-next-line react-refresh/only-export-components
export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return ctx;
}
