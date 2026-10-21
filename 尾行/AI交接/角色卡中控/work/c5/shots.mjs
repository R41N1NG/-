// 给创角 / 判定台拍改前改后对照图（无头 Edge + CDP）
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9432;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--hide-scrollbars", "--allow-file-access-from-files", `--user-data-dir=${join(here, "ud-shot")}`,
  `--remote-debugging-port=${PORT}`, "--window-size=980,1150", "about:blank"], { stdio: "ignore" });

let list = null;
for (let i = 0; i < 100; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/list`); if (r.ok) { list = await r.json(); break; } } catch (e) {}
  await sleep(150);
}
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const waiters = new Map();
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id); } });
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((r) => waiters.set(i, r)); };
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 980, height: 1150, deviceScaleFactor: 1, mobile: false });

for (const tag of ["before", "after"]) {
  for (const mode of ["create", "settle"]) {
    const f = join(here, `audit_${tag}_${mode}.html`);
    await send("Page.navigate", { url: "file:///" + f.replace(/\\/g, "/").replace(/ /g, "%20") });
    await sleep(4200);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const data = shot.result && shot.result.data;
    if (!data) { console.log(tag, mode, "截图失败", JSON.stringify(shot).slice(0, 200)); continue; }
    writeFileSync(join(here, `shot_${tag}_${mode}.png`), Buffer.from(data, "base64"));
    console.log(tag, mode, "ok");
  }
}
proc.kill();
