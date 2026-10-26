import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { Connection } from "./musicbee/connection";

const host = process.env.MUSICBEE_HOST ?? "127.0.0.1";
const port = Number(process.env.MUSICBEE_PORT ?? 3000);

// Replies to these can be large, so they go over a second socket that gets no broadcasts
const BULK_CONTEXTS = new Set(["nowplayinglist", "playlistlist", "browsetracks"]);

const live = new Connection({ host, port, clientId: "music-ui" });
const bulk = new Connection({ host, port, clientId: "music-ui-bulk", noBroadcast: true });

// Saved UI state (layout, theme) as one JSON file per key
const storePath = (key: string) => join(app.getPath("userData"), `${key.replace(/\W/g, "")}.json`);

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    backgroundColor: "#000000",
    title: "Music UI",
    webPreferences: { preload: join(__dirname, "../preload/preload.js") },
  });
  const forward = (channel: string) => (payload: unknown) => {
    if (!win.isDestroyed()) win.webContents.send(channel, payload);
  };
  live.on("message", forward("mb:message"));
  bulk.on("message", forward("mb:message"));
  live.on("status", forward("mb:status"));

  if (process.env.ELECTRON_RENDERER_URL) win.loadURL(process.env.ELECTRON_RENDERER_URL);
  else win.loadFile(join(__dirname, "../renderer/index.html"));
}

ipcMain.on("mb:send", (_event, context: string, data: unknown) => {
  const sent = (BULK_CONTEXTS.has(context) && bulk.send(context, data)) || live.send(context, data);
  if (!sent) console.warn(`Not connected to MusicBee - dropped ${context}`);
});
ipcMain.handle("mb:status", () => live.status);
ipcMain.handle("store:load", async (_event, key: string) => {
  try {
    return JSON.parse(await readFile(storePath(key), "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") console.error(`Could not read ${key}:`, err);
    return null;
  }
});
ipcMain.handle("store:save", (_event, key: string, value: unknown) =>
  writeFile(storePath(key), JSON.stringify(value, null, 2)),
);

app.whenReady().then(() => {
  live.start();
  bulk.start();
  createWindow();
});
app.on("window-all-closed", () => {
  live.stop();
  bulk.stop();
  app.quit();
});
