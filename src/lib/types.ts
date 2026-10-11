export type FileKind = "markdown" | "csv";

export interface SourceFile {
  id: string;
  name: string;
  kind: FileKind;
  /** raw text content, kept so notes stay readable fully offline */
  content: string;
  size: number;
  addedAt: number;
  updatedAt: number;
  /** csv only: number of cards produced on import */
  cardCount?: number;
  /** markdown only: word count */
  wordCount?: number;
}

export type Rating = "hard" | "good" | "easy";

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hint?: string;
  tags: string[];
  /** review count */
  reps: number;
  /** consecutive successful recalls */
  streak: number;
  ease: number;
  /** current interval in days (0 = never scheduled) */
  interval: number;
  /** epoch ms; 0 means "new / unscheduled" */
  nextReview: number;
  lastReview: number;
  lapses: number;
  createdAt: number;
}

export interface Deck {
  id: string;
  fileId: string;
  name: string;
  cardCount: number;
  createdAt: number;
}

export interface ReviewLogEntry {
  cardId: string;
  rating: Rating;
  at: number;
  interval: number;
}

export interface SessionStats {
  reviewed: number;
  hard: number;
  good: number;
  easy: number;
  startedAt: number;
  endedAt: number;
}

export interface AppSettings {
  theme: "dark" | "light";
  dailyNewLimit: number;
  sessionLimit: number;
  flipSound: boolean;
}

export interface AppMeta {
  seeded: boolean;
  newTodayCount: number;
  newTodayDate: string;
  totalReviews: number;
  reviewLog: ReviewLogEntry[];
  lastSession?: SessionStats;
  installedAt: number;
}

export type View =
  | { name: "library" }
  | { name: "reader"; fileId: string }
  | { name: "review"; deckId?: string }
  | { name: "insights" };
