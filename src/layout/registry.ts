import type { FC } from "react";
import type { Theme } from "../state/ui";
import browse from "../modules/browse";
import library from "../modules/library";
import lyrics from "../modules/lyrics";
import nowPlaying from "../modules/now-playing";
import queue from "../modules/queue";

/** Everything a module provides. The container adds the header, colours and close button. */
export interface ModuleDef {
  id: string;
  title: string;
  component: FC;
}

/** Saved with the layout for each panel */
export interface PanelParams {
  moduleId: string;
  colors?: Partial<Pick<Theme, "surface" | "text" | "accent">>;
}

// To add a module: create src/modules/<name>/index.tsx exporting a ModuleDef, then list it here
export const MODULES: ModuleDef[] = [library, browse, nowPlaying, queue, lyrics];

export const moduleById: Record<string, ModuleDef | undefined> = Object.fromEntries(MODULES.map((m) => [m.id, m]));
