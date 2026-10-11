import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileSpreadsheetIcon, FileTextIcon, SparklesIcon, UploadCloudIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  busy?: boolean;
}

/** The library's hero upload target — click, or drop .md / .csv anywhere. */
export function Dropzone({ onFiles, busy = false }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const accept = ".md,.markdown,.mdown,.mkd,.mdx,.csv,.tsv,.txt";

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    // Keep the drop away from the window-level handler so files import exactly once.
    event.stopPropagation();
    setHover(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length) onFiles(files);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length) onFiles(files);
    event.target.value = "";
  };

  return (
    <motion.div
      layout
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "space") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      whileHover={{ scale: 1.006 }}
      whileTap={{ scale: 0.994 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative isolate w-full cursor-pointer overflow-hidden rounded-2xl p-[1px] outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.09] via-white/[0.03] to-transparent",
          "transition-opacity duration-500",
          hover ? "opacity-100" : "opacity-60",
        )}
      />

      <div
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-12 text-center transition-colors duration-300",
          "border border-dashed bg-card/50 backdrop-blur-xl",
          hover
            ? "border-brand/60 bg-brand-soft/40 shadow-[0_0_80px_-20px_color-mix(in_oklab,var(--brand)_80%,transparent)]"
            : "border-border/90",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {busy ? (
            <motion.div
              key="busy"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-3"
            >
              <span className="size-11 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
              <p className="text-sm text-muted-foreground">Importing to your device…</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <motion.div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full bg-brand/40 blur-2xl"
                  animate={{ opacity: hover ? [0.5, 0.9, 0.5] : [0.25, 0.4, 0.25], scale: hover ? 1.15 : 1 }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="glass hairline flex size-14 items-center justify-center rounded-2xl">
                  <UploadCloudIcon className="size-6 text-brand-foreground text-foreground/80" strokeWidth={1.8} />
                </div>
                <motion.div
                  aria-hidden
                  className="absolute -right-3 -top-2 text-brand"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <SparklesIcon className="size-3.5" />
                </motion.div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[15px] font-medium tracking-tight text-foreground">
                  {hover ? "Release to import" : "Drop notes or flashcards here"}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  or <span className="text-brand underline decoration-brand/40 underline-offset-4">browse files</span> —
                  everything stays on this device
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/40 px-2.5 py-1">
                  <FileTextIcon className="size-3 text-aurora-2" /> .md notes
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/40 px-2.5 py-1">
                  <FileSpreadsheetIcon className="size-3 text-easy" /> .csv decks
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={handleChange}
        tabIndex={-1}
      />
    </motion.div>
  );
}
