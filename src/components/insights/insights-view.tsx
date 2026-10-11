import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ActivityIcon,
  AlarmClockCheckIcon,
  AwardIcon,
  LayersIcon,
  PlayIcon,
  RotateCcwIcon,
  Trash2Icon,
  Volume2Icon,
  VolumeXIcon,
  WifiIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { usePwa } from "@/hooks/use-pwa";
import { forecast, summarize } from "@/lib/srs";
import { useLibrary } from "@/store/library";
import { pluralize } from "@/lib/utils";
import type { Rating } from "@/lib/types";

interface InsightsViewProps {
  onStartReview: (deckId?: string) => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function InsightsView({ onStartReview }: InsightsViewProps) {
  const { cards, decks, meta, settings, cardsForDeck, updateSettings, resetProgress, wipeLibrary } = useLibrary();
  const { online, installed } = usePwa();

  const summary = useMemo(() => summarize(cards), [cards]);
  const buckets = useMemo(() => forecast(cards), [cards]);
  const distribution = useMemo(() => {
    const counts = { hard: 0, good: 0, easy: 0 } as Record<Rating, number>;
    for (const entry of meta.reviewLog) counts[entry.rating] += 1;
    const total = counts.hard + counts.good + counts.easy;
    return { counts, total };
  }, [meta.reviewLog]);

  const deckRows = useMemo(
    () => decks.map((deck) => ({ deck, deckSummary: summarize(cardsForDeck(deck.id)) })),
    [decks, cardsForDeck],
  );

  const maxBucket = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const newLeft = Math.max(0, settings.dailyNewLimit - meta.newTodayCount);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 pt-8 pb-16 sm:px-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Retention, forecast and deck health — all computed on this device.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total cards" value={summary.total} icon={LayersIcon} sub={`${summary.studied} studied`} />
        <StatTile
          label="Due now"
          value={summary.due}
          icon={AlarmClockCheckIcon}
          sub={`${newLeft} new left today`}
          highlight={summary.due > 0}
        />
        <StatTile
          label="Mastered"
          value={summary.mastered}
          icon={AwardIcon}
          sub={`${Math.round(summary.retention * 100)}% retention`}
        />
        <StatTile label="Reviews" value={meta.totalReviews} icon={ActivityIcon} sub="all time" />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Forecast</CardTitle>
            <CardDescription>Cards arriving over the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-2 sm:gap-3">
              {buckets.map((bucket, index) => (
                <div key={bucket.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                    {bucket.count || ""}
                  </span>
                  <motion.div
                    initial={{ height: 4 }}
                    animate={{ height: `${Math.max(4, (bucket.count / maxBucket) * 100)}%` }}
                    transition={{ duration: 0.7, ease: EASE, delay: index * 0.05 }}
                    className={
                      index === 0
                        ? "w-full rounded-lg bg-gradient-to-t from-brand/60 to-brand"
                        : "w-full rounded-lg bg-gradient-to-t from-muted/40 to-muted/70"
                    }
                    style={index === 0 ? { boxShadow: "0 0 28px -6px var(--color-brand)" } : undefined}
                  />
                  <span
                    className={`text-[10px] font-medium tracking-wide ${
                      index === 0 ? "text-foreground" : "text-muted-foreground/70"
                    }`}
                  >
                    {bucket.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Answer quality</CardTitle>
            <CardDescription>Across the last {pluralize(distribution.total, "review")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {distribution.total === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Rate a few cards and the mix shows up here.
              </p>
            ) : (
              <>
                <div className="flex h-2.5 overflow-hidden rounded-full">
                  <SegmentBar value={distribution.counts.hard} total={distribution.total} tone="hard" />
                  <SegmentBar value={distribution.counts.good} total={distribution.total} tone="good" />
                  <SegmentBar value={distribution.counts.easy} total={distribution.total} tone="easy" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <RatingCount label="Hard" tone="hard" value={distribution.counts.hard} />
                  <RatingCount label="Good" tone="good" value={distribution.counts.good} />
                  <RatingCount label="Easy" tone="easy" value={distribution.counts.easy} />
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {settings.flipSound ? <Volume2Icon className="size-4" /> : <VolumeXIcon className="size-4" />}
                Flip sound
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void updateSettings({ flipSound: !settings.flipSound })}
              >
                {settings.flipSound ? "On" : "Off"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decks</CardTitle>
          <CardDescription>{pluralize(decks.length, "deck")} in the library</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {deckRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Import a CSV from the library to start tracking decks here.
            </p>
          ) : (
            deckRows.map(({ deck, deckSummary }) => (
              <div
                key={deck.id}
                className="glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border/60 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{deck.name}</p>
                    {deckSummary.due > 0 ? (
                      <Badge variant="warning">
                        {pluralize(deckSummary.due, "card")} due
                      </Badge>
                    ) : (
                      <Badge variant="success">Scheduled</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={percent(deckSummary.studied, deckSummary.total)} className="h-1.5 flex-1" />
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {deckSummary.studied}/{deckSummary.total} · {deckSummary.mastered} mastered
                    </span>
                  </div>
                </div>
                <Button variant="brand" size="sm" onClick={() => onStartReview(deck.id)}>
                  <PlayIcon className="size-3.5" />
                  Review
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base">Danger zone</CardTitle>
          <CardDescription>Both actions touch only this device's storage</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                <RotateCcwIcon className="size-4" />
                Reset progress
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset all progress?</DialogTitle>
                <DialogDescription>
                  Every card goes back to new. Notes, decks and files stay untouched.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={() => void resetProgress()}>
                  Reset progress
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                <Trash2Icon className="size-4" />
                Clear library
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear the entire library?</DialogTitle>
                <DialogDescription>
                  Deletes every note, deck and flashcard from this device. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={() => void wipeLibrary()}>
                  Delete everything
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <p className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground/70">
        <WifiIcon className="size-3" />
        {online ? "Online" : "Offline — everything keeps working"}
        {installed ? " · Installed as an app" : ""}
      </p>
    </div>
  );
}

function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function StatTile({
  label,
  value,
  icon: Icon,
  sub,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: typeof LayersIcon;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="glass rounded-2xl border border-border/60 p-4"
      style={highlight ? { boxShadow: "0 0 36px -14px var(--color-good)" } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</span>
        <Icon className={`size-4 ${highlight ? "text-good" : "text-muted-foreground/70"}`} />
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </motion.div>
  );
}

function SegmentBar({ value, total, tone }: { value: number; total: number; tone: Rating }) {
  if (!value) return null;
  const width = (value / total) * 100;
  const colors = { hard: "bg-hard", good: "bg-good", easy: "bg-easy" } as const;
  return <div className={colors[tone]} style={{ width: `${width}%` }} />;
}

function RatingCount({ label, tone, value }: { label: string; tone: Rating; value: number }) {
  const colors = { hard: "text-hard", good: "text-good", easy: "text-easy" } as const;
  return (
    <div>
      <div className={`text-lg font-bold tabular-nums ${colors[tone]}`}>{value}</div>
      <div className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}
