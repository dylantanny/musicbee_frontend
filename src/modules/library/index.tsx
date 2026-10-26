import { useState } from "react";
import { openInBrowse } from "../../layout/open";
import type { ModuleDef } from "../../layout/registry";
import { useLibrary } from "../../state/library";
import { send, usePlayer } from "../../state/player";
import { browse, useUi } from "../../state/ui";
import { Art } from "../../ui/Art";

type Filter = "playlists" | "artists" | null;

// Playing it is what loads its songs into the queue, which the playlist page lists
function openPlaylist(name: string, url: string) {
  send("playlistplay", url);
  openInBrowse({ kind: "playlist", name, url });
}

function Library() {
  const playlists = usePlayer((s) => s.playlists.items);
  const view = useUi((s) => s.browse);
  const { artists, loading } = useLibrary();
  const [filter, setFilter] = useState<Filter>(null);
  const chip = (value: Exclude<Filter, null>, label: string) => (
    <button className={filter === value ? "chip on" : "chip"} onClick={() => setFilter(filter === value ? null : value)}>
      {label}
    </button>
  );

  return (
    <nav className="library">
      <header className="module-head">
        <h2 className="module-title">Your library</h2>
        <div className="chips">{chip("playlists", "Playlists")}{chip("artists", "Artists")}</div>
      </header>
      <ul className="list">
        {filter !== "artists" && playlists.map((p) => (
          <li
            key={p.url}
            className={view.kind === "playlist" && view.url === p.url ? "row active" : "row"}
            onClick={() => openPlaylist(p.name, p.url)}
            title="Play this playlist"
          >
            <Art name={p.name} className="thumb" />
            <span className="row-main">
              <span className="row-title">{p.name}</span>
              <span className="muted small">Playlist</span>
            </span>
          </li>
        ))}
        {filter !== "playlists" && artists.map((name) => (
          <li
            key={name}
            className={view.kind === "artist" && view.name === name ? "row active" : "row"}
            onClick={() => browse({ kind: "artist", name })}
          >
            <Art name={name} round className="thumb" />
            <span className="row-main">
              <span className="row-title">{name}</span>
              <span className="muted small">Artist</span>
            </span>
          </li>
        ))}
      </ul>
      {loading && <p className="muted small library-loading">Loading library…</p>}
    </nav>
  );
}

export default { id: "library", title: "Your library", component: Library } satisfies ModuleDef;
