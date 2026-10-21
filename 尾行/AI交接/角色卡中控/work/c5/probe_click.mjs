import { spawn } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9437;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const src = readFileSync(join(ROOT, "状态栏.html"), "utf8");
const probe = `<script>
window.__log = [];
setTimeout(() => {
  const q = (s) => document.querySelector(s);
  const create = document.getElementById('wx-create-dialog');
  if (create && !create.open) { try { create.showModal(); } catch (e) { create.setAttribute('open',''); } }
  q('#wx-create-dialog .id-card.preset')?.click();
  setTimeout(() => {
    const next = q('#zeroNextStep'); if (next && !next.disabled) next.click();
    setTimeout(() => {
      const cards = [...document.querySelectorAll('#targetGrid .target-card')];
      const pick = (txt) => cards.find(c => c.textContent.includes(txt));
      const read = (tag) => window.__log.push(tag + ' => ' + (document.getElementById('tDetailName')?.textContent || '?') + ' | sel=' + (document.querySelector('#targetGrid .target-card.sel')?.textContent.slice(0,8) || 'none'));
      read('初始');
      pick('晚自习高中生')?.click(); read('点高中生后');
      pick('独居女大学生')?.click(); read('点女大后');
    }, 300);
  }, 300);
}, 1500);
</` + `script>`;
const file = join(here, "probe_target_click.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const proc = spawn(CHROME, ["--headless=new","--no-sandbox","--disable-gpu","--disable-breakpad","--hide-scrollbars","--allow-file-access-from-files",`--user-data-dir=${join(here,"ud-shot2")}`,`--remote-debugging-port=${PORT}`,"--window-size=980,1150","about:blank"], { stdio: "ignore" });
let list = null;
for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/list`); if (r.ok) { list = await r.json(); break; } } catch (e) {} await sleep(150); }
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const waiters = new Map();
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id); } });
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((r) => waiters.set(i, r)); };
await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20") });
await sleep(4000);
const r = await send("Runtime.evaluate", { expression: "JSON.stringify(window.__log || [])", returnByValue: true });
console.log(r.result.result.value);
proc.kill();
