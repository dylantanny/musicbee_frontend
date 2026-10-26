import type { ModuleDef } from "../../layout/registry";
import { send, usePlayer } from "../../state/player";
import { Empty } from "../../ui/Empty";
import { SyncedLyrics } from "../lyrics";

function Stars({ value }: { value: number }) {
  return (
    <div className="stars" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={n <= value ? "star on" : "star"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          // Clicking the current rating clears it
          onClick={() => send("nowplayingrating", n === value ? "" : String(n))}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function NowPlaying() {
  const track = usePlayer((s) => s.track);
  const cover = usePlayer((s) => s.cover);
  const rating = usePlayer((s) => s.rating);
  const hasLyrics = usePlayer((s) => s.lyrics.trim() !== "");
  if (!track) return <Empty text="Nothing playing. Double-click a song to start." />;
  return (
    <div className="now-playing">
      <h2 className="module-title np-context">{track.album || "Now playing"}</h2>
      {cover ? <img className="cover" src={cover} alt="" /> : <div className="cover placeholder">♪</div>}
      <div className="np-text">
        <h2 className="np-title">{track.title}</h2>
        <p className="muted">{track.artist}</p>
        <Stars value={rating} />
      </div>
      {hasLyrics && (
        <section className="card lyrics-card">
          <h3 className="card-title">Lyrics</h3>
          <SyncedLyrics />
        </section>
      )}
    </div>
  );
}

export default { id: "now-playing", title: "Now playing", component: NowPlaying } satisfies ModuleDef;
