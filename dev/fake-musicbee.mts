// A stand-in for MusicBee + the MusicBee Remote plugin (protocol V4), so the UI
// can be built and tested on a Mac. Run: npm run fake  (PORT=3000 by default)
import net from "node:net";
import { pathToFileURL } from "node:url";

interface FakeTrack { artist: string; title: string; album: string; year: string; path: string; length: number; lyrics: string }

const LRC = (title: string) =>
  [0, 4, 8, 12, 16, 20, 24, 28].map((s, i) => `[00:${String(s).padStart(2, "0")}.00] ${title}, line ${i + 1}`).join("\n");

const NOW_PLAYING: FakeTrack[] = [
  { artist: "Tame Impala", title: "Dracula", album: "Deadbeat", year: "2025", path: "C:\\Music\\dracula.opus", length: 205_000, lyrics: LRC("Dracula") },
  { artist: "Tame Impala", title: "Let It Happen", album: "Currents", year: "2015", path: "C:\\Music\\let-it-happen.opus", length: 467_000, lyrics: "Plain lyrics\nwithout timestamps" },
  { artist: "YOASOBI", title: "Idol", album: "THE BOOK 3", year: "2023", path: "C:\\Music\\idol.opus", length: 213_000, lyrics: "" },
];

// Big enough to need several pages
const LIBRARY = Array.from({ length: 1234 }, (_, i) => ({
  src: `C:\\Music\\lib\\${i}.opus`, artist: `Artist ${i % 40}`, title: `Song ${i}`, trackno: (i % 12) + 1, disc: 1,
  album: `Album ${i % 100}`, album_artist: `Artist ${i % 40}`, genre: "Rock",
}));
const PLAYLISTS = [{ name: "Favourites", url: "playlist://favourites" }, { name: "Gym", url: "playlist://gym" }];

