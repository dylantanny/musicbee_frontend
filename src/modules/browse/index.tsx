import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { ModuleDef } from "../../layout/registry";
import { searchTracks, shelvesByGenre, useLibrary, type Album } from "../../state/library";
import { send, usePlayer } from "../../state/player";
import type { LibraryTrack } from "../../state/reducer";
import { browse, useUi } from "../../state/ui";
import { Art, hueOf } from "../../ui/Art";
import { Empty } from "../../ui/Empty";
import { Icon } from "../../ui/icons";

// "now" replaces the queue with these files and starts the first one
const play = (tracks: LibraryTrack[]) => send("nowplayingqueue", { queue: "now", data: tracks.map((t) => t.src) });

interface Row { key: string; no: number | string; title: string; artist: string; album?: string; active: boolean; play: () => void }

/** Song rows for any source (library tracks or the queue); hovering a row swaps its number for a play button */
function TrackRows({ rows, showAlbum = true }: { rows: Row[]; showAlbum?: boolean }) {
  return (
    <>
      <div className="track-head muted small">
        <span className="track-no">#</span>
        <span className="row-main">Title</span>
        {showAlbum && <span className="track-album">Album</span>}
      </div>
      <ol className="list tracks">
        {rows.map((r) => (
          <li key={r.key} className={r.active ? "row active" : "row"} onDoubleClick={r.play} title="Double-click to play from here">
            <span className="track-no muted">
              <span className="track-num">{r.no}</span>
              <button className="row-play" aria-label={`Play ${r.title}`} onClick={r.play}>
                <Icon name="play" size={14} />
              </button>
            </span>
            <span className="row-main">
              <span className="row-title">{r.title}</span>
              <span className="muted small">{r.artist}</span>
            </span>
            {showAlbum && <span className="muted small track-album">{r.album}</span>}
          </li>
        ))}
      </ol>
    </>
  );
}

function TrackTable({ tracks, showAlbum = true }: { tracks: LibraryTrack[]; showAlbum?: boolean }) {
  const current = usePlayer((s) => s.track?.path);
  const rows = tracks.map((t, i): Row => ({
    key: t.src, no: showAlbum ? i + 1 : t.trackno || "", title: t.title, artist: t.artist, album: t.album,
    active: t.src === current, play: () => play(tracks.slice(i)),
  }));
  return <TrackRows rows={rows} showAlbum={showAlbum} />;
}

/** V4 can't list a playlist's songs, so the page shows the queue the playlist was just loaded into */
function PlaylistPage({ name, url }: { name: string; url: string }) {
  const queue = usePlayer((s) => s.queue);
  const current = usePlayer((s) => s.track?.path);
  const rows = queue.items.map((item, i): Row => ({
    key: `${item.position}-${item.path}`, no: i + 1, title: item.title, artist: item.artist,
    active: item.path === current, play: () => send("nowplayinglistplay", item.position),
  }));
  return (
    <>
      <Hero name={name} seed={name} kind="Playlist">{queue.total > 0 && <span>{queue.total} songs</span>}</Hero>
      <div className="actions">
        <button className="play-button" aria-label={`Play ${name}`} onClick={() => send("playlistplay", url)}><Icon name="play" size={24} /></button>
      </div>
      {rows.length ? <TrackRows rows={rows} showAlbum={false} /> : <Empty text="Loading playlist…" />}
    </>
  );
}

function AlbumCard({ album }: { album: Album }) {
  return (
    <button className="album-card" onClick={() => browse({ kind: "album", artist: album.artist, album: album.album })}>
      <Art name={album.album} seed={`${album.artist}/${album.album}`} className="album-art" />
      <span className="row-title">{album.album}</span>
      <span className="muted small">{album.artist}</span>
    </button>
  );
}

/** A titled row of cards; clipped to one line until "Show all" is clicked */
function Shelf({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="shelf">
      <div className="shelf-head">
        <h2 className="shelf-title">{title}</h2>
        <button className="link muted small" onClick={() => setOpen(!open)}>{open ? "Show less" : "Show all"}</button>
      </div>
      <div className={open ? "album-grid" : "album-grid one-row"}>{children}</div>
    </section>
  );
}

