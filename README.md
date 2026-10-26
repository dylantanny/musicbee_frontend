# Music UI

A Spotify-style desktop app that remote-controls MusicBee. Every section is a panel you can add, move, resize, remove and recolour.

## Setup

1. **MusicBee (Windows):** install the [MusicBee Remote plugin](https://github.com/musicbeeremote/mbrc-plugin/releases) (v1.5.0+). In its Configure dialog, keep port `3000`.
2. **This app** (Node 22+):
   ```bash
   npm install
   ./node_modules/.bin/install-electron   # npm 11 skips Electron's download script
   npm run dev
   ```
   It connects to `127.0.0.1:3000`. To control MusicBee on another PC, set `MUSICBEE_HOST` / `MUSICBEE_PORT`, and in the plugin's settings allow this machine and tick "Update firewall rule".

**Without MusicBee** (e.g. on a Mac): run `npm run fake` in a second terminal. It starts a fake MusicBee with demo tracks, lyrics and a 1,234-song library.

## Using it

- **Edit layout** (top right) unlocks the layout: drag panels by their tabs, resize along the gaps, add panels, load a preset layout, and change colours, both the whole theme and each panel. Click **Done** to lock it again.
- The layout and theme are saved automatically.
- Double-click a song, playlist or queue entry to play it. Click a lyric line to jump to it.

## Adding a module

1. Create `src/modules/<name>/index.tsx` that default-exports `{ id, title, component } satisfies ModuleDef`.
2. Add it to `MODULES` in `src/layout/registry.ts`. It then appears in **Add panel**.

Modules read state from `usePlayer` (`src/state/player.ts`) and send commands with `send(context, data)`. Use the `var(--surface)`, `var(--text)` and `var(--accent)` colours (and `var(--raised)` for cards inside a panel) so panel recolouring works. For the shared look, start with a `.module-title` heading and use `Art` (`src/ui/Art.tsx`) for artwork tiles and `Icon` (`src/ui/icons.tsx`) for controls.

## Structure

| Path | What it does |
|---|---|
| `electron/musicbee/` | TCP connection to MusicBee Remote (protocol V4): framing, handshake, keepalive, reconnect |
| `electron/main.ts` | Window, two sockets (live updates and bulk lists), saving layout and theme |
| `src/state/reducer.ts` | Turns each MusicBee message into state (the only place the protocol's odd types are handled) |
| `src/layout/` | dockview workspace, module container, registry, presets |
| `src/modules/` | Library, browse/search, now playing, queue, synced lyrics |
| `dev/fake-musicbee.mts` | Fake MusicBee for development and tests |

## Tests

```bash
npm test              # unit + connection tests against the fake server
npm run typecheck
npm run build && SMOKE_DIR=$(mktemp -d) MUSICBEE_PORT=3999 ./node_modules/.bin/electron dev/smoke.cjs
                      # with `PORT=3999 npm run fake` running: launches the app, reports what rendered, saves a screenshot
```
