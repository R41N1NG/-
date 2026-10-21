// C4 图标库样张：从 状态栏.html 里抽出 WX_ICON 定义，渲染成一张 32px 的图标清单。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const start = src.indexOf("const WX_ICON = {");
const open = src.indexOf("{", start);
let depth = 0, end = -1;
for (let i = open; i < src.length; i++) {
  if (src[i] === "{") depth++;
  else if (src[i] === "}") { depth--; if (!depth) { end = i + 1; break; } }
}
const literal = src.slice(open, end);
const ICONS = new Function("return " + literal)();
const names = Object.keys(ICONS);
const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

const html = `<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; padding:24px 26px; background:#0b1018; color:#eef4fa; font:13px/1.5 "Microsoft YaHei",system-ui,sans-serif; }
  h1 { font-size:15px; margin:0 0 4px; color:#f0b355; letter-spacing:.02em; }
  p { margin:0 0 18px; color:#5f7284; font-size:12px; }
  .grid { display:grid; grid-template-columns:repeat(8, 1fr); gap:10px; }
  .cell { background:rgba(255,255,255,.03); border-top:1px solid rgba(255,255,255,.07); border-radius:4px; padding:12px 8px 8px; text-align:center; }
  .cell svg { width:32px; height:32px; display:block; margin:0 auto 8px; color:#eef4fa; }
  .cell span { font:600 10px/1 ui-monospace,Consolas,monospace; color:#5f7284; letter-spacing:.06em; }
</style>
<h1>尾行 · 单色图标集（24×24 / stroke 1.7 / currentColor）</h1>
<p>共 ${names.length} 枚 · 全部内联 SVG，无外部资源</p>
<div class="grid">
${names.map(n => `<div class="cell">${svg(n)}<span>${n}</span></div>`).join("")}
</div>`;

const file = join(here, "icon-sheet.html");
writeFileSync(file, html, "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
execFileSync(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--hide-scrollbars", "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
  "--virtual-time-budget=3000", "--window-size=760,540", `--screenshot=${join(here, "icon-sheet.png")}`, url],
  { stdio: "ignore" });
console.log("icon-sheet.png ok · " + names.length + " icons");
