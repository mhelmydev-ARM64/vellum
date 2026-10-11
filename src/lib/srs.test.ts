import { describe, expect, it } from "vitest";
import {
  DAY_MS,
  INITIAL_EASE,
  buildQueue,
  cardState,
  createCard,
  forecast,
  isDue,
  mergeCards,
  schedule,
  summarize,
} from "./srs";
import type { Card } from "./types";

const NOW = new Date(2026, 5, 15, 10, 0, 0).getTime();

function endOfToday(now: number) {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function newCard(overrides: Partial<Card> = {}): Card {
  return { ...createCard({ id: "c1", deckId: "d1", front: "Q", back: "A" }), ...overrides };
}

describe("schedule — first review", () => {
  it("hard keeps the card inside today", () => {
    const next = schedule(newCard(), "hard", NOW);
    expect(next.interval).toBe(0);
    expect(next.streak).toBe(0);
    expect(next.lapses).toBe(1);
    expect(next.reps).toBe(1);
    expect(next.nextReview).toBe(NOW + 6 * 3_600_000);
    expect(next.nextReview).toBeLessThanOrEqual(endOfToday(NOW));
  });

  it("hard near midnight still lands today, never in the past", () => {
    const late = new Date(2026, 5, 15, 23, 30).getTime();
    const next = schedule(newCard(), "hard", late);
    expect(next.nextReview).toBeLessThanOrEqual(endOfToday(late));
    expect(next.nextReview).toBeGreaterThan(late);
  });

  it("good schedules exactly two days out", () => {
    const next = schedule(newCard(), "good", NOW);
    expect(next.interval).toBe(2);
    expect(next.nextReview).toBe(NOW + 2 * DAY_MS);
    expect(next.streak).toBe(1);
  });

  it("easy schedules exactly four days out", () => {
    const next = schedule(newCard(), "easy", NOW);
    expect(next.interval).toBe(4);
    expect(next.nextReview).toBe(NOW + 4 * DAY_MS);
  });
});

describe("schedule — growth and ease", () => {
  it("good doubles the interval at baseline ease", () => {
    const card = newCard({ reps: 1, interval: 5, ease: 2.5, nextReview: NOW, lastReview: NOW - DAY_MS });
    const next = schedule(card, "good", NOW);
    expect(next.interval).toBe(10);
  });

  it("a lowered ease shrinks growth", () => {
    const card = newCard({ reps: 1, interval: 10, ease: 1.3, nextReview: NOW });
    const next = schedule(card, "good", NOW);
    expect(next.interval).toBe(Math.round(10 * 2 * (1.3 / INITIAL_EASE)));
  });

  it("hard answers drag ease down but never below the floor", () => {
    let card = newCard();
    for (let i = 0; i < 12; i += 1) card = schedule(card, "hard", NOW);
    expect(card.ease).toBe(1.3);
  });

  it("easy answers raise ease up to the ceiling", () => {
    let card = newCard();
    for (let i = 0; i < 12; i += 1) card = schedule(card, "easy", NOW);
    expect(card.ease).toBe(2.8);
  });
});

describe("card state", () => {
  it("classifies new, due, learning, review and mastered cards", () => {
    expect(cardState(newCard(), NOW)).toBe("new");
    expect(cardState(newCard({ reps: 2, nextReview: NOW - 1 }), NOW)).toBe("due");
    expect(cardState(newCard({ reps: 1, nextReview: NOW + 3_600_000, interval: 0 }), NOW)).toBe("learning");
    expect(cardState(newCard({ reps: 2, nextReview: NOW + DAY_MS, interval: 5 }), NOW)).toBe("review");
    expect(cardState(newCard({ reps: 3, nextReview: NOW + DAY_MS, interval: 30 }), NOW)).toBe("mastered");
  });

  it("isDue ignores brand-new cards", () => {
    expect(isDue(newCard(), NOW)).toBe(false);
    expect(isDue(newCard({ nextReview: NOW - 1 }), NOW)).toBe(true);
    expect(isDue(newCard({ nextReview: NOW + DAY_MS }), NOW)).toBe(false);
  });
});

describe("buildQueue", () => {
  const limits = { dailyNewLimit: 20, newTodayCount: 0, sessionLimit: 60 };

  it("interleaves two due cards per new card, most overdue first", () => {
    const due = [1, 2, 3].map((n) => newCard({ id: `due${n}`, nextReview: NOW - (4 - n) * 1000 }));
    const fresh = [1, 2].map((n) => newCard({ id: `fresh${n}`, createdAt: NOW + n }));
    const { queue } = buildQueue([...due, ...fresh], NOW, limits);
    expect(queue.map((card) => card.id)).toEqual(["due1", "due2", "fresh1", "due3", "fresh2"]);
  });

  it("caps new cards by the daily limit", () => {
    const fresh = Array.from({ length: 6 }, (_, n) => newCard({ id: `f${n}` }));
    const { queue, newRemaining } = buildQueue(fresh, NOW, { ...limits, dailyNewLimit: 3 });
    expect(newRemaining).toBe(3);
    expect(queue).toHaveLength(3);
  });

  it("respects what was already studied today", () => {
    const fresh = Array.from({ length: 4 }, (_, n) => newCard({ id: `f${n}` }));
    const { queue } = buildQueue(fresh, NOW, { ...limits, dailyNewLimit: 3, newTodayCount: 2 });
    expect(queue).toHaveLength(1);
  });

  it("caps the whole session", () => {
    const cards = Array.from({ length: 10 }, (_, n) =>
      newCard({ id: `c${n}`, nextReview: NOW - (10 - n) }),
    );
    const { queue } = buildQueue(cards, NOW, { ...limits, sessionLimit: 4 });
    expect(queue).toHaveLength(4);
  });
});

describe("mergeCards", () => {
  it("keeps scheduling of existing cards and refreshes their text", () => {
    const existing = newCard({ reps: 5, interval: 12, ease: 1.9 });
    const incoming = { ...existing, front: "Updated", back: "New answer" };
    const merged = mergeCards([existing], [incoming]);
    expect(merged).toHaveLength(1);
    expect(merged[0].front).toBe("Updated");
    expect(merged[0].interval).toBe(12);
    expect(merged[0].reps).toBe(5);
  });

  it("appends unseen cards", () => {
    const a = newCard({ id: "a" });
    const b = newCard({ id: "b" });
    expect(mergeCards([a], [b])).toHaveLength(2);
  });
});

describe("forecast + summarize", () => {
  it("buckets upcoming reviews per day", () => {
    const cards = [
      newCard({ id: "today", nextReview: NOW + 3_600_000 }),
      newCard({ id: "tomorrow", nextReview: NOW + DAY_MS }),
      newCard({ id: "later", nextReview: NOW + 10 * DAY_MS }),
    ];
    const buckets = forecast(cards, NOW, 7);
    expect(buckets[0].count).toBe(1);
    expect(buckets[1].count).toBe(1);
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(2);
  });

  it("summarizes deck health", () => {
    const cards = [
      newCard({ id: "new" }),
      newCard({ id: "due", reps: 1, nextReview: NOW - 1 }),
      newCard({ id: "mastered", reps: 4, interval: 30, nextReview: NOW + 30 * DAY_MS }),
    ];
    const summary = summarize(cards, NOW);
    expect(summary.total).toBe(3);
    expect(summary.fresh).toBe(1);
    expect(summary.due).toBe(1);
    expect(summary.mastered).toBe(1);
    expect(summary.studied).toBe(2);
  });
});
