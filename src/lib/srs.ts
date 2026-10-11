import type { Card, Rating } from "./types";

export const DAY_MS = 86_400_000;

export const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 2.8;
/** Cards graduating to this interval (days) count as long-term memory. */
export const MATURE_INTERVAL = 21;

interface RatingRule {
  /** interval in days granted on the very first successful review */
  base: number;
  /** multiplier applied to the previous interval on later reviews */
  factor: number;
  easeDelta: number;
  label: string;
  /** what the schedule means, shown in the UI */
  caption: string;
}

export const RATING_RULES: Record<Rating, RatingRule> = {
  hard: { base: 0, factor: 1.2, easeDelta: -0.18, label: "Hard", caption: "Again today" },
  good: { base: 2, factor: 2.0, easeDelta: 0, label: "Good", caption: "In 2 days" },
  easy: { base: 4, factor: 3.4, easeDelta: 0.14, label: "Easy", caption: "In 4 days" },
};

export const RATING_ORDER: Rating[] = ["hard", "good", "easy"];

export type CardState = "new" | "learning" | "due" | "review" | "mastered";

export function cardState(card: Card, now = Date.now()): CardState {
  if (card.reps === 0 || card.nextReview === 0) return "new";
  if (card.nextReview <= now) return "due";
  if (card.interval < 1) return "learning";
  if (card.interval >= MATURE_INTERVAL) return "mastered";
  return "review";
}

export function isDue(card: Card, now = Date.now()) {
  return card.nextReview > 0 && card.nextReview <= now;
}

function endOfToday(now: number) {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Spaced repetition scheduling.
 *
 * First review: hard → again today, good → 2 days, easy → 4 days.
 * Later reviews grow the interval by the rating factor, scaled by the card's
 * ease (which drifts down on hard answers and up on easy ones).
 * A hard answer always counts as a lapse and keeps the card inside today.
 */
export function schedule(card: Card, rating: Rating, now = Date.now()): Card {
  const rule = RATING_RULES[rating];
  const ease = clampEase(card.ease + rule.easeDelta);
  const isNew = card.reps === 0;

  if (rating === "hard") {
    // "Review today": later today, never in the past, never past midnight.
    const later = Math.min(now + 6 * 3_600_000, endOfToday(now));
    return {
      ...card,
      ease,
      reps: card.reps + 1,
      streak: 0,
      lapses: card.lapses + 1,
      interval: 0,
      nextReview: later > now ? later : endOfToday(now),
      lastReview: now,
    };
  }

  const grown = isNew
    ? rule.base
    : Math.max(1, Math.round(card.interval * rule.factor * (ease / INITIAL_EASE)));

  return {
    ...card,
    ease,
    reps: card.reps + 1,
    streak: card.streak + 1,
    interval: grown,
    nextReview: now + grown * DAY_MS,
    lastReview: now,
  };
}

export function clampEase(ease: number) {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, Number(ease.toFixed(3))));
}

export function createCard(input: {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hint?: string;
  tags?: string[];
  createdAt?: number;
}): Card {
  return {
    id: input.id,
    deckId: input.deckId,
    front: input.front,
    back: input.back,
    hint: input.hint,
    tags: input.tags ?? [],
    reps: 0,
    streak: 0,
    ease: INITIAL_EASE,
    interval: 0,
    nextReview: 0,
    lastReview: 0,
    lapses: 0,
    createdAt: input.createdAt ?? Date.now(),
  };
}

/** Merge freshly imported cards with existing ones so progress survives re-imports. */
export function mergeCards(existing: Card[], incoming: Card[]): Card[] {
  const byId = new Map(existing.map((card) => [card.id, card]));
  for (const card of incoming) {
    const previous = byId.get(card.id);
    if (!previous) {
      byId.set(card.id, card);
      continue;
    }
    byId.set(card.id, { ...previous, front: card.front, back: card.back, hint: card.hint, tags: card.tags });
  }
  return [...byId.values()];
}

export interface QueueLimits {
  dailyNewLimit: number;
  newTodayCount: number;
  sessionLimit: number;
}

export interface DueQueue {
  due: Card[];
  fresh: Card[];
  queue: Card[];
  /** how many new cards the daily limit still allows */
  newRemaining: number;
}

/**
 * Builds a review queue: everything overdue first, interleaved with the new
 * cards still allowed today, capped by the session limit.
 */
export function buildQueue(cards: Card[], now = Date.now(), limits: QueueLimits): DueQueue {
  const due = cards
    .filter((card) => isDue(card, now))
    .sort((a, b) => a.nextReview - b.nextReview || a.id.localeCompare(b.id));

  const newRemaining = Math.max(0, limits.dailyNewLimit - limits.newTodayCount);
  const fresh = cards
    .filter((card) => card.nextReview === 0)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    .slice(0, Math.min(newRemaining, limits.sessionLimit));

  return { due, fresh, newRemaining, queue: interleave(due, fresh).slice(0, limits.sessionLimit) };
}

/** One new card after every two review cards — keeps sessions from feeling like a wall of unknowns. */
function interleave(due: Card[], fresh: Card[]): Card[] {
  const out: Card[] = [];
  let d = 0;
  let f = 0;
  while (d < due.length || f < fresh.length) {
    if (d < due.length) out.push(due[d++]);
    if (d < due.length) out.push(due[d++]);
    if (f < fresh.length) out.push(fresh[f++]);
  }
  return out;
}

export interface DayBucket {
  key: string;
  label: string;
  date: Date;
  count: number;
}

/** Review load forecast for the next `days` days, starting today. */
export function forecast(cards: Card[], now = Date.now(), days = 7): DayBucket[] {
  const buckets: DayBucket[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(now + i * DAY_MS);
    date.setHours(0, 0, 0, 0);
    buckets.push({
      key: date.toISOString().slice(0, 10),
      label: i === 0 ? "Today" : date.toLocaleDateString("en", { weekday: "short" }),
      date,
      count: 0,
    });
  }
  const start = buckets[0].date.getTime();
  const end = start + days * DAY_MS;
  for (const card of cards) {
    if (card.nextReview >= start && card.nextReview < end) {
      const index = Math.floor((dayStart(card.nextReview) - start) / DAY_MS);
      if (index >= 0 && index < buckets.length) buckets[index].count += 1;
    }
  }
  return buckets;
}

function dayStart(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface ProgressSummary {
  total: number;
  fresh: number;
  learning: number;
  review: number;
  mastered: number;
  due: number;
  studied: number;
  /** 0..1 share of the deck that has entered long-term scheduling */
  retention: number;
}

export function summarize(cards: Card[], now = Date.now()): ProgressSummary {
  const summary: ProgressSummary = {
    total: cards.length,
    fresh: 0,
    learning: 0,
    review: 0,
    mastered: 0,
    due: 0,
    studied: 0,
    retention: 0,
  };
  for (const card of cards) {
    const state = cardState(card, now);
    if (state === "new") summary.fresh += 1;
    else if (state === "learning") summary.learning += 1;
    else if (state === "mastered") summary.mastered += 1;
    else summary.review += 1;
    if (isDue(card, now)) summary.due += 1;
    if (card.reps > 0) summary.studied += 1;
  }
  summary.retention = summary.total ? (summary.studied + summary.mastered * 0.5) / summary.total : 0;
  summary.retention = Math.min(1, summary.retention);
  return summary;
}
