import { spawn } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9441;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const src = readFileSync(join(ROOT, "状态栏.html"), "utf8");
const probe = `<style>dialog.wx-dialog:not([open]){display:none!important} *{animation:none!important;transition:none!important}</style>
<script>
setInterval(() => {
  const c = document.getElementById('wx-create-dialog'); if (c && c.open) { try { c.close(); } catch (e) {} }
  const z = document.getElementById('zeroChip'); if (z) { z.hidden = true; z.style.display = 'none'; }
}, 200);
setTimeout(() => { document.getElementById('wxMoreActionsBtn')?.click(); }, 2600);
</` + `script>`;
const file = join(here, "probe_capsule_gate2.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const proc = spawn(CHROME, ["--headless=new","--no-sandbox","--disable-gpu","--disable-breakpad","--hide-scrollbars","--allow-file-access-from-files",`--user-data-dir=${join(here,"ud-shot2")}`,`--remote-debugging-port=${PORT}`,"--window-size=980,1000","about:blank"], { stdio: "ignore" });
let list = null;
for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/list`); if (r.ok) { list = await r.json(); break; } } catch (e) {} await sleep(150); }
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const waiters = new Map();
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id); } });
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((r) => waiters.set(i, r)); };
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 980, height: 1000, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20") });
await sleep(4200);
const shot = await send("Page.captureScreenshot", { format: "png" });
if (shot.result && shot.result.data) { writeFileSync(join(here, "shot_capsule_gate.png"), Buffer.from(shot.result.data, "base64")); console.log("shot ok"); }
proc.kill();
