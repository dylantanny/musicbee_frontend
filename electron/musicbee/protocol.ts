// MusicBee Remote plugin, protocol V4: one JSON object per message, ended by CRLF.
// Reference: https://github.com/musicbeeremote/mbrc-plugin/blob/main/docs/protocol-v4.md

export interface Message {
  context: string;
  data: unknown;
}

export const encode = (context: string, data: unknown = null): string =>
  JSON.stringify({ context, data }) + "\r\n";

/** TCP can split one message across chunks or merge several into one. */
export class LineSplitter {
  private buffer = "";

  push(chunk: string): string[] {
    const lines = (this.buffer + chunk).split("\r\n");
    this.buffer = lines.pop() ?? "";
    return lines.filter(Boolean);
  }
}

// "Android" because some commands are only enabled for the official clients
export const handshake = (clientId: string, noBroadcast: boolean): string[] => [
  encode("player", "Android"),
  encode("protocol", { protocol_version: 4, no_broadcast: noBroadcast, client_id: clientId }),
];
