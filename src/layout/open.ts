import { browse, type BrowseView } from "../state/ui";
import { addModule } from "./presets";
import { getWorkspace } from "./Workspace";

/** Shows a view in Browse, adding a Browse panel first if the current layout has none. */
export function openInBrowse(view: BrowseView): void {
  const api = getWorkspace();
  if (api && !api.panels.some((p) => p.params?.moduleId === "browse")) addModule(api, "browse");
  browse(view);
}
