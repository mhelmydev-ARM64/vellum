import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DAY_MS = 86_400_000;

export function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/** Short, collision-resistant id without external deps. */
export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatRelative(ts: number, now = Date.now()) {
  if (!ts) return "Never";
  const diff = ts - now;
  const abs = Math.abs(diff);
  const future = diff > 0;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (abs < 45_000) return future ? "in a moment" : "just now";
  if (abs < 3_600_000) return rtf.format(future ? Math.round(abs / 60_000) : -Math.round(abs / 60_000), "minute");
  if (abs < DAY_MS) return rtf.format(future ? Math.round(abs / 3_600_000) : -Math.round(abs / 3_600_000), "hour");
  if (abs < DAY_MS * 30) return rtf.format(future ? Math.round(abs / DAY_MS) : -Math.round(abs / DAY_MS), "day");
  if (abs < DAY_MS * 365) return rtf.format(future ? Math.round(abs / (DAY_MS * 30)) : -Math.round(abs / (DAY_MS * 30)), "month");
  return rtf.format(future ? Math.round(abs / (DAY_MS * 365)) : -Math.round(abs / (DAY_MS * 365)), "year");
}

export function formatDueLabel(nextReview: number, now = Date.now()) {
  if (!nextReview) return "New";
  if (nextReview <= now) return "Due now";
  return formatRelative(nextReview, now);
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Stable string hash used for deterministic ids across re-imports. */
export function hashString(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
