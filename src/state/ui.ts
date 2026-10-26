import { create } from "zustand";

export interface Theme { bg: string; surface: string; text: string; accent: string }

export const DEFAULT_THEME: Theme = { bg: "#000000", surface: "#121212", text: "#ffffff", accent: "#1ed760" };

export type BrowseView =
  | { kind: "home" }
  | { kind: "artist"; name: string }
  | { kind: "album"; artist: string; album: string }
  | { kind: "playlist"; name: string; url: string }
  | { kind: "search"; query: string };

interface UiState {
  editing: boolean;
  theme: Theme;
  /** What the main browse view shows; set by any module (e.g. the library sidebar) */
  browse: BrowseView;
  /** Full-page synced lyrics over the workspace, toggled from the player bar */
  lyricsOpen: boolean;
}

export const useUi = create<UiState>(() => ({ editing: false, theme: DEFAULT_THEME, browse: { kind: "home" }, lyricsOpen: false }));

// Navigating closes the full-page lyrics so the new view is visible
export const browse = (view: BrowseView) => useUi.setState({ browse: view, lyricsOpen: false });
