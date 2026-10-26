import { useEffect } from "react";
import {
  DockviewReact, themeDark,
  type DockviewApi, type DockviewReadyEvent, type DockviewTheme, type IDockviewPanelProps, type SerializedDockview,
} from "dockview-react";
import { useUi } from "../state/ui";
import { ModuleContainer } from "./ModuleContainer";
import { PRESETS } from "./presets";
import { moduleById, type PanelParams } from "./registry";

const theme: DockviewTheme = { ...themeDark, className: `${themeDark.className} spotify`, gap: 8 };

function ModulePanel({ params, api }: IDockviewPanelProps<PanelParams>) {
  const Body = moduleById[params.moduleId]?.component;
  return (
    <ModuleContainer params={params} api={api}>
      {Body ? <Body /> : <p className="empty">Unknown module "{params.moduleId}"</p>}
    </ModuleContainer>
  );
}

const components = { module: ModulePanel };

let workspace: DockviewApi | undefined;
export const getWorkspace = () => workspace;

export function applyPreset(name: string): void {
  if (!workspace) return;
  workspace.clear();
  PRESETS[name](workspace);
}

// Tabs are only needed to drag panels (edit mode) or to switch between stacked panels
function refreshHeaders(api: DockviewApi): void {
  const editing = useUi.getState().editing;
  for (const group of api.groups) group.header.hidden = !editing && group.panels.length <= 1;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function saveSoon(api: DockviewApi): void {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => window.bridge.save("layout", api.toJSON()), 500);
}

async function onReady({ api }: DockviewReadyEvent): Promise<void> {
  workspace = api;
  api.onDidLayoutChange(() => {
    refreshHeaders(api);
    saveSoon(api);
  });
  const saved = await window.bridge.load<SerializedDockview>("layout");
  if (saved) {
    try {
      api.fromJSON(saved);
    } catch (err) {
      console.error("Saved layout could not be loaded; using the default:", err);
      api.clear();
    }
  }
  if (api.panels.length === 0) PRESETS.Default(api);
  refreshHeaders(api);
}

export function Workspace() {
  const editing = useUi((s) => s.editing);
  useEffect(() => {
    if (workspace) refreshHeaders(workspace);
  }, [editing]);
  return (
    <DockviewReact
      className="workspace"
      components={components}
      onReady={onReady}
      theme={theme}
      locked={!editing}
      disableDnd={!editing}
    />
  );
}
