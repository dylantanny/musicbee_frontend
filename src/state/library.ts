import { useEffect, useMemo } from "react";
import { fetchList, usePlayer } from "./player";
import type { LibraryTrack } from "./reducer";

export interface Album { artist: string; album: string; tracks: LibraryTrack[] }

const artistOf = (t: LibraryTrack) => t.album_artist || t.artist || "Unknown artist";

/** V4 has no artist/album lookups that work for every client, so both are derived from the track list. */
export function groupLibrary(tracks: LibraryTrack[]): { artists: string[]; albums: Album[] } {
  const albums = new Map<string, Album>();
  for (const t of tracks) {
    const artist = artistOf(t);
    const key = `${artist}\u0000${t.album}`;
    if (!albums.has(key)) albums.set(key, { artist, album: t.album || "Unknown album", tracks: [] });
    albums.get(key)!.tracks.push(t);
  }
  for (const a of albums.values()) a.tracks.sort((x, y) => x.disc - y.disc || x.trackno - y.trackno);
  const byName = (x: string, y: string) => x.localeCompare(y, undefined, { sensitivity: "base", numeric: true });
  return {
    artists: [...new Set(tracks.map(artistOf))].sort(byName),
    albums: [...albums.values()].sort((x, y) => byName(x.album, y.album)),
  };
}

export interface Shelf { genre: string; albums: Album[] }

/** Home-view shelves: albums grouped by their first track's genre, biggest genre first. */
export function shelvesByGenre(albums: Album[]): Shelf[] {
  const shelves = new Map<string, Album[]>();
  for (const a of albums) {
    const genre = a.tracks[0]?.genre?.trim() || "Other";
    if (!shelves.has(genre)) shelves.set(genre, []);
    shelves.get(genre)!.push(a);
  }
  return [...shelves].map(([genre, albums]) => ({ genre, albums })).sort((x, y) => y.albums.length - x.albums.length);
}

/** V4 has no library search either, so it runs over the local copy of the track list. */
export function searchTracks(tracks: LibraryTrack[], query: string, limit = 200): LibraryTrack[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const results: LibraryTrack[] = [];
  for (const t of tracks) {
    const haystack = `${t.title} ${t.artist} ${t.album_artist} ${t.album}`.toLowerCase();
    if (words.every((w) => haystack.includes(w)) && results.push(t) >= limit) break;
  }
  return results;
}

// Several modules use the library; only the first should trigger the fetch per connection
let requested = false;

/** The whole MusicBee track list, fetched (in pages) the first time any module needs it. */
export function useLibrary() {
  const status = usePlayer((s) => s.status);
  const library = usePlayer((s) => s.library);
  useEffect(() => {
    if (status !== "connected") requested = false;
    else if (!requested) {
      requested = true;
      fetchList("browsetracks");
    }
  }, [status]);
  const grouped = useMemo(() => groupLibrary(library.items), [library.items]);
  return { tracks: library.items, loading: library.items.length < library.total, ...grouped };
}
