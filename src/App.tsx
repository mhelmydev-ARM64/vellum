import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AmbientBackground } from "@/components/ambient-background";
import { ReviewView } from "@/components/flashcards/review-view";
import { InsightsView } from "@/components/insights/insights-view";
import { DragOverlay } from "@/components/library/drag-overlay";
import { LibraryView } from "@/components/library/library-view";
import { ReaderView } from "@/components/reader/reader-view";
import { LogoMark } from "@/components/logo";
import { NavBar } from "@/components/nav-bar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFileDrop } from "@/hooks/use-file-drop";
import { useImport } from "@/hooks/use-import";
import { useNow } from "@/hooks/use-now";
import { useLibrary } from "@/store/library";
import type { View } from "@/lib/types";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function App() {
  const { ready, cards, fileById } = useLibrary();
  const [view, setView] = useState<View>({ name: "library" });
  const { busy, importWithFeedback } = useImport();

  const dragging = useFileDrop((files) => {
    setView((current) => (current.name === "library" ? current : { name: "library" }));
    void importWithFeedback(files);
  });

  const navigate = useCallback((next: View) => {
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  const now = useNow();
  const dueCount = useMemo(
    () => cards.filter((card) => card.nextReview > 0 && card.nextReview <= now).length,
    [cards, now],
  );

  const readerFile = view.name === "reader" ? fileById(view.fileId) : undefined;

  const viewKey =
    view.name === "reader"
      ? `reader:${view.fileId}`
      : view.name === "review"
        ? `review:${view.deckId ?? "all"}`
        : view.name;

  if (!ready) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <LogoMark size={56} />
          </motion.div>
          <span className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
            Vellum
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div className="relative min-h-dvh">
        <AmbientBackground />
        <NavBar view={view} dueCount={dueCount} totalCards={cards.length} onNavigate={navigate} />

        <main className="relative z-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={viewKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: EASE }}
            >
              {view.name === "library" || (view.name === "reader" && !readerFile) ? (
                <LibraryView
                  onOpenMarkdown={(fileId) => navigate({ name: "reader", fileId })}
                  onOpenDeck={(deckId) => navigate({ name: "review", deckId })}
                />
              ) : view.name === "reader" && readerFile ? (
                <ReaderView file={readerFile} onBack={() => navigate({ name: "library" })} />
              ) : view.name === "review" ? (
                <ReviewView deckId={view.deckId} onExit={() => navigate({ name: "library" })} />
              ) : (
                <InsightsView onStartReview={(deckId) => navigate({ name: "review", deckId })} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <DragOverlay active={dragging} />
        {busy ? <span className="sr-only" role="status">Importing files</span> : null}
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
