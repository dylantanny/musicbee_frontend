import type { Status } from "../../electron/musicbee/connection";
import type { Message } from "../../electron/musicbee/protocol";

export interface Track { artist: string; title: string; album: string; year: string; path: string }
export interface QueueItem { artist: string; title: string; path: string; position: number }
export interface Playlist { name: string; url: string }
export interface LibraryTrack {
  src: string; artist: string; title: string; album: string; album_artist: string;
  genre: string; trackno: number; disc: number;
}
export interface Paged<T> { items: T[]; total: number }

export interface PlayerState {
  status: Status;
  playState: "playing" | "paused" | "stopped";
  volume: number;
  mute: boolean;
  shuffle: "off" | "shuffle" | "autodj";
  repeat: "None" | "All" | "One";
  track: Track | null;
  /** Milliseconds, as of positionAt (Date.now()); the UI extrapolates while playing */
  position: number;
  duration: number;
  positionAt: number;
  cover: string | null;
  lyrics: string;
  rating: number;
  queue: Paged<QueueItem>;
  playlists: Paged<Playlist>;
  library: Paged<LibraryTrack>;
}

export const PAGE_SIZE = 500;
const empty = { items: [], total: 0 };

export const initialState: PlayerState = {
  status: "disconnected", playState: "stopped", volume: 0, mute: false, shuffle: "off", repeat: "None",
  track: null, position: 0, duration: 0, positionAt: 0, cover: null, lyrics: "", rating: 0,
  queue: empty, playlists: empty, library: empty,
};

// Paged list replies, keyed by context
const LISTS = { nowplayinglist: "queue", playlistlist: "playlists", browsetracks: "library" } as const;

const PLAY_STATES: Record<string, PlayerState["playState"]> = {
  Playing: "playing", Paused: "paused", Stopped: "stopped",
};

export interface Effects {
  /** Follow-up command the store should send, e.g. the next page of a list */
  send?: [context: string, data: unknown];
}

/** Turns one MusicBee message into a state change. The protocol's types are
 * inconsistent (volume is a string inside playerstatus, ratings are strings),
 * so everything is normalised here and nowhere else. */
export function reduce(state: PlayerState, { context, data }: Message): [Partial<PlayerState>, Effects] {
  const d = data as any;
  switch (context) {
    case "playerstatus":
      return [{
        playState: PLAY_STATES[d.playerstate] ?? "stopped", volume: Number(d.playervolume),
        mute: Boolean(d.playermute), shuffle: d.playershuffle, repeat: d.playerrepeat,
      }, {}];
    case "playerstate": return [{ playState: PLAY_STATES[d] ?? "stopped" }, {}];
    case "playervolume": return [{ volume: Number(d) }, {}];
    case "playermute": return [{ mute: Boolean(d) }, {}];
    case "playershuffle": return [{ shuffle: d }, {}];
    case "playerrepeat": return [{ repeat: d }, {}];
    case "nowplayingtrack": return [{ track: d }, { send: ["nowplayingposition", null] }];
    case "nowplayingposition":
      return [{ position: Number(d.current), duration: Number(d.total), positionAt: Date.now() }, {}];
    case "nowplayingcover":
      // 1 = ready but not included in this message, so ask for it again
      if (d.status === 1) return [{}, { send: ["nowplayingcover", null] }];
      return [{ cover: d.status === 200 && d.cover ? `data:image/jpeg;base64,${d.cover}` : null }, {}];
    case "nowplayinglyrics": return [{ lyrics: d.status === 200 ? d.lyrics : "" }, {}];
    case "nowplayingrating": return [{ rating: Number(d) || 0 }, {}];
    case "nowplayinglistchanged": return [{}, { send: ["nowplayinglist", { offset: 0, limit: PAGE_SIZE }] }];
  }
  if (context in LISTS) {
    const key = LISTS[context as keyof typeof LISTS];
    const offset = Number(d.offset) || 0;
    const items = [...(offset === 0 ? [] : state[key].items.slice(0, offset)), ...d.data];
    const more = d.data.length > 0 && items.length < d.total;
    return [
      { [key]: { items, total: d.total } },
      more ? { send: [context, { offset: items.length, limit: PAGE_SIZE }] } : {},
    ];
  }
  return [{}, {}];
}
