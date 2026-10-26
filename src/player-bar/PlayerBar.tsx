import { useState, type CSSProperties } from "react";
import { openInBrowse } from "../layout/open";
import { livePosition, send, usePlayer } from "../state/player";
import type { PlayerState } from "../state/reducer";
import { useUi } from "../state/ui";
import { Icon } from "../ui/icons";
import { formatTime, useNow } from "../ui/time";

// Range inputs can't style their filled part, so the track is a gradient up to --fill
const fill = (value: number, max: number) => ({ "--fill": `${(100 * value) / (max || 1)}%` }) as CSSProperties;

const NEXT_REPEAT: Record<PlayerState["repeat"], PlayerState["repeat"]> = { None: "All", All: "One", One: "None" };

/** Fixed at the bottom of the window, outside the modular workspace, so it can't be closed. */
export function PlayerBar() {
  const track = usePlayer((s) => s.track);
  const cover = usePlayer((s) => s.cover);
  const playing = usePlayer((s) => s.playState === "playing");
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const volume = usePlayer((s) => s.volume);
  const mute = usePlayer((s) => s.mute);
  const duration = usePlayer((s) => s.duration);
  const lyricsOpen = useUi((s) => s.lyricsOpen);
  usePlayer((s) => s.positionAt); // re-render on seeks and position resyncs
  useNow(playing ? 500 : null);
  // While dragging, show the drag position and only seek on release
  const [seeking, setSeeking] = useState<number | null>(null);
  const position = seeking ?? livePosition(usePlayer.getState());

  return (
    <footer className="player-bar">
      <div className="pb-track">
        {cover ? <img className="pb-cover" src={cover} alt="" /> : <div className="pb-cover placeholder" />}
        <div className="pb-text">
          <span className="row-title">{track?.title ?? "Not playing"}</span>
          {track?.artist && <button className="link pb-artist small" onClick={() => openInBrowse({ kind: "artist", name: track.artist })}>{track.artist}</button>}
        </div>
      </div>

      <div className="pb-center">
        <div className="pb-controls">
          <button className={shuffle !== "off" ? "icon-button on" : "icon-button"} aria-label="Shuffle" onClick={() => send("playershuffle", "toggle")}><Icon name="shuffle" /></button>
          <button className="icon-button" aria-label="Previous" onClick={() => send("playerprevious")}><Icon name="previous" /></button>
          <button className="play-pause" aria-label={playing ? "Pause" : "Play"} onClick={() => send("playerplaypause")}>
            <Icon name={playing ? "pause" : "play"} size={16} />
          </button>
          <button className="icon-button" aria-label="Next" onClick={() => send("playernext")}><Icon name="next" /></button>
          <button
            className={repeat !== "None" ? "icon-button on" : "icon-button"}
            aria-label={`Repeat: ${repeat}`}
            onClick={() => send("playerrepeat", NEXT_REPEAT[repeat])}
          >
            <Icon name="repeat" />
            {repeat === "One" && <span className="repeat-one">1</span>}
          </button>
        </div>
        <div className="pb-seek">
          <span className="muted small">{formatTime(position)}</span>
          <input
            type="range"
            aria-label="Seek"
            min={0}
            max={duration || 1}
            value={Math.min(position, duration || 1)}
            disabled={!duration}
            style={fill(Math.min(position, duration), duration)}
            onChange={(e) => setSeeking(Number(e.target.value))}
            onPointerUp={() => {
              if (seeking !== null) send("nowplayingposition", Math.round(seeking));
              setSeeking(null);
            }}
          />
          <span className="muted small">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="pb-volume">
        <button
          className={lyricsOpen ? "icon-button on" : "icon-button"}
          aria-label="Lyrics"
          aria-pressed={lyricsOpen}
          onClick={() => useUi.setState({ lyricsOpen: !lyricsOpen })}
        >
          <Icon name="lyrics" />
        </button>
        <button className="icon-button" aria-label={mute ? "Unmute" : "Mute"} onClick={() => send("playermute", "toggle")}>
          <Icon name={mute || volume === 0 ? "mute" : "volume"} />
        </button>
        <input
          type="range"
          aria-label="Volume"
          min={0}
          max={100}
          value={mute ? 0 : volume}
          style={fill(mute ? 0 : volume, 100)}
          onChange={(e) => {
            usePlayer.setState({ volume: Number(e.target.value) }); // feels instant; MusicBee confirms
            send("playervolume", Number(e.target.value));
          }}
        />
      </div>
    </footer>
  );
}
