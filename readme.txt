MUSIC UI
========

A Spotify-style desktop app that remote-controls MusicBee. Every section of the
window is a panel you can add, move, resize, remove and recolour.


SETUP
-----

1. MusicBee (Windows)
   Install the MusicBee Remote plugin, v1.5.0 or newer:
   https://github.com/musicbeeremote/mbrc-plugin/releases
   In the plugin's Configure dialog, keep the port at 3000.

2. This app (needs Node 22 or newer)
   Run these in the music_ui folder:

     npm install
     ./node_modules/.bin/install-electron
     npm run dev

   The second command is needed because npm 11 skips Electron's download step.

   The app connects to 127.0.0.1:3000. To control MusicBee on another PC:
   - set the MUSICBEE_HOST and MUSICBEE_PORT environment variables
   - in the plugin's settings, allow this machine and tick
     "Update firewall rule"


RUNNING WITHOUT MUSICBEE (e.g. on a Mac)
----------------------------------------

Open a second terminal and run:

  npm run fake

This starts a fake MusicBee with demo tracks, lyrics and a 1,234-song library.
Then run "npm run dev" as usual.


USING IT
--------

- Play songs: double-click a song, playlist or queue entry.
- Lyrics: click a lyric line to jump to that point in the song.
- Edit layout (top right) unlocks the layout. While unlocked you can:
    - drag a panel by its tab
    - resize panels by dragging the gaps between them
    - add a panel with "+ Add panel"
    - switch to a preset with "Load layout"
      (Default, Lyrics focus or Mini)
    - recolour the whole theme (top bar) or a single panel (its toolbar)
    - remove a panel
  Click "Done" to lock the layout again.
- The layout and colours are saved automatically.


ADDING A MODULE (NEW PANEL TYPE)
--------------------------------

1. Create src/modules/<name>/index.tsx. It must default-export
   { id, title, component } satisfies ModuleDef.
2. Add it to the MODULES list in src/layout/registry.ts.
   It then appears in "+ Add panel".

Inside a module:
- read player state with usePlayer (src/state/player.ts)
- send commands to MusicBee with send(context, data)
- use the colours var(--surface), var(--text) and var(--accent), so that
  panel recolouring works


PROJECT STRUCTURE
-----------------

electron/musicbee/      TCP connection to MusicBee Remote (protocol V4):
                        message framing, handshake, keepalive, reconnect
electron/main.ts        The window, two connections (live updates and bulk
                        lists), and saving the layout and theme
src/state/reducer.ts    Turns each MusicBee message into app state
src/layout/             Panel workspace, module container, registry, presets
src/modules/            Library, browse/search, now playing, queue, lyrics
src/player-bar/         Playback bar fixed at the bottom of the window
dev/fake-musicbee.mts   Fake MusicBee for development and tests


TESTS
-----

  npm test            Unit tests, plus connection tests against the fake server
  npm run typecheck   TypeScript type check

Smoke test (launches the app, reports what rendered, saves a screenshot):

  1. In one terminal, start the fake server:
       PORT=3999 npm run fake
  2. In another terminal:
       npm run build
       SMOKE_DIR=$(mktemp -d) MUSICBEE_PORT=3999 ./node_modules/.bin/electron dev/smoke.cjs


KNOWN LIMITATIONS
-----------------

- Album tiles show a letter instead of the cover art. Only the now-playing
  cover is real.
- Search works on the app's own copy of your library. The plugin's current
  protocol has no search command.
- You can play and remove songs in the queue, but not reorder them yet.
- Not yet tested against real MusicBee, only against the fake server.
