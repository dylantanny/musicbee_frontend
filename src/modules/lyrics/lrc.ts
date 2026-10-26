export interface LrcLine { time: number; text: string }

const TIMESTAMP = /\[(\d+):(\d+(?:\.\d+)?)\]/g;

/** Synced (LRC) lyrics as sorted lines in ms, or null if the text has no timestamps. */
export function parseLrc(text: string): LrcLine[] | null {
  const lines: LrcLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(TIMESTAMP)];
    const words = raw.replace(TIMESTAMP, "").trim();
    for (const [, min, sec] of stamps) lines.push({ time: Math.round((Number(min) * 60 + Number(sec)) * 1000), text: words });
  }
  return lines.length ? lines.sort((a, b) => a.time - b.time) : null;
}

/** Index of the line being sung at ms, or -1 before the first line. */
export function currentLine(lines: LrcLine[], ms: number): number {
  let index = -1;
  while (index + 1 < lines.length && lines[index + 1].time <= ms) index++;
  return index;
}
