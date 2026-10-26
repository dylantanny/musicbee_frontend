import { describe, expect, it } from "vitest";
import { currentLine, parseLrc } from "../src/modules/lyrics/lrc";

describe("LRC lyrics", () => {
  const lines = parseLrc("[ar:Tame Impala]\n[00:04.39] second\n[00:00.16] first\n[01:02.5][01:30.00] chorus")!;

  it("parses and sorts timestamps, including several per line", () => {
    expect(lines.map((l) => [l.time, l.text])).toEqual([[160, "first"], [4390, "second"], [62500, "chorus"], [90000, "chorus"]]);
  });

  it("returns null for plain lyrics", () => {
    expect(parseLrc("just words\nno times")).toBeNull();
  });

  it("finds the line being sung", () => {
    expect(currentLine(lines, 0)).toBe(-1);
    expect(currentLine(lines, 4390)).toBe(1);
    expect(currentLine(lines, 70_000)).toBe(2);
  });
});
