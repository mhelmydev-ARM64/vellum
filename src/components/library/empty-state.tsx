import { motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function EmptyState({ onSeed }: { onSeed: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.05 }}
      className="flex flex-col items-center gap-6 py-10 text-center"
    >
      <div className="relative">
        <motion.div
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-brand/25 blur-3xl"
          animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.12, 1] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <LogoMark size={72} />
      </div>

      <div className="max-w-sm space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Nothing here yet</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Drop a file in the zone above — or start with a guided sample: one note and one flashcard
          deck to explore everything Vellum does.
        </p>
      </div>

      <Button variant="glass" size="lg" onClick={onSeed}>
        <SparklesIcon className="size-4" />
        Load sample library
      </Button>
    </motion.div>
  );
}
