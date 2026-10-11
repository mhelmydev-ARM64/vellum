import { useState } from "react";
import { motion } from "framer-motion";
import { ClockIcon, FileTextIcon, LayersIcon, PlayIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Deck, SourceFile } from "@/lib/types";
import type { ProgressSummary } from "@/lib/srs";
import { formatRelative, pluralize } from "@/lib/utils";

interface FileCardProps {
  file: SourceFile;
  deck?: Deck;
  summary?: ProgressSummary;
  dueCount?: number;
  onOpenMarkdown: (fileId: string) => void;
  onOpenDeck: (deckId: string) => void;
  onDelete: (fileId: string) => void;
}

export function FileCard({
  file,
  deck,
  summary,
  dueCount = 0,
  onOpenMarkdown,
  onOpenDeck,
  onDelete,
}: FileCardProps) {
  const [confirming, setConfirming] = useState(false);

  const handlePrimary = () => {
    if (file.kind === "markdown") onOpenMarkdown(file.id);
    else if (deck) onOpenDeck(deck.id);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        whileHover={{ y: -4 }}
        className="group relative"
      >
        <Card
          className={cnCard(file.kind)}
          onClick={handlePrimary}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "space") {
              event.preventDefault();
              handlePrimary();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-gradient-to-br from-white/[0.07] to-transparent">
              {file.kind === "markdown" ? (
                <FileTextIcon className="size-[18px] text-aurora-2" strokeWidth={1.8} />
              ) : (
                <LayersIcon className="size-[18px] text-brand" strokeWidth={1.8} />
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirming(true);
                  }}
                  aria-label={`Delete ${file.name}`}
                >
                  <Trash2Icon className="size-3.5 text-muted-foreground hover:text-hard" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-3 min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground" title={file.name}>
              {file.kind === "markdown" ? file.name : (deck?.name ?? file.name)}
            </h3>
            {file.kind === "markdown" ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {pluralize(file.wordCount ?? 0, "word")} ·{" "}
                {pluralize(Math.max(1, Math.round((file.wordCount ?? 0) / 220)), "min")} read ·{" "}
                {formatRelative(file.addedAt)}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                {pluralize(file.cardCount ?? summary?.total ?? 0, "card")} ·{" "}
                {summary ? `${Math.round(summary.retention * 100)}% studied` : "New"} ·{" "}
                {formatRelative(file.addedAt)}
              </p>
            )}
          </div>

          {file.kind === "csv" && summary && summary.total > 0 ? (
            <div className="mt-4 flex items-center gap-3">
              <Progress
                value={Math.round(((summary.review + summary.mastered + summary.learning) / summary.total) * 100)}
                className="h-1"
              />
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {summary.mastered}/{summary.total} mature
              </span>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between">
            {file.kind === "csv" && dueCount > 0 ? (
              <Badge variant="brand" className="animate-pulse-soft">
                {pluralize(dueCount, "card")} due
              </Badge>
            ) : file.kind === "csv" ? (
              <Badge variant="outline">
                <ClockIcon className="size-3" />
                {summary?.due ? pluralize(summary.due, "card") + " due" : "All scheduled"}
              </Badge>
            ) : (
              <Badge variant="glass">Note</Badge>
            )}

            <Button variant={file.kind === "csv" && dueCount > 0 ? "brand" : "secondary"} size="sm">
              {file.kind === "markdown" ? "Read" : "Review"}
              <PlayIcon className="size-3" />
            </Button>
          </div>
        </Card>
      </motion.div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete “{file.name}”?</DialogTitle>
            <DialogDescription>
              This removes the file{file.kind === "csv" ? ", its deck and every card" : ""} from this device. Your
              original file on disk is not touched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirming(false);
                onDelete(file.id);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function cnCard(kind: SourceFile["kind"]) {
  return [
    "relative flex cursor-pointer flex-col p-5 text-left outline-none transition-[border-color,box-shadow] duration-300",
    "hover:border-brand/40 hover:shadow-[0_28px_70px_-34px_color-mix(in_oklab,var(--brand)_75%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.05)]",
    kind === "csv" ? "bg-card/80" : "bg-card/70",
  ].join(" ");
}
