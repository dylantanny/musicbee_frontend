import type { CSSProperties, ReactNode } from "react";
import type { DockviewPanelApi } from "dockview-react";
import { useUi } from "../state/ui";
import type { PanelParams } from "./registry";

const COLOR_FIELDS = [
  ["surface", "Background"],
  ["text", "Text"],
  ["accent", "Accent"],
] as const;

/** Shared frame for every module. Per-panel colours are CSS variables scoped to
 * this element, so modules only use var(--surface) etc. and never read settings. */
export function ModuleContainer({ params, api, children }: { params: PanelParams; api: DockviewPanelApi; children: ReactNode }) {
  const editing = useUi((s) => s.editing);
  const theme = useUi((s) => s.theme);
  const colors = params.colors ?? {};
  const style = Object.fromEntries(
    Object.entries(colors).filter(([, v]) => v).map(([k, v]) => [`--${k}`, v]),
  ) as CSSProperties;

  const setColor = (key: keyof NonNullable<PanelParams["colors"]>, value: string) =>
    api.updateParameters({ ...params, colors: { ...colors, [key]: value } });

  return (
    <section className="module" style={style}>
      {editing && (
        <div className="module-toolbar">
          {COLOR_FIELDS.map(([key, label]) => (
            <label key={key} className="color-field" title={`${label} colour`}>
              <input type="color" value={colors[key] ?? theme[key]} onChange={(e) => setColor(key, e.target.value)} />
              {label}
            </label>
          ))}
          <button className="text-button" onClick={() => api.updateParameters({ ...params, colors: undefined })}>
            Reset colours
          </button>
          <button className="text-button danger" onClick={() => api.close()}>Remove</button>
        </div>
      )}
      <div className="module-body">{children}</div>
    </section>
  );
}
