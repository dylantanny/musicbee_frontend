import type { CSSProperties } from "react";

// MusicBee Remote can't send per-album covers for library items, so each name
// gets a stable hue instead of every tile looking the same
export function hueOf(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) % 360;
  return (h * 137) % 360; // spreads names that differ by one character, like "Album 1" and "Album 2"
}

/** seed picks the colour when the name alone isn't unique, e.g. two artists' albums called "Greatest hits" */
export function Art({ name, seed = name, round = false, className = "" }: { name: string; seed?: string; round?: boolean; className?: string }) {
  const style = { "--hue": hueOf(seed) } as CSSProperties;
  return (
    <span className={`art ${round ? "round" : ""} ${className}`} style={style} aria-hidden>
      {name.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}
