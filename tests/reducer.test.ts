import { describe, expect, it } from "vitest";
import { initialState, PAGE_SIZE, reduce, type PlayerState } from "../src/state/reducer";

const apply = (state: PlayerState, context: string, data: unknown) => {
  const [change, effects] = reduce(state, { context, data });
  return { state: { ...state, ...change }, effects };
};

describe("reduce", () => {
  it("normalises playerstatus, whose volume is a string", () => {
    const { state } = apply(initialState, "playerstatus", {
      playerstate: "Playing", playervolume: "75", playermute: false, playershuffle: "off", playerrepeat: "All", scrobbler: true,
    });
    expect(state).toMatchObject({ playState: "playing", volume: 75, mute: false, repeat: "All" });
  });

  it("reads string ratings, with an empty string meaning unrated", () => {
    expect(apply(initialState, "nowplayingrating", "4").state.rating).toBe(4);
    expect(apply(initialState, "nowplayingrating", "").state.rating).toBe(0);
  });

  it("handles every cover status", () => {
    expect(apply(initialState, "nowplayingcover", { status: 200, cover: "QUJD" }).state.cover).toBe("data:image/jpeg;base64,QUJD");
    expect(apply({ ...initialState, cover: "old" }, "nowplayingcover", { status: 404, cover: "" }).state.cover).toBeNull();
    const pending = apply(initialState, "nowplayingcover", { status: 1, cover: "" });
    expect(pending.state.cover).toBeNull();
    expect(pending.effects.send).toEqual(["nowplayingcover", null]);
  });

  it("clears lyrics when MusicBee has none", () => {
    expect(apply({ ...initialState, lyrics: "old" }, "nowplayinglyrics", { status: 404, lyrics: "" }).state.lyrics).toBe("");
  });

  it("collects paged lists and asks for the next page until complete", () => {
    const items = (from: number, n: number) => Array.from({ length: n }, (_, i) => ({ src: String(from + i) }));
    let r = apply(initialState, "browsetracks", { offset: 0, limit: PAGE_SIZE, total: 700, data: items(0, 500) });
    expect(r.effects.send).toEqual(["browsetracks", { offset: 500, limit: PAGE_SIZE }]);
    r = apply(r.state, "browsetracks", { offset: 500, limit: PAGE_SIZE, total: 700, data: items(500, 200) });
    expect(r.state.library.items).toHaveLength(700);
    expect(r.effects.send).toBeUndefined();
  });

  it("refetches the queue when MusicBee says it changed", () => {
    expect(apply(initialState, "nowplayinglistchanged", null).effects.send?.[0]).toBe("nowplayinglist");
  });

  it("ignores contexts it doesn't know", () => {
    expect(reduce(initialState, { context: "scrobbler", data: true })).toEqual([{}, {}]);
  });
});