function Home({ artists, albums }: { artists: string[]; albums: Album[] }) {
  const shelves = useMemo(() => shelvesByGenre(albums), [albums]);
  return (
    <>
      <Shelf title="Artists">
        {artists.map((name) => (
          <button key={name} className="album-card artist-card" onClick={() => browse({ kind: "artist", name })}>
            <Art name={name} round className="album-art" />
            <span className="row-title">{name}</span>
            <span className="muted small">Artist</span>
          </button>
        ))}
      </Shelf>
      {shelves.map((s) => (
        <Shelf key={s.genre} title={s.genre}>
          {s.albums.map((a) => <AlbumCard key={`${a.artist}/${a.album}`} album={a} />)}
        </Shelf>
      ))}
    </>
  );
}

/** Tinted band at the top of an album or artist page, like a Spotify header */
function Hero({ name, seed, kind, round, children }: { name: string; seed: string; kind: string; round?: boolean; children: ReactNode }) {
  return (
    <header className="hero">
      <Art name={name} seed={seed} round={round} className="hero-art" />
      <div className="hero-text">
        <span className="small">{kind}</span>
        <h1 className="view-title">{name}</h1>
        <div className="hero-meta small">{children}</div>
      </div>
    </header>
  );
}

function PlayButton({ tracks }: { tracks: LibraryTrack[] }) {
  return (
    <div className="actions">
      <button className="play-button" aria-label="Play" onClick={() => play(tracks)}><Icon name="play" size={24} /></button>
    </div>
  );
}

function Browse() {
  const view = useUi((s) => s.browse);
  const { tracks, albums, artists, loading } = useLibrary();
  const query = view.kind === "search" ? view.query : "";
  const results = useMemo(() => searchTracks(tracks, query), [tracks, query]);

  let content;
  if (view.kind === "search") {
    content = results.length ? (
      <section className="shelf"><h2 className="shelf-title">Songs</h2><TrackTable tracks={results} /></section>
    ) : <Empty text={`No songs match "${query}". Try an artist, album or song title.`} />;
  } else if (view.kind === "artist") {
    const own = albums.filter((a) => a.artist === view.name);
    content = (
      <>
        <Hero name={view.name} seed={view.name} kind="Artist" round>{own.length > 0 && `${own.length} ${own.length === 1 ? "album" : "albums"}`}</Hero>
        {own.length ? (
          <>
            <PlayButton tracks={own.flatMap((a) => a.tracks)} />
            <Shelf title="Discography">{own.map((a) => <AlbumCard key={a.album} album={a} />)}</Shelf>
          </>
        ) : <Empty text={`No albums by ${view.name} in your MusicBee library.`} />}
      </>
    );
  } else if (view.kind === "album") {
    const album = albums.find((a) => a.artist === view.artist && a.album === view.album);
    content = album ? (
      <>
        <Hero name={album.album} seed={`${album.artist}/${album.album}`} kind="Album">
          <button className="link" onClick={() => browse({ kind: "artist", name: album.artist })}>{album.artist}</button>
          <span className="muted">{album.tracks.length} songs</span>
        </Hero>
        <PlayButton tracks={album.tracks} />
        <TrackTable tracks={album.tracks} showAlbum={false} />
      </>
    ) : <Empty text="This album is no longer in your library." />;
  } else if (view.kind === "playlist") {
    content = <PlaylistPage name={view.name} url={view.url} />;
  } else {
    content = albums.length ? <Home artists={artists} albums={albums} /> : <Empty text={loading ? "Loading library…" : "Your MusicBee library is empty. Add music in MusicBee and it shows up here."} />;
  }

  // The hero band picks up the page's hue; other views stay on the plain surface
  const tint = view.kind === "album" ? `${view.artist}/${view.album}` : view.kind === "artist" || view.kind === "playlist" ? view.name : null;
  return (
    <div className={tint ? "browse tinted" : "browse"} style={tint ? ({ "--hue": hueOf(tint) } as CSSProperties) : undefined}>
      <div className="browse-bar">
        <button className={view.kind === "home" ? "round-button on" : "round-button"} aria-label="Home" onClick={() => browse({ kind: "home" })}>
          <Icon name="home" size={20} />
        </button>
        <label className="search">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="What do you want to play?"
            value={query}
            onChange={(e) => browse(e.target.value ? { kind: "search", query: e.target.value } : { kind: "home" })}
          />
        </label>
        {loading && <span className="muted small">Loading library… {tracks.length}</span>}
      </div>
      {content}
    </div>
  );
}

export default { id: "browse", title: "Browse", component: Browse } satisfies ModuleDef;
