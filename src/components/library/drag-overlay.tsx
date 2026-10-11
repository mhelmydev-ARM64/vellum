import { AnimatePresence, motion } from "framer-motion";
import { FileSpreadsheetIcon, FileTextIcon } from "lucide-react";
import { LogoMark } from "@/components/logo";

/** Full-window veil shown while the user is dragging files over the app. */
export function DragOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="drag-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="relative flex flex-col items-center gap-5 rounded-3xl border-2 border-dashed border-brand/60 bg-card/80 px-14 py-12 shadow-[0_0_120px_-30px_color-mix(in_oklab,var(--brand)_85%,transparent)]"
          >
            <motion.div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-3xl bg-brand/10 blur-3xl"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <LogoMark size={64} />
            <div className="text-center">
              <p className="text-lg font-semibold tracking-tight">Drop to import</p>
              <p className="mt-1 text-sm text-muted-foreground">.md notes and .csv flashcard decks</p>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <FileTextIcon className="size-4" />
              <FileSpreadsheetIcon className="size-4" />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
