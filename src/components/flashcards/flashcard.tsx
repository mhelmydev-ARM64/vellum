import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { HelpCircleIcon, Repeat2Icon } from "lucide-react";
import type { Card } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  card: Card;
  deckName: string;
  index: number;
  total: number;
  flipped: boolean;
  showHint: boolean;
  onFlip: () => void;
  onToggleHint: () => void;
  exitRating?: "hard" | "good" | "easy" | null;
}

const EXIT_VECTORS = {
  hard: { x: -160, y: 46, rotate: -8 },
  good: { x: 0, y: -120, rotate: 0 },
  easy: { x: 160, y: -60, rotate: 8 },
} as const;

/**
 * The full-screen 3D flashcard: spring rotateY flip with a moving specular
 * glare and pointer-parallax tilt, layered so the flip axis stays exact.
 */
export function Flashcard({
  card,
  deckName,
  index,
  total,
  flipped,
  showHint,
  onFlip,
  onToggleHint,
  exitRating = null,
}: FlashcardProps) {
  const rotateYFlip = useMotionValue(0);
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const tiltX = useTransform(pointerY, [0, 1], [5.5, -5.5]);
  const tiltY = useTransform(pointerX, [0, 1], [-7, 7]);
  const lift = useTransform(rotateYFlip, (value) => 1 + Math.sin((value / 180) * Math.PI) * 0.035);
  const glare = useTransform(rotateYFlip, glareAt);
  const edgeLight = useTransform(rotateYFlip, (value) => `${Math.min(1, Math.abs(value) / 90)}`);

  useEffect(() => {
    const controls = animate(rotateYFlip, flipped ? 180 : 0, {
      type: "spring",
      stiffness: 190,
      damping: 21,
      mass: 0.9,
    });
    return () => controls.stop();
  }, [flipped, rotateYFlip]);

  useVibrateOnFlip(rotateYFlip);

  const exit = exitRating ? EXIT_VECTORS[exitRating] : { opacity: 0 };

  return (
    <motion.div
      className="perspective-distant w-full max-w-[min(92vw,680px)]"
      initial={{ opacity: 0, y: 34, scale: 0.95, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{
        opacity: 0,
        scale: 0.92,
        transition: { type: "spring", stiffness: 320, damping: 30 },
        ...exit,
      }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - bounds.left) / bounds.width);
        pointerY.set((event.clientY - bounds.top) / bounds.height);
      }}
      onPointerLeave={() => {
        pointerX.set(0.5);
        pointerY.set(0.5);
      }}
    >
      <motion.button
        type="button"
        onClick={onFlip}
        aria-label={flipped ? "Show question" : "Reveal answer"}
        className="preserve-3d relative block h-[430px] w-full cursor-pointer rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring/70 sm:h-[460px]"
        style={{ rotateX: tiltX, rotateY: tiltY, scale: lift }}
        whileTap={{ scale: 0.985 }}
      >
        <motion.div className="preserve-3d relative h-full w-full" style={{ rotateY: rotateYFlip }}>
          <Face card={card} deckName={deckName} index={index} total={total} showHint={showHint} onToggleHint={onToggleHint} />

          <div className="card-face backface-hidden" style={{ transform: "rotateY(180deg)" }}>
            <div className="flex items-center justify-between px-6 pt-5">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-easy uppercase">
                Answer
              </span>
              <Repeat2Icon className="size-4 text-muted-foreground/60" />
            </div>
            <div className="flex flex-1 items-center justify-center overflow-y-auto px-7 py-5 sm:px-10">
              <p
                dir="auto"
                className={cn(
                  "whitespace-pre-wrap text-center font-medium tracking-[-0.012em] text-foreground",
                  card.back.length > 220
                    ? "text-[15px] leading-relaxed sm:text-base"
                    : card.back.length > 110
                      ? "text-lg leading-relaxed sm:text-xl"
                      : "text-xl leading-snug sm:text-[26px]",
                )}
              >
                {card.back}
              </p>
            </div>
            {card.tags.length ? (
              <div className="flex flex-wrap items-center justify-center gap-1.5 px-6 pb-5">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] tracking-wide text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="pb-5 text-center text-[11px] text-muted-foreground/50">
                Space — flip back
              </div>
            )}
          </div>

          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{ background: glare, opacity: edgeLight }}
          />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}

function Face({
  card,
  deckName,
  index,
  total,
  showHint,
  onToggleHint,
}: {
  card: Card;
  deckName: string;
  index: number;
  total: number;
  showHint: boolean;
  onToggleHint: () => void;
}) {
  return (
    <div className="card-face backface-hidden">
      <div className="flex items-center justify-between px-6 pt-5">
        <span className="text-[10px] font-semibold tracking-[0.18em] text-brand uppercase">
          {deckName}
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {index} / {total}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-7 py-5 sm:px-10">
        <p
          dir="auto"
          className={cn(
            "whitespace-pre-wrap text-center font-semibold tracking-[-0.02em] text-foreground",
            card.front.length > 220
              ? "text-[15px] leading-relaxed sm:text-base"
              : card.front.length > 110
                ? "text-lg leading-relaxed sm:text-xl"
                : "text-xl leading-snug sm:text-[26px]",
          )}
        >
          {card.front}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 pb-5">
        {card.hint ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleHint();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-brand/40 hover:text-foreground"
          >
            <HelpCircleIcon className="size-3" />
            {showHint ? "Hide hint" : "Hint"}
          </button>
        ) : (
          <span />
        )}
        <span className="text-[11px] text-muted-foreground/50">Space — reveal answer</span>
      </div>

      {showHint && card.hint ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-5 rounded-xl border border-good/25 bg-good/10 px-3.5 py-2.5 text-[13px] text-foreground/85"
          dir="auto"
        >
          {card.hint}
        </motion.div>
      ) : null}
    </div>
  );
}

function glareAt(value: number) {
  const t = value / 180;
  const x = 30 + t * 42;
  const y = 18 + t * 8;
  const intensity = 0.05 + Math.sin(t * Math.PI) * 0.16;
  return `radial-gradient(42% 46% at ${x}% ${y}%, rgba(255,255,255,${intensity.toFixed(3)}), rgba(255,255,255,0.015) 55%, transparent 72%)`;
}

function useVibrateOnFlip(rotateY: MotionValue<number>) {
  const armed = useRef(true);
  useMotionValueEvent(rotateY, "change", (value) => {
    const passing = value > 60 && value < 120;
    if (passing && armed.current) {
      armed.current = false;
      navigator.vibrate?.(4);
    }
    if (value < 30 || value > 150) armed.current = true;
  });
}
