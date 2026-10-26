import { useEffect, useMemo, useRef } from "react";
import type { ModuleDef } from "../../layout/registry";
import { livePosition, send, usePlayer } from "../../state/player";
import { Empty } from "../../ui/Empty";
import { useNow } from "../../ui/time";
import { currentLine, parseLrc } from "./lrc";

/** Synced lyrics in their own scroller; shared by this panel, the Now playing card and the full-page view. */
export function SyncedLyrics() {
  const lyrics = usePlayer((s) => s.lyrics);
  const playing = usePlayer((s) => s.playState === "playing");
  usePlayer((s) => s.positionAt); // re-render on seeks and position resyncs
  const lines = useMemo(() => parseLrc(lyrics), [lyrics]);
  useNow(lines && playing ? 200 : null);
  const index = lines ? currentLine(lines, livePosition(usePlayer.getState())) : -1;
  const box = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLParagraphElement>(null);

  // scrollIntoView would also scroll every ancestor (e.g. the whole Now playing panel),
  // so only this scroller moves
  useEffect(() => {
    const el = active.current;
    if (el && box.current) box.current.scrollTo({ top: el.offsetTop - (box.current.clientHeight - el.offsetHeight) / 2, behavior: "smooth" });
  }, [index]);

  if (!lyrics.trim()) return <Empty text="No lyrics for this song" />;
  if (!lines) return <div className="lyrics" ref={box}><pre className="lyrics-plain">{lyrics}</pre></div>;
  return (
    <div className="lyrics" ref={box}>
      {lines.map((line, i) => (
        <p
          key={i}
          ref={i === index ? active : undefined}
          className={i === index ? "line active" : i < index ? "line past" : "line"}
          onClick={() => send("nowplayingposition", line.time)}
        >
          {line.text || "♪"}
        </p>
      ))}
    </div>
  );
}

function Lyrics() {
  return <div className="lyrics-panel"><SyncedLyrics /></div>;
}

export default { id: "lyrics", title: "Lyrics", component: Lyrics } satisfies ModuleDef;
