import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "dockview-react/dist/styles/dockview.css";
import "./theme/tokens.css";
import { Workspace } from "./layout/Workspace";
import { SyncedLyrics } from "./modules/lyrics";
import { PlayerBar } from "./player-bar/PlayerBar";
import { connectPlayer } from "./state/player";
import { useUi, type Theme } from "./state/ui";
import { TopBar } from "./TopBar";

function useTheme() {
  const theme = useUi((s) => s.theme);
  useEffect(() => {
    window.bridge.load<Theme>("theme").then((saved) => {
      if (saved) useUi.setState({ theme: { ...useUi.getState().theme, ...saved } });
    });
  }, []);
  useEffect(() => {
    for (const [key, value] of Object.entries(theme)) document.documentElement.style.setProperty(`--${key}`, value);
  }, [theme]);
}

function LyricsPage() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && useUi.setState({ lyricsOpen: false });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return <section className="lyrics-page" aria-label="Full-page lyrics"><SyncedLyrics /></section>;
}

function App() {
  useTheme();
  // Hidden while editing so the layout being edited is visible
  const lyricsOpen = useUi((s) => s.lyricsOpen && !s.editing);
  useEffect(connectPlayer, []);
  useEffect(() => {
    const unsubscribe = useUi.subscribe((s, prev) => {
      if (s.theme !== prev.theme) window.bridge.save("theme", s.theme);
    });
    return unsubscribe;
  }, []);
  return (
    <div className="app">
      <TopBar />
      <main className="workspace-host">
        <Workspace />
        {lyricsOpen && <LyricsPage />}
      </main>
      <PlayerBar />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
