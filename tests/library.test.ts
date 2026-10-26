import { describe, expect, it } from "vitest";
import { groupLibrary, searchTracks, shelvesByGenre } from "../src/state/library";
import type { LibraryTrack } from "../src/state/reducer";

const t = (title: string, album: string, artist: string, trackno: number, album_artist = ""): LibraryTrack =>
  ({ src: title, title, album, artist, album_artist, trackno, disc: 1, genre: "" });

const tracks = [t("B", "Currents", "Tame Impala", 2), t("A", "Currents", "Tame Impala", 1), t("Idol", "Idol", "YOASOBI", 1, "YOASOBI")];

describe("library", () => {
  it("groups albums by album artist, in track order", () => {
    const { artists, albums } = groupLibrary(tracks);
    expect(artists).toEqual(["Tame Impala", "YOASOBI"]);
    expect(albums.find((a) => a.album === "Currents")!.tracks.map((x) => x.title)).toEqual(["A", "B"]);
  });

  it("sorts names naturally", () => {
    const { artists } = groupLibrary(["Artist 10", "Artist 2", "artist 1"].map((a) => t("x" + a, "Al", a, 1)));
    expect(artists).toEqual(["artist 1", "Artist 2", "Artist 10"]);
  });

  it("searches across fields, all words must match", () => {
    expect(searchTracks(tracks, "tame b").map((x) => x.title)).toEqual(["B"]);
    expect(searchTracks(tracks, "  ")).toEqual([]);
  });

  it("shelves albums by genre, biggest first, blank genres as Other", () => {
    const g = (album: string, genre: string) => ({ ...t(album, album, "X", 1), genre });
    const { albums } = groupLibrary([g("A", "Jazz"), g("B", "Rock"), g("C", "Rock"), g("D", " ")]);
    expect(shelvesByGenre(albums).map((s) => [s.genre, s.albums.length])).toEqual([["Rock", 2], ["Jazz", 1], ["Other", 1]]);
  });
});
