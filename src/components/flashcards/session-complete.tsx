import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionStats } from "@/lib/types";
import { formatDuration, pluralize } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * End-of-session screen: animated ring, count-up score and the session
 * breakdown. Rendered once the queue empties.
 */
export function SessionComplete({ stats, onDone }: { stats: SessionStats; onDone: () => void }) {
  const reviewed = Math.max(1, stats.reviewed);
  const recalled = stats.good + stats.easy;
  const accuracy = Math.round((recalled / reviewed) * 100);
  const perfect = stats.hard === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center"
    >
      <div className="relative">
        <ProgressRing value={accuracy} size={172} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatedNumber value={stats.reviewed} className="text-5xl font-bold tabular-nums tracking-tight" />
          <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {pluralize(stats.reviewed, "card")} done
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {perfect ? "Flawless session" : "Session complete"}
        </h2>
        <p className="mx-auto max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
          {perfect
            ? "Every answer came back without a single lapse. The schedule will space them further apart."
            : `${accuracy}% recalled on first try · hard cards stay in today's queue and will return.`}
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-4 gap-2">
        <Stat label="Time" value={formatDuration(stats.endedAt - stats.startedAt)} />
        <Stat label="Hard" value={String(stats.hard)} tone="hard" />
        <Stat label="Good" value={String(stats.good)} tone="good" />
        <Stat label="Easy" value={String(stats.easy)} tone="easy" />
      </div>

      <Button variant="brand" size="lg" onClick={onDone} className="group">
        Back to library
        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </motion.div>
  );
}

/** Shown when a review session opens with nothing left to do. */
export function CaughtUp({ nextDueLabel, onDone }: { nextDueLabel?: string; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="grid size-20 place-items-center rounded-3xl border border-good/25 bg-good/10 text-good"
        style={{ boxShadow: "0 12px 60px -18px var(--color-good)" }}
      >
        <SparklesIcon className="size-9" strokeWidth={1.7} />
      </motion.div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">All caught up</h2>
        <p className="mx-auto max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
          Nothing is due right now.
          {nextDueLabel ? ` The next ${nextDueLabel}.` : " New cards arrive when you import a deck."}
        </p>
      </div>
      <Button variant="brand" size="lg" onClick={onDone} className="group">
        Back to library
        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </motion.div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "hard" | "good" | "easy" }) {
  const toneClass =
    tone === "hard" ? "text-hard" : tone === "good" ? "text-good" : tone === "easy" ? "text-easy" : "text-foreground";
  return (
    <div className="glass rounded-2xl border border-border/60 px-2 py-3">
      <div className={`text-lg font-bold tabular-nums ${toneClass}`}>{value}</div>
      <div className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.1, ease: EASE });
    return () => controls.stop();
  }, [count, value]);

  return <motion.span className={className}>{rounded}</motion.span>;
}

function ProgressRing({ value, size }: { value: number; size: number }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        className="stroke-border/60"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        stroke="url(#ring-gradient)"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
      />
      <defs>
        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-brand)" />
          <stop offset="55%" stopColor="var(--color-good)" />
          <stop offset="100%" stopColor="var(--color-easy)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
