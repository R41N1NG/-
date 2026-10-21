// 定位终端弹窗：点击后打印 open / display / 几何 / 报错。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const probe = `
<style>html,body{margin:0;height:100%}body{display:flex;flex-direction:column;justify-content:flex-end}main.wx-standalone-main{min-height:0}</style>
<script>
window.__errs = [];
window.addEventListener('error', e => window.__errs.push('error: ' + e.message));
setInterval(() => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} } }, 100);
setTimeout(() => { const t = document.getElementById('wx-terminal-toggle-btn'); if (t) t.click(); }, 1500);
setTimeout(() => {
  const d = document.getElementById('wx-terminal-dialog');
  const cs = getComputedStyle(d);
  const r = d.getBoundingClientRect();
  const out = [
    'open=' + d.open,
    'display=' + cs.display + ' height=' + cs.height + ' maxH=' + cs.maxHeight + ' inset=' + cs.inset,
    'opacity=' + cs.opacity + ' filter=' + cs.filter + ' z=' + cs.zIndex,
    'anim=' + cs.animationName + ' state=' + cs.animationPlayState + ' fill=' + cs.animationFillMode + ' dur=' + cs.animationDuration,
    'transform=' + cs.transform,
    'now=' + Math.round(performance.now()),
    'anims=' + document.getAnimations().slice(0, 6).map(a => (a.animationName || a.transitionProperty || '?') + '@' + Math.round(a.currentTime || 0) + ':' + a.playState).join(' | '),
    'openDialogs=' + [...document.querySelectorAll('dialog[open]')].map(x => x.id + ':' + x.className).join(' | '),
    'rect=' + r.x.toFixed(0) + ',' + r.y.toFixed(0) + ' ' + r.width.toFixed(0) + 'x' + r.height.toFixed(0),
    'errs=' + (window.__errs.join(' / ') || '无'),
    'styleSheets=' + document.styleSheets.length
  ];
  const pre = document.createElement('pre'); pre.id = 'probeOut'; pre.textContent = out.join('\\n');
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2500);
</script>`;

const file = join(here, "probe-term.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "ud")}`,
  "--virtual-time-budget=6000", "--window-size=980,1250", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
