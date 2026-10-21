// 创角向导：为什么 step-pill / create-tab 还带金色边框
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const probe = `
<script>
setTimeout(() => {
  const out = [];
  const m = (n, el) => { if (!el) return out.push(n + ' MISSING');
    const cs = getComputedStyle(el);
    out.push(n + ' :: border=' + cs.border + ' | radius=' + cs.borderRadius + ' | outline=' + cs.outline + ' ' + cs.outlineOffset
      + ' | shadow=' + cs.boxShadow + ' | bg=' + cs.backgroundColor + ' | color=' + cs.color + ' | focus=' + (document.activeElement === el)); };
  m('step-pill.active', document.querySelector('.zero-step-pill.active'));
  m('step-pill.plain', document.querySelector('.zero-step-pill:not(.active)'));
  m('create-tab.active', document.querySelector('.create-tab.active'));
  m('create-tab.plain', document.querySelector('.create-tab:not(.active)'));
  m('activeElement', document.activeElement);
  const pre = document.createElement('pre'); pre.id = 'probeOut'; pre.textContent = out.join('\\n');
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:11px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2500);
</script>`;

const file = join(here, "diag-create.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
  "--virtual-time-budget=6000", "--window-size=1100,900", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
