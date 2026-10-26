import type { Bridge } from "../electron/preload";

declare global {
  interface Window {
    bridge: Bridge;
  }
}
