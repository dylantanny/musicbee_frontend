// End-to-end smoke test: runs the built app against the fake server, reports
// what rendered and saves a screenshot. Usage (after `npm run build`):
//   SMOKE_DIR=/some/tmp/dir MUSICBEE_PORT=3999 electron dev/smoke.cjs [recolor]
const { app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const dir = process.env.SMOKE_DIR;
app.setPath("userData", path.join(dir, "userData"));
const recolor = process.argv.includes("recolor");

function collect(recolor) {
  const text = (sel) => document.querySelector(sel)?.textContent?.trim() ?? null;
  const report = {
    status: text(".top-bar .muted"),
    modules: [...document.querySelectorAll(".dv-tab, .module")].length,
    moduleBodies: document.querySelectorAll(".module").length,
    playerTitle: text(".pb-text .row-title"),
    nowPlaying: text(".np-title"),
    lyricsActive: text(".lyrics .line.active"),
    queueRows: document.querySelectorAll(".module .list li").length,
    albumCards: document.querySelectorAll(".album-card").length,
    firstModuleStyle: document.querySelector(".module")?.getAttribute("style") ?? null,
  };
  if (recolor) {
    document.querySelector(".top-bar button:last-child").click(); // Edit layout
    return new Promise((resolve) => setTimeout(() => {
      const input = document.querySelector(".module-toolbar input[type=color]");
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(input, "#ff0000");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(() => resolve({ ...report, toolbars: document.querySelectorAll(".module-toolbar").length,
        recolored: document.querySelector(".module")?.getAttribute("style") }), 300);
    }, 300));
  }
  return report;
}

app.on("browser-window-created", (_event, win) => {
  win.webContents.on("console-message", (event) => console.log("[renderer]", event.message ?? event));
  win.webContents.once("did-finish-load", async () => {
    await new Promise((r) => setTimeout(r, 3000));
    console.log(JSON.stringify(await win.webContents.executeJavaScript(`(${collect})(${recolor})`), null, 2));
    fs.writeFileSync(path.join(dir, recolor ? "recolor.png" : "screen.png"), (await win.webContents.capturePage()).toPNG());
    await new Promise((r) => setTimeout(r, 1000)); // let the debounced layout save land
    app.quit();
  });
});

require(path.join(__dirname, "../out/main/main.js"));
