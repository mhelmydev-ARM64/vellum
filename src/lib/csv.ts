import Papa from "papaparse";
import { hashString } from "./utils";

export interface RawCard {
  front: string;
  back: string;
  hint?: string;
  tags: string[];
}

export interface ParsedCsv {
  name: string;
  cards: RawCard[];
  skipped: number;
  columns: { front: string; back: string };
}

const FRONT_ALIASES = [
  "question",
  "front",
  "prompt",
  "q",
  "term",
  "word",
  "cue",
  "side_a",
  "a_side",
  "سؤال",
  "السؤال",
  "الوجه",
];

const BACK_ALIASES = [
  "answer",
  "back",
  "response",
  "a",
  "definition",
  "meaning",
  "side_b",
  "b_side",
  "جواب",
  "الجواب",
  "إجابة",
  "اجابة",
];

const HINT_ALIASES = ["hint", "clue", "context", "note", "تلميح"];
const TAG_ALIASES = ["tags", "tag", "topic", "category", "deck", "وسم", "وسوم"];

type HeaderMap = Record<string, string>;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/^"|"$/g, "").replace(/[\s_-]+/g, "");
}

function buildHeaderMap(headers: string[]): HeaderMap {
  const normalized = headers.map(normalizeHeader);
  const find = (aliases: string[]) => {
    for (const alias of aliases) {
      const index = normalized.indexOf(alias);
      if (index !== -1) return headers[index];
    }
    return undefined;
  };

  const front = find(FRONT_ALIASES);
  const back = find(BACK_ALIASES);
  if (!front || !back) return {};

  return {
    front,
    back,
    hint: find(HINT_ALIASES) ?? "",
    tags: find(TAG_ALIASES) ?? "",
  };
}

function looksLikeHeader(row: string[]) {
  const cells = row.map((cell) => normalizeHeader(cell)).filter(Boolean);
  if (!cells.length) return false;
  const aliases = [...FRONT_ALIASES, ...BACK_ALIASES, ...HINT_ALIASES, ...TAG_ALIASES];
  return cells.some((cell) => aliases.includes(cell));
}

function splitTags(value: string) {
  return value
    .split(/[;,|]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/**
 * Parses a flashcard CSV.
 *
 * Accepts a header row with any of the common aliases (Question/Answer,
 * Front/Back, term/definition, …) or a bare two-column file with no header.
 * Extra columns map to `hint` and `tags`. Rows missing either side are skipped.
 */
export function parseCsv(text: string, fileName: string): ParsedCsv {
  const result = Papa.parse<string[]>(text.trim(), {
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    delimiter: "",
    transformHeader: undefined,
  });

  const rows = (result.data ?? []).filter((row) => Array.isArray(row));
  if (!rows.length) {
    return { name: cleanName(fileName), cards: [], skipped: 0, columns: { front: "Column A", back: "Column B" } };
  }

  const firstRow = rows[0].map((cell) => String(cell ?? "").trim());
  const hasHeader = looksLikeHeader(firstRow);
  const headerMap = hasHeader ? buildHeaderMap(firstRow.map(String)) : {};
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const index = {
    front: hasHeader && headerMap.front ? firstRow.indexOf(headerMap.front) : 0,
    back: hasHeader && headerMap.back ? firstRow.indexOf(headerMap.back) : 1,
    hint: hasHeader && headerMap.hint ? firstRow.indexOf(headerMap.hint) : -1,
    tags: hasHeader && headerMap.tags ? firstRow.indexOf(headerMap.tags) : -1,
  };

  const cards: RawCard[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const row of dataRows) {
    const front = String(row[index.front] ?? "").trim();
    const back = String(row[index.back] ?? "").trim();
    if (!front || !back) {
      if (front || back) skipped += 1;
      continue;
    }
    const key = `${front.toLowerCase()}::${back.toLowerCase()}`;
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);

    const hint = index.hint >= 0 ? String(row[index.hint] ?? "").trim() : "";
    const tags = index.tags >= 0 ? splitTags(String(row[index.tags] ?? "")) : [];

    cards.push({ front, back, hint: hint || undefined, tags });
  }

  return {
    name: cleanName(fileName),
    cards,
    skipped,
    columns: {
      front: index.front >= 0 ? (hasHeader ? firstRow[index.front] : `Column ${letter(index.front)}`) : "front",
      back: index.back >= 0 ? (hasHeader ? firstRow[index.back] : `Column ${letter(index.back)}`) : "back",
    },
  };
}

function letter(position: number) {
  return String.fromCharCode(65 + position);
}

function cleanName(fileName: string) {
  return fileName.replace(/\.(csv|tsv|txt)$/i, "").replace(/[-_]+/g, " ").trim() || "Untitled deck";
}

/**
 * Deterministic card ids so re-importing the same file updates cards in place
 * instead of creating duplicates that lose their scheduling history.
 */
export function cardId(deckId: string, index: number, front: string) {
  return `${deckId}:${index}:${hashString(front).slice(0, 6)}`;
}

export function deckIdFor(fileId: string) {
  return `deck_${fileId}`;
}
