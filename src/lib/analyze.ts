import { slugify } from "./utils";

export interface Heading {
  id: string;
  text: string;
  depth: number;
}

/** Keeps repeated headings linkable: "Setup", "Setup" → setup, setup-1. */
export function createSlugger() {
  const seen = new Map<string, number>();
  return (value: string) => {
    const base = slugify(value) || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

/** Heading outline used by the reader's table of contents. */
export function extractHeadings(source: string, maxDepth = 3): Heading[] {
  const slug = createSlugger();
  const headings: Heading[] = [];
  let fenced = false;

  for (const line of source.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;

    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (!match) continue;

    const depth = match[1].length;
    if (depth > maxDepth) continue;

    const text = match[2]
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/[*_`~[\]()]/g, "")
      .trim();
    if (!text) continue;
    headings.push({ id: slug(text), text, depth });
  }

  return headings;
}

export function countWords(source: string) {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~|]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function readingTimeMinutes(source: string) {
  return Math.max(1, Math.round(countWords(source) / 220));
}
