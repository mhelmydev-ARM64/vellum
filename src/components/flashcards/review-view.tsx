import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { Flashcard } from "@/components/flashcards/flashcard";
import { RatingBar } from "@/components/flashcards/rating-bar";
import { CaughtUp, SessionComplete } from "@/components/flashcards/session-complete";
import { Button } from "@/components/ui/button";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useNow } from "@/hooks/use-now";
import { buildQueue } from "@/lib/srs";
import { playChime, playFlip } from "@/lib/sound";
import { useLibrary } from "@/store/library";
import type { Card, Rating, SessionStats } from "@/lib/types";

const EXIT_MS = 260;

interface ReviewViewProps {
  deckId?: string;
  onExit: () => void;
}

/**
 * Review session orchestrator: snapshots the due queue on entry, runs the
 * 3D card, applies SRS ratings, and re-queues lapsed cards once so "review
 * today" is honoured inside the same session.
 */
export function ReviewView({ deckId, onExit }: ReviewViewProps) {
  const { cards, meta, settings, deckById, cardsForDeck, rateCard } = useLibrary();

  /* Snapshot the queue once per session — later card mutations must not rebuild it.
     A state initializer is safe because App remounts this view per deck via the view key. */
  const [queue, setQueue] = useState<Card[]>(() => {
    const pool = deckId ? cardsForDeck(deckId) : cards;
    return buildQueue(pool, Date.now(), {
      dailyNewLimit: settings.dailyNewLimit,
      newTodayCount: meta.newTodayCount,
      sessionLimit: settings.sessionLimit,
    }).queue;
  });
  const [cursor, setCursor] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [exitRating, setExitRating] = useState<Rating | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [startedAt] = useState(() => Date.now());
  const now = useNow();

  const statsRef = useRef({ reviewed: 0, hard: 0, good: 0, easy: 0 });
  const requeuedRef = useRef(new Set<string>());
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const current = queue[cursor];
  const finished = queue.length > 0 && cursor >= queue.length;
  const caughtUp = queue.length === 0;
  const sessionActive = !finished && !caughtUp;
  const deckName = deckId ? (deckById(deckId)?.name ?? "Deck") : "All decks";
  const progress = queue.length ? Math.min(1, cursor / queue.length) : 0;

  const flip = useCallback(() => {
    if (exiting || !current) return;
    setFlipped((value) => !value);
    if (settings.flipSound) playFlip();
  }, [current, exiting, settings.flipSound]);

  const advance = useCallback(
    (rating: Rating, card: Card) => {
      setFlipped(false);
      setShowHint(false);
      setExitRating(null);
      setExiting(false);

      let requeued = false;
      if (rating === "hard" && !requeuedRef.current.has(card.id)) {
        requeuedRef.current.add(card.id);
        requeued = true;
      }
      if (requeued) setQueue((prev) => [...prev, card]);
      setCursor((prev) => prev + 1);

      const finalLength = requeued ? queue.length + 1 : queue.length;
      if (cursor + 1 >= finalLength) {
        setStats({ ...statsRef.current, startedAt, endedAt: Date.now() });
        if (settings.flipSound) playChime();
      }
    },
    [cursor, queue.length, settings.flipSound, startedAt],
  );

  const rate = useCallback(
    (rating: Rating) => {
      if (!flipped || exiting || !current) return;
      setExitRating(rating);
      setExiting(true);

      statsRef.current.reviewed += 1;
      statsRef.current[rating] += 1;

      const card = current;
      void rateCard(card, rating);
      timeoutRef.current = window.setTimeout(() => advance(rating, card), EXIT_MS);
    },
    [advance, current, exiting, flipped, rateCard],
  );

  useHotkeys(
    {
      space: flip,
      escape: onExit,
      h: () => setShowHint((value) => !value),
      1: () => rate("hard"),
      2: () => rate("good"),
      3: () => rate("easy"),
    },
    sessionActive,
  );

  if (finished) {
    return (
      <div className="h-[calc(100dvh-3.5rem)] overflow-y-auto">
        {stats ? (
          <SessionComplete stats={stats} onDone={onExit} />
        ) : (
          <div className="grid h-full place-items-center" aria-busy="true" />
        )}
      </div>
    );
  }

  if (caughtUp) {
    return (
      <div className="h-[calc(100dvh-3.5rem)] overflow-y-auto">
        <CaughtUp
          nextDueLabel={describeNextDue(cards, now)}
          onDone={onExit}
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-wide text-foreground">{deckName}</h1>
          <p className="text-[11px] text-muted-foreground">
            {Math.min(cursor + 1, queue.length)} / {queue.length} · Space flips · 1 2 3 rate
          </p>
        </div>
        <Button variant="glass" size="icon-sm" onClick={onExit} aria-label="Exit session">
          <XIcon className="size-4" />
        </Button>
      </header>

      <div className="mx-auto mt-3 h-1 w-full max-w-[min(92vw,680px)] overflow-hidden rounded-full bg-border/40">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand via-good to-easy"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 26 }}
        />
      </div>

      <div className="grid flex-1 place-items-center px-4 py-4 sm:px-8">
        <AnimatePresence mode="popLayout" initial={false}>
          {current ? (
            <Flashcard
              key={cursor}
              card={current}
              deckName={deckName}
              index={Math.min(cursor + 1, queue.length)}
              total={queue.length}
              flipped={flipped}
              showHint={showHint}
              onFlip={flip}
              onToggleHint={() => setShowHint((value) => !value)}
              exitRating={exitRating}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex justify-center px-4 pb-6 sm:pb-8">
        <RatingBar enabled={flipped && !exiting} onRate={rate} />
      </div>
    </div>
  );
}

/** Human label for the soonest upcoming review, used by the caught-up screen. */
function describeNextDue(cards: Card[], now: number): string | undefined {
  const upcoming = cards
    .filter((card) => card.nextReview > now)
    .sort((a, b) => a.nextReview - b.nextReview);
  const next = upcoming[0];
  if (!next) return undefined;
  return `card is due ${formatWhen(next.nextReview, now)}`;
}

function formatWhen(ts: number, now: number) {
  const diff = ts - now;
  const days = diff / 86_400_000;
  if (days >= 1) return `in ${Math.round(days)} day${days >= 1.5 ? "s" : ""}`;
  const hours = diff / 3_600_000;
  if (hours >= 1) return `in about ${Math.round(hours)}h`;
  return "later today";
}
