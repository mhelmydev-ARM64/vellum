import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClockIcon, LayersIcon, LibraryIcon } from "lucide-react";
import { Dropzone } from "@/components/library/dropzone";
import { EmptyState } from "@/components/library/empty-state";
import { FileCard } from "@/components/library/file-card";
import { useImport } from "@/hooks/use-import";
import { useNow } from "@/hooks/use-now";
import { summarize } from "@/lib/srs";
import { useLibrary } from "@/store/library";

interface LibraryViewProps {
  onOpenMarkdown: (fileId: string) => void;
  onOpenDeck: (deckId: string) => void;
}

export function LibraryView({ onOpenMarkdown, onOpenDeck }: LibraryViewProps) {
  const { files, decks, cards, cardsForDeck, meta, settings, deleteFile, seedSamples } = useLibrary();
  const { busy, importWithFeedback } = useImport();

  const now = useNow();
  const dueCount = useMemo(
    () => cards.filter((card) => card.nextReview > 0 && card.nextReview <= now).length,
    [cards, now],
  );

  const noteCount = files.filter((file) => file.kind === "markdown").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
        className="pt-10 pb-8 sm:pt-14"
      >
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <span className="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted-foreground">
              <span className="size-1.5 rounded-full bg-easy animate-pulse-soft" />
              Offline-first · stored on this device
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-[44px]">
              <span className="text-gradient">Study quietly,</span>
              <br />
              remember everything.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Markdown notes you actually enjoy reading, and flashcards scheduled so they come back
              exactly when you are about to forget them.
            </p>
          </div>

          <div className="grid w-full shrink-0 grid-cols-3 gap-2 sm:w-auto sm:gap-3">
            <StatTile icon={<LibraryIcon className="size-3.5" />} value={noteCount} label="Notes" />
            <StatTile icon={<LayersIcon className="size-3.5" />} value={decks.length} label="Decks" />
            <StatTile icon={<ClockIcon className="size-3.5" />} value={dueCount} label="Due now" accent />
          </div>
        </div>
      </motion.section>

      <Dropzone onFiles={(incoming) => void importWithFeedback(incoming)} busy={busy} />

      {files.length === 0 && !busy ? (
        <EmptyState onSeed={() => void seedSamples()} />
      ) : (
        <motion.section layout className="mt-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Your files
            </h2>
            <span className="text-xs text-muted-foreground">
              {settings.dailyNewLimit - meta.newTodayCount > 0
                ? `${settings.dailyNewLimit - meta.newTodayCount} new cards left today`
                : "Daily new-card limit reached"}
            </span>
          </div>

          <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {files.map((file) => {
                const deck = decks.find((entry) => entry.fileId === file.id);
                const deckCards = deck ? cardsForDeck(deck.id) : [];
                const summary = deckCards.length ? summarize(deckCards) : undefined;
                const due = deckCards.filter(
                  (card) => card.nextReview > 0 && card.nextReview <= now,
                ).length;
                return (
                  <FileCard
                    key={file.id}
                    file={file}
                    deck={deck}
                    summary={summary}
                    dueCount={due}
                    onOpenMarkdown={onOpenMarkdown}
                    onOpenDeck={onOpenDeck}
                    onDelete={(id) => void deleteFile(id)}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        </motion.section>
      )}
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
  accent = false,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="glass hairline flex flex-col gap-1 rounded-xl px-3.5 py-2.5 sm:px-4">
      <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
        {icon}
        {label}
      </span>
      <span
        className={
          accent && value > 0
            ? "text-xl font-semibold tabular-nums text-brand"
            : "text-xl font-semibold tabular-nums text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
