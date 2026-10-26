import { afterEach, describe, expect, it } from "vitest";
import { startFakeMusicBee } from "../dev/fake-musicbee.mts";
import { Connection, type Status } from "../electron/musicbee/connection";
import type { Message } from "../electron/musicbee/protocol";

const until = async (check: () => boolean, ms = 3000) => {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error("timed out");
    await new Promise((r) => setTimeout(r, 20));
  }
};

describe("Connection against the fake MusicBee", () => {
  const cleanups: (() => unknown)[] = [];
  afterEach(async () => {
    for (const c of cleanups.splice(0)) await c();
  });

  async function setup(pingMs = 15_000) {
    const fake = startFakeMusicBee(0, { pingMs });
    const port = await fake.ready;
    const conn = new Connection({ host: "127.0.0.1", port, clientId: "test", maxRetryMs: 100 });
    const messages: Message[] = [];
    const statuses: Status[] = [];
    conn.on("message", (m) => messages.push(m));
    conn.on("status", (s) => statuses.push(s));
    cleanups.push(() => conn.stop(), () => fake.close());
    conn.start();
    return { fake, port, conn, messages, statuses };
  }

  it("handshakes, then receives state after init", async () => {
    const { conn, messages } = await setup();
    await until(() => conn.status === "connected");
    conn.send("init");
    await until(() => messages.some((m) => m.context === "playerstatus"));
    expect(messages.find((m) => m.context === "nowplayingtrack")?.data).toMatchObject({ title: "Dracula" });
  });

  it("drops commands sent before the handshake", async () => {
    const { conn, fake } = await setup();
    expect(conn.send("playernext")).toBe(false);
    await until(() => conn.status === "connected");
    expect(fake.stats.received).not.toContain("playernext");
  });

  it("answers pings so the server keeps the connection", async () => {
    const { fake, conn } = await setup(50);
    await until(() => conn.status === "connected");
    await until(() => fake.stats.pongs >= 2);
  });

  it("gets broadcasts for changes it caused", async () => {
    const { conn, messages } = await setup();
    await until(() => conn.status === "connected");
    conn.send("playerplaypause");
    await until(() => messages.some((m) => m.context === "playerstate" && m.data === "Paused"));
  });

  it("reconnects after MusicBee restarts", async () => {
    const { fake, port, conn, statuses } = await setup();
    await until(() => conn.status === "connected");
    await fake.close();
    await until(() => conn.status !== "connected");
    const restarted = startFakeMusicBee(port);
    cleanups.push(() => restarted.close());
    await restarted.ready;
    await until(() => conn.status === "connected");
    expect(statuses.filter((s) => s === "connected")).toHaveLength(2);
  });
});
