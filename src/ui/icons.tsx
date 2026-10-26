// Inline so they inherit currentColor and need no icon dependency
const paths = {
  play: "M7 4.5v15a.5.5 0 0 0 .77.42l11.5-7.5a.5.5 0 0 0 0-.84L7.77 4.08A.5.5 0 0 0 7 4.5Z",
  pause: "M6.5 4h3.5v16H6.5zM14 4h3.5v16H14z",
  next: "M5 5.2v13.6a.6.6 0 0 0 .92.5L15.5 13v5.5h2.5v-13h-2.5V11L5.92 4.7a.6.6 0 0 0-.92.5Z",
  previous: "M19 5.2v13.6a.6.6 0 0 1-.92.5L8.5 13v5.5H6v-13h2.5V11l9.58-6.3a.6.6 0 0 1 .92.5Z",
  shuffle: "M16.5 4.5 20 8l-3.5 3.5M4 8h4.2c1.6 0 3 .8 3.9 2.1l1.8 2.8c.9 1.3 2.3 2.1 3.9 2.1H20M16.5 12.5 20 16l-3.5 3.5M4 16h4.2c1.3 0 2.5-.5 3.3-1.4M20 8h-2.2c-1.3 0-2.5.5-3.3 1.4",
  repeat: "M17 2.5 20.5 6 17 9.5M20.5 6H8a4.5 4.5 0 0 0-4.5 4.5V12M7 21.5 3.5 18 7 14.5M3.5 18H16a4.5 4.5 0 0 0 4.5-4.5V12",
  volume: "M4 9.5h3.5L12 5v14l-4.5-4.5H4zM15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12",
  mute: "M4 9.5h3.5L12 5v14l-4.5-4.5H4zM16 9.5l5 5M21 9.5l-5 5",
  home: "M4 10.5 12 4l8 6.5V20h-5.5v-6h-5v6H4z",
  search: "M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13ZM15.5 15.5 20 20",
  close: "M6 6l12 12M18 6 6 18",
  lyrics: "M12 2.5a3 3 0 0 1 3 3V12a3 3 0 0 1-6 0V5.5a3 3 0 0 1 3-3ZM18.5 10.5v1.5a6.5 6.5 0 0 1-13 0v-1.5M12 18.5v3",
};

// Filled glyphs; the rest are strokes
const FILLED = new Set<keyof typeof paths>(["play", "pause", "next", "previous", "home"]);

export function Icon({ name, size = 16 }: { name: keyof typeof paths; size?: number }) {
  const filled = FILLED.has(name);
  return (
    <svg
      className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden
      fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"}
      strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
