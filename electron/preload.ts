import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { Status } from "./musicbee/connection";
import type { Message } from "./musicbee/protocol";

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const handler = (_event: IpcRendererEvent, payload: T) => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.off(channel, handler);
}

// The renderer's only way to reach MusicBee and disk
const bridge = {
  send: (context: string, data: unknown = null) => ipcRenderer.send("mb:send", context, data),
  onMessage: (listener: (message: Message) => void) => subscribe("mb:message", listener),
  onStatus: (listener: (status: Status) => void) => subscribe("mb:status", listener),
  getStatus: (): Promise<Status> => ipcRenderer.invoke("mb:status"),
  load: <T>(key: string): Promise<T | null> => ipcRenderer.invoke("store:load", key),
  save: (key: string, value: unknown): Promise<void> => ipcRenderer.invoke("store:save", key, value),
};

contextBridge.exposeInMainWorld("bridge", bridge);

export type Bridge = typeof bridge;
