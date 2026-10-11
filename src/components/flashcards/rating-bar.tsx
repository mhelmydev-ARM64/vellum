import { motion, type Variants } from "framer-motion";
import { FlameIcon, SparklesIcon, ThumbsUpIcon } from "lucide-react";
import { RATING_ORDER, RATING_RULES } from "@/lib/srs";
import type { Rating } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = {
  hard: FlameIcon,
  good: ThumbsUpIcon,
  easy: SparklesIcon,
} as const;

const STYLES = {
  hard: "border-hard/30 text-hard hover:border-hard/60 hover:bg-hard/15",
  good: "border-good/30 text-good hover:border-good/60 hover:bg-good/15",
  easy: "border-easy/30 text-easy hover:border-easy/60 hover:bg-easy/15",
} as const;

const GLOWS = {
  hard: "0 10px 44px -14px var(--color-hard)",
  good: "0 10px 44px -14px var(--color-good)",
  easy: "0 10px 44px -14px var(--color-easy)",
} as const;

const KEYS = { hard: "1", good: "2", easy: "3" } as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 24 },
  },
};

interface RatingBarProps {
  enabled: boolean;
  onRate: (rating: Rating) => void;
}

/**
 * The three glowing SRS actions. Disabled (dimmed) until the card is flipped,
 * so ratings never fire on an un-revealed answer.
 */
export function RatingBar({ enabled, onRate }: RatingBarProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex w-full max-w-[min(92vw,680px)] items-stretch justify-center gap-2.5 sm:gap-3.5"
    >
      {RATING_ORDER.map((rating) => (
        <RatingButton key={rating} rating={rating} enabled={enabled} onRate={onRate} />
      ))}
    </motion.div>
  );
}

function RatingButton({
  rating,
  enabled,
  onRate,
}: {
  rating: Rating;
  enabled: boolean;
  onRate: (rating: Rating) => void;
}) {
  const rule = RATING_RULES[rating];
  const Icon = ICONS[rating];

  return (
    <motion.button
      type="button"
      variants={item}
      disabled={!enabled}
      onClick={() => onRate(rating)}
      whileHover={enabled ? { y: -3, scale: 1.035 } : undefined}
      whileTap={enabled ? { scale: 0.955, y: 0 } : undefined}
      aria-label={`${rule.label} — ${rule.caption.toLowerCase()}`}
      className={cn(
        "glass group relative flex flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-2xl border px-3 py-3.5 outline-none transition-colors select-none sm:gap-1 sm:px-5",
        "focus-visible:ring-2 focus-visible:ring-ring/70",
        enabled ? STYLES[rating] : "border-border/60 text-muted-foreground/50",
        !enabled && "pointer-events-none",
      )}
      style={enabled ? { boxShadow: GLOWS[rating] } : undefined}
    >
      <Icon className="size-[18px] sm:size-5" strokeWidth={2.2} />
      <span className="text-[13px] font-semibold tracking-wide sm:text-sm">{rule.label}</span>
      <span
        className={cn(
          "text-[10.5px] font-medium tracking-wide sm:text-[11px]",
          enabled ? "text-muted-foreground" : "text-muted-foreground/40",
        )}
      >
        {rule.caption}
      </span>
      <kbd
        className={cn(
          "absolute top-1.5 right-2 hidden rounded-md border border-border/70 bg-background/50 px-1.5 py-px font-mono text-[9px] text-muted-foreground/70 sm:block",
          !enabled && "opacity-40",
        )}
      >
        {KEYS[rating]}
      </kbd>
    </motion.button>
  );
}
