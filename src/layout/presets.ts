import type { AddPanelOptions, DockviewApi, IDockviewPanel } from "dockview-react";
import { moduleById, type PanelParams } from "./registry";

type Position = AddPanelOptions["position"];

export function addModule(api: DockviewApi, moduleId: string, position?: Position, initialWidth?: number): IDockviewPanel {
  const params: PanelParams = { moduleId };
  return api.addPanel({
    id: `${moduleId}-${crypto.randomUUID().slice(0, 8)}`,
    component: "module",
    title: moduleById[moduleId]?.title ?? moduleId,
    params,
    position,
    initialWidth,
  });
}

/** Starting layouts; each builds into an empty workspace */
export const PRESETS: Record<string, (api: DockviewApi) => void> = {
  Default(api) {
    const main = addModule(api, "browse");
    addModule(api, "library", { referencePanel: main, direction: "left" }, 300);
    const now = addModule(api, "now-playing", { referencePanel: main, direction: "right" }, 340);
    addModule(api, "queue", { referencePanel: now, direction: "below" });
  },
  "Lyrics focus"(api) {
    const main = addModule(api, "lyrics");
    addModule(api, "library", { referencePanel: main, direction: "left" }, 300);
    addModule(api, "now-playing", { referencePanel: main, direction: "right" }, 340);
  },
  Mini(api) {
    const now = addModule(api, "now-playing");
    addModule(api, "queue", { referencePanel: now, direction: "below" });
  },
};
