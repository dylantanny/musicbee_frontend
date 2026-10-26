import { create } from "zustand";
import { initialState, PAGE_SIZE, reduce, type PlayerState } from "./reducer";

export const usePlayer = create<PlayerState>(() => initialState);

export const send = (context: string, data: unknown = null) => window.bridge.send(context, data);

export const fetchList = (context: "nowplayinglist" | "playlistlist" | "browsetracks") =>
  send(context, { offset: 0, limit: PAGE_SIZE });

/** Wires the store to MusicBee. Call once at startup. */
export function connectPlayer(): () => void {
  // Asked for by the renderer (not on connect) so state isn't lost if the window loads later
  const onConnected = () => {
    send("init");
    fetchList("nowplayinglist");
    fetchList("playlistlist");
  };
  const offMessage = window.bridge.onMessage((message) => {
    const [change, effects] = reduce(usePlayer.getState(), message);
    usePlayer.setState(change);
    if (effects.send) send(...effects.send);
    if (["error", "notallowed", "commandunavailable"].includes(message.context)) {
      console.warn("MusicBee refused a command:", message);
    }
  });
  const offStatus = window.bridge.onStatus((status) => {
    usePlayer.setState({ status });
    if (status === "connected") onConnected();
  });
  window.bridge.getStatus().then((status) => {
    usePlayer.setState({ status });
    if (status === "connected") onConnected();
  });
  // MusicBee doesn't stream the position, so resync now and then while playing
  const resync = setInterval(() => {
    if (usePlayer.getState().playState === "playing") send("nowplayingposition", null);
  }, 10_000);
  return () => {
    offMessage();
    offStatus();
    clearInterval(resync);
  };
}

/** Current position in ms, extrapolated from the last update while playing. */
export function livePosition(s: PlayerState, now = Date.now()): number {
  const elapsed = s.playState === "playing" ? now - s.positionAt : 0;
  return Math.min(s.position + elapsed, s.duration || Infinity);
}
