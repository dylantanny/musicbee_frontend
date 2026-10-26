import { describe, expect, it } from "vitest";
import { encode, handshake, LineSplitter } from "../electron/musicbee/protocol";

describe("protocol framing", () => {
  it("encodes one CRLF-terminated JSON object", () => {
    expect(encode("playervolume", 50)).toBe('{"context":"playervolume","data":50}\r\n');
  });

  it("reassembles messages split and merged across TCP chunks", () => {
    const splitter = new LineSplitter();
    const wire = encode("a", 1) + encode("b", "x\r") + encode("c", null);
    const chunks = [wire.slice(0, 7), wire.slice(7, 40), wire.slice(40)];
    const lines = chunks.flatMap((c) => splitter.push(c));
    expect(lines.map((l) => JSON.parse(l).context)).toEqual(["a", "b", "c"]);
  });

  it("identifies as Android before negotiating V4", () => {
    const [player, protocol] = handshake("me", true).map((l) => JSON.parse(l));
    expect(player).toEqual({ context: "player", data: "Android" });
    expect(protocol.data).toEqual({ protocol_version: 4, no_broadcast: true, client_id: "me" });
  });
});
