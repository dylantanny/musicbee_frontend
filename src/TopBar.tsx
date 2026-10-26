import { applyPreset, getWorkspace } from "./layout/Workspace";
import { addModule, PRESETS } from "./layout/presets";
import { MODULES } from "./layout/registry";
import { usePlayer } from "./state/player";
import { DEFAULT_THEME, useUi, type Theme } from "./state/ui";

const THEME_FIELDS: [keyof Theme, string][] = [
  ["bg", "Window"], ["surface", "Panels"], ["text", "Text"], ["accent", "Accent"],
];

const STATUS_TEXT = { connected: "Connected to MusicBee", connecting: "Connecting to MusicBee…", disconnected: "MusicBee not reachable" };

export function TopBar() {
  const editing = useUi((s) => s.editing);
  const theme = useUi((s) => s.theme);
  const status = usePlayer((s) => s.status);

  const add = (moduleId: string) => {
    const api = getWorkspace();
    if (!api) return;
    const active = api.activePanel;
    addModule(api, moduleId, active ? { referencePanel: active, direction: "right" } : undefined);
  };

  return (
    <header className="top-bar">
      <span className={`status-dot ${status}`} title={STATUS_TEXT[status]} />
      <span className="muted small">{STATUS_TEXT[status]}</span>
      <div className="spacer" />
      {editing && (
        <div className="edit-tools">
          <select value="" onChange={(e) => e.target.value && add(e.target.value)} aria-label="Add panel">
            <option value="">+ Add panel</option>
            {MODULES.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <select
            value=""
            aria-label="Load layout"
            onChange={(e) => e.target.value && confirm(`Replace the current layout with "${e.target.value}"?`) && applyPreset(e.target.value)}
          >
            <option value="">Load layout…</option>
            {Object.keys(PRESETS).map((name) => <option key={name}>{name}</option>)}
          </select>
          {THEME_FIELDS.map(([key, label]) => (
            <label key={key} className="color-field">
              <input type="color" value={theme[key]} onChange={(e) => useUi.setState({ theme: { ...theme, [key]: e.target.value } })} />
              {label}
            </label>
          ))}
          <button className="text-button" onClick={() => useUi.setState({ theme: DEFAULT_THEME })}>Reset theme</button>
        </div>
      )}
      <button className={editing ? "text-button on" : "text-button"} onClick={() => useUi.setState({ editing: !editing })}>
        {editing ? "Done" : "Edit layout"}
      </button>
    </header>
  );
}