// 1x1 green PNG
const COVER = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export function startFakeMusicBee(port = 3000, { pingMs = 15_000 } = {}) {
  const state = { index: 0, playing: true, startedAt: Date.now(), offset: 0, volume: 60, mute: false, shuffle: "off", repeat: "None", rating: "3" };
  const queue = [...NOW_PLAYING];
  const clients = new Set<{ socket: net.Socket; broadcast: boolean }>();
  const stats = { pongs: 0, received: [] as string[] };

  const track = () => queue[state.index % queue.length];
  const position = () => Math.min(state.offset + (state.playing ? Date.now() - state.startedAt : 0), track().length);
  const seek = (ms: number) => Object.assign(state, { offset: ms, startedAt: Date.now() });
  const page = <T,>(items: T[], d: any) => {
    const offset = d?.offset ?? 0, limit = d?.limit ?? 100;
    return { offset, limit, total: items.length, data: items.slice(offset, offset + limit) };
  };
  const status = () => ({
    playerstate: state.playing ? "Playing" : "Paused", playervolume: String(state.volume), playermute: state.mute,
    playershuffle: state.shuffle, playerrepeat: state.repeat, scrobbler: false,
  });
  const trackMessages = (): [string, unknown][] => {
    const { artist, title, album, year, path, lyrics } = track();
    return [
      ["nowplayingtrack", { artist, title, album, year, path }],
      ["nowplayingrating", state.rating],
      ["nowplayingposition", { current: position(), total: track().length }],
      ["nowplayingcover", { status: 200, cover: COVER }],
      ["nowplayinglyrics", lyrics ? { status: 200, lyrics } : { status: 404, lyrics: "" }],
    ];
  };

  const write = (socket: net.Socket, context: string, data: unknown) => socket.write(JSON.stringify({ context, data }) + "\r\n");
  const broadcast = (context: string, data: unknown) => clients.forEach((c) => c.broadcast && write(c.socket, context, data));
  const changeTrack = (index: number) => {
    state.index = (index + queue.length) % queue.length;
    seek(0);
    trackMessages().forEach(([c, d]) => broadcast(c, d));
  };

  function handle(client: { socket: net.Socket; broadcast: boolean }, context: string, d: any) {
    const reply = (data: unknown) => write(client.socket, context, data);
    stats.received.push(context);
    switch (context) {
      case "player": return;
      case "protocol": client.broadcast = !d?.no_broadcast; return reply(4);
      case "pong": stats.pongs++; return;
      case "init":
        trackMessages().forEach(([c, data]) => write(client.socket, c, data));
        return write(client.socket, "playerstatus", status());
      case "playerplaypause":
        if (state.playing) seek(position());
        else state.startedAt = Date.now();
        state.playing = !state.playing;
        reply(true);
        return broadcast("playerstate", state.playing ? "Playing" : "Paused");
      case "playernext": reply(true); return changeTrack(state.index + 1);
      case "playerprevious": reply(true); return changeTrack(state.index - 1);
      case "playervolume": if (d !== null) state.volume = Number(d); return broadcast("playervolume", state.volume);
      case "playermute": state.mute = d === "toggle" ? !state.mute : Boolean(d); return broadcast("playermute", state.mute);
      case "playershuffle": state.shuffle = state.shuffle === "off" ? "shuffle" : "off"; return broadcast("playershuffle", state.shuffle);
      case "playerrepeat": if (d) state.repeat = d; return broadcast("playerrepeat", state.repeat);
      case "playerstatus": return reply(status());
      case "nowplayingposition": if (typeof d === "number") seek(d); return reply({ current: position(), total: track().length });
      case "nowplayingrating": if (d !== null) state.rating = d; return broadcast("nowplayingrating", state.rating);
      case "nowplayingcover": return reply({ status: 200, cover: COVER });
      case "nowplayinglist":
        return reply(page(queue.map((t, position) => ({ artist: t.artist, title: t.title, path: t.path, position })), d));
      case "nowplayinglistplay": reply(true); return changeTrack(Number(d));
      case "nowplayinglistremove":
        queue.splice(Number(d), 1);
        reply({ success: true, index: d });
        return broadcast("nowplayinglistchanged", null);
      case "nowplayingqueue":
        reply({ code: 200 });
        if (d?.queue === "now") {
          const picked = LIBRARY.filter((t) => d.data.includes(t.src));
          queue.splice(0, queue.length, ...picked.map((t) => ({ ...t, path: t.src, year: "", length: 180_000, lyrics: "" })));
          changeTrack(0);
          broadcast("nowplayinglistchanged", null);
        }
        return;
      case "playlistlist": return reply(page(PLAYLISTS, d));
      case "playlistplay": return reply(true);
      case "browsetracks": return reply(page(LIBRARY, d));
      default: return write(client.socket, "error", { message: `fake server doesn't know ${context}` });
    }
  }

  const server = net.createServer((socket) => {
    const client = { socket, broadcast: false };
    clients.add(client);
    let buffer = "";
    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => {
      const lines = (buffer + chunk).split("\r\n");
      buffer = lines.pop() ?? "";
      for (const line of lines.filter(Boolean)) {
        const { context, data } = JSON.parse(line);
        handle(client, context, data);
      }
    });
    socket.on("close", () => clients.delete(client));
    socket.on("error", () => clients.delete(client));
  });
  const pinger = setInterval(() => clients.forEach((c) => write(c.socket, "ping", "")), pingMs);
  // Moves to the next track when the current one ends, like a real player
  const ticker = setInterval(() => state.playing && position() >= track().length && changeTrack(state.index + 1), 1000);

  const ready = new Promise<number>((resolve) =>
    server.listen(port, "127.0.0.1", () => resolve((server.address() as net.AddressInfo).port)),
  );
  return {
    ready,
    stats,
    close: () => new Promise<void>((resolve) => {
      clearInterval(pinger);
      clearInterval(ticker);
      clients.forEach((c) => c.socket.destroy());
      server.close(() => resolve());
    }),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fake = startFakeMusicBee(Number(process.env.PORT ?? 3000));
  fake.ready.then((port) => console.log(`Fake MusicBee Remote listening on 127.0.0.1:${port}`));
}
