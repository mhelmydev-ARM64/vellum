import { describe, expect, it } from "vitest";
import { cardId, deckIdFor, parseCsv } from "./csv";

describe("parseCsv", () => {
  it("reads a standard Question/Answer file and drops the header", () => {
    const parsed = parseCsv("Question,Answer\nWhat is spaced repetition?,Recall over time", "deck.csv");
    expect(parsed.cards).toHaveLength(1);
    expect(parsed.cards[0].front).toBe("What is spaced repetition?");
    expect(parsed.cards[0].back).toBe("Recall over time");
  });

  it("accepts Front/Back and term/definition aliases", () => {
    const parsed = parseCsv("Front,Back\nFoo,Bar", "deck.csv");
    expect(parsed.cards[0].front).toBe("Foo");
    const other = parseCsv("term,definition\nFoo,Bar", "deck.csv");
    expect(other.cards[0].back).toBe("Bar");
  });

  it("accepts Arabic headers", () => {
    const parsed = parseCsv("سؤال,جواب\nعاصمة سوريا,دمشق", "arabic.csv");
    expect(parsed.cards).toHaveLength(1);
    expect(parsed.cards[0].front).toBe("عاصمة سوريا");
    expect(parsed.cards[0].back).toBe("دمشق");
  });

  it("treats a headerless two-column file as pure data", () => {
    const parsed = parseCsv("A1,B1\nA2,B2", "deck.csv");
    expect(parsed.cards).toHaveLength(2);
    expect(parsed.cards[0].front).toBe("A1");
  });

  it("detects tab-separated values", () => {
    const parsed = parseCsv("Question\tAnswer\nQ1\tA1", "deck.tsv");
    expect(parsed.cards).toHaveLength(1);
    expect(parsed.cards[0].back).toBe("A1");
  });

  it("maps hint and tag columns, splitting multiple tags", () => {
    const parsed = parseCsv(
      "Question,Answer,Hint,Tags\nQ,A,think back,biology; cells|core",
      "deck.csv",
    );
    expect(parsed.cards[0].hint).toBe("think back");
    expect(parsed.cards[0].tags).toEqual(["biology", "cells", "core"]);
  });

  it("skips and counts rows missing a side, and dedupes", () => {
    const parsed = parseCsv(
      "Question,Answer\nQ1,A1\nQ2,\n,A3\nQ1,A1\nQ4,A4",
      "deck.csv",
    );
    expect(parsed.cards).toHaveLength(2);
    expect(parsed.skipped).toBe(3);
  });

  it("cleans the deck name from the filename", () => {
    const parsed = parseCsv("Question,Answer\nQ,A", "My-Spanish_Verbs.csv");
    expect(parsed.name).toBe("My Spanish Verbs");
    expect(parseCsv("Q,A", "weird.txt").name).toBe("weird");
  });
});

describe("deterministic ids", () => {
  it("cardId is stable for identical input and varies with the front", () => {
    const a = cardId("deck_1", 0, "Same question");
    const b = cardId("deck_1", 0, "Same question");
    const c = cardId("deck_1", 0, "Other question");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("deckIdFor derives from the file id", () => {
    expect(deckIdFor("file_abc")).toBe("deck_file_abc");
  });
});
