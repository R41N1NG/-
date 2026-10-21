// 手机宽度真机模拟：把状态栏放进 390/360 宽的 iframe 里再截屏（无头 Chrome 窗口有最小宽度，直接缩窗无效）。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const inject = (js) => `
<style>dialog.wx-dialog:not([open]){display:none!important;}html,body{margin:0;height:100%}body{display:flex;flex-direction:column;justify-content:flex-end}main.wx-standalone-main{min-height:0}</style>
<script>
const click = (s) => { const e = document.querySelector(s); if (e) e.click(); };
setInterval(() => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} }
  const z = document.getElementById('zeroChip'); if (z) { z.hidden = true; z.style.display = 'none'; } }, 100);
setTimeout(() => { ${js} }, 1500);
</script>`;

const builds = [
  { id: "m390", w: 390, h: 800, js: "" },
  { id: "m360", w: 360, h: 800, js: "" },
  { id: "m560", w: 560, h: 800, js: "" },
  { id: "m561", w: 561, h: 800, js: "" },
  { id: "m700", w: 700, h: 800, js: "" },
  { id: "m800", w: 800, h: 800, js: "" },
  { id: "m390-term", w: 390, h: 800, js: "click('#wx-terminal-toggle-btn');" },
  { id: "m390-heart", w: 390, h: 800, js: "click('#heartPillBtn');" },
  { id: "m390-drawer", w: 390, h: 800, js: "click('#wxMoreActionsBtn');" },
  { id: "d1100", w: 1100, h: 800, js: "" },
];

const results = [];
for (const b of builds) {
  const inner = join(here, `inner_${b.id}.html`);
  writeFileSync(inner, src.replace("</html>", inject(b.js) + "\n</html>"), "utf8");
  const wrapper = join(here, `wrap_${b.id}.html`);
  writeFileSync(wrapper, `<!doctype html><html><body style="margin:0;background:#1b1f24;display:flex;justify-content:center;align-items:flex-end;height:${b.h}px">
<iframe src="inner_${b.id}.html" style="width:${b.w}px;height:${b.h}px;border:0;box-shadow:0 0 0 1px #333"></iframe></body></html>`, "utf8");
  const out = join(here, `shot_${b.id}.png`);
  const url = "file:///" + wrapper.replace(/\\/g, "/").replace(/ /g, "%20");
  try {
    execFileSync(CHROME, [
      "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
      "--hide-scrollbars", "--allow-file-access-from-files",
      `--user-data-dir=${join(here, "ud")}`,
      "--virtual-time-budget=6000",
      `--window-size=${Math.max(b.w + 40, 1100)},${Math.max(b.h + 40, 900)}`,
      `--screenshot=${out}`, url,
    ], { stdio: "ignore", timeout: 120000 });
    results.push(`${b.id}: ok`);
  } catch (e) { results.push(`${b.id}: FAIL ${e.message}`); }
}
console.log(results.join("\n"));
