import { EventEmitter } from "node:events";
import net from "node:net";
import { encode, handshake, LineSplitter, type Message } from "./protocol";

export type Status = "connecting" | "connected" | "disconnected";

export interface ConnectionOptions {
  host: string;
  port: number;
  clientId: string;
  /** A socket for bulk requests (library pages, queue) so they don't delay live updates */
  noBroadcast?: boolean;
  maxRetryMs?: number;
}

const FIRST_RETRY_MS = 500;

/** One TCP socket to MusicBee Remote: handshake, keepalive and automatic reconnect. */
export class Connection extends EventEmitter<{ message: [Message]; status: [Status] }> {
  status: Status = "disconnected";
  private socket?: net.Socket;
  private retryMs = FIRST_RETRY_MS;
  private timer?: NodeJS.Timeout;
  private stopped = false;
  private readonly opts: ConnectionOptions;

  constructor(opts: ConnectionOptions) {
    super();
    this.opts = opts;
  }

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    clearTimeout(this.timer);
    this.socket?.destroy();
  }

  /** Returns false when not connected; MusicBee rejects commands sent before the handshake. */
  send(context: string, data: unknown = null): boolean {
    if (this.status !== "connected" || !this.socket) return false;
    this.socket.write(encode(context, data));
    return true;
  }

  private connect(): void {
    const { host, port, clientId, noBroadcast = false } = this.opts;
    this.setStatus("connecting");
    const socket = net.createConnection({ host, port });
    const splitter = new LineSplitter();
    this.socket = socket;
    socket.setEncoding("utf8");
    socket.setKeepAlive(true, 10_000);
    socket.on("connect", () => handshake(clientId, noBroadcast).forEach((line) => socket.write(line)));
    socket.on("data", (chunk: string) => splitter.push(chunk).forEach((line) => this.handle(line)));
    // Always followed by "close", which schedules the reconnect
    socket.on("error", (err) => console.error(`MusicBee ${host}:${port}: ${err.message}`));
    socket.on("close", () => {
      if (this.socket !== socket) return;
      this.setStatus("disconnected");
      if (this.stopped) return;
      this.timer = setTimeout(() => this.connect(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, this.opts.maxRetryMs ?? 10_000);
    });
  }

  private handle(line: string): void {
    let message: Message;
    try {
      message = JSON.parse(line);
    } catch {
      console.error("Unreadable message from MusicBee:", line.slice(0, 200));
      return;
    }
    if (message.context === "ping") {
      this.socket?.write(encode("pong", ""));
      return;
    }
    if (message.context === "protocol" && this.status !== "connected") {
      this.retryMs = FIRST_RETRY_MS;
      this.setStatus("connected");
    }
    this.emit("message", message);
  }

  private setStatus(status: Status): void {
    if (status === this.status) return;
    this.status = status;
    this.emit("status", status);
  }
}
