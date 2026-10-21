// 真宽量取：把状态栏塞进指定宽度的 iframe，内页把自己量到的盒模型 postMessage 给外层，外层落进 <pre> 供 --dump-dom 读取。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const innerJs = `
<style>dialog.wx-dialog:not([open]){display:none!important;}html,body{margin:0;height:100%}body{display:flex;flex-direction:column;justify-content:flex-end}main.wx-standalone-main{min-height:0}</style>
<script>
const hideZero = () => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} }
  const z = document.getElementById('zeroChip'); if (z) { z.hidden = true; z.style.display = 'none'; } };
setInterval(hideZero, 100);
setTimeout(() => { const t = document.getElementById('wx-terminal-toggle-btn'); if (t) t.click(); }, 1200);
setTimeout(() => {
  const items = [
    ['body', 'body'], ['main', 'main.wx-standalone-main'], ['.trpg', '.trpg'],
    ['常驻条', '#trpgSlimBar'], ['左簇', '.slim-left'], ['大区', '#routeDistrict'], ['场所', '.slim-place'],
    ['红线', '#routeStrikeTag'], ['中簇', '.slim-center'], ['阶段', '#phase'], ['距离', '#distName'],
    ['体力', '#staminaBox'], ['心跳', '#heartPillBtn'], ['终端', '.terminal-toggle-btn'],
    ['胶囊条', '.wx-capsule-bar'], ['更多', '#wxMoreActionsBtn'],
  ];
  const out = [];
  out.push('VIEWPORT ' + innerWidth + 'x' + innerHeight);
  for (const [name, sel] of items) {
    const el = document.querySelector(sel);
    if (!el) { out.push(name + ' :: MISSING'); continue; }
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    out.push(name + ' :: x=' + r.x.toFixed(0) + ' w=' + r.width.toFixed(0) + ' right=' + r.right.toFixed(0) + ' display=' + cs.display);
  }
  const bar = document.querySelector('#trpgSlimBar');
  out.push('常驻条溢出 :: client=' + bar.clientWidth + ' scroll=' + bar.scrollWidth);
  out.push('页面溢出 :: docScroll=' + document.documentElement.scrollWidth + ' inner=' + innerWidth);
  for (const el of bar.querySelectorAll('*')) {
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      const r = el.getBoundingClientRect();
      out.push('  撑宽：<' + el.tagName.toLowerCase() + ' class="' + (el.className || '') + '" id="' + (el.id || '') + '"> client=' + el.clientWidth + ' scroll=' + el.scrollWidth + ' w=' + r.width.toFixed(0));
    }
  }
  const body = document.querySelector('.wx-modal-body');
  const led = document.getElementById('ledger');
  if (body && led) {
    const rb = body.getBoundingClientRect(), rl = led.getBoundingClientRect();
    const cs = getComputedStyle(led);
    out.push('终端底账 :: position=' + cs.position + ' bottom=' + cs.bottom + ' z=' + cs.zIndex
      + ' | body y=' + rb.y.toFixed(0) + '..' + rb.bottom.toFixed(0)
      + ' | ledger y=' + rl.y.toFixed(0) + '..' + rl.bottom.toFixed(0)
      + ' | bodyScroll ' + body.scrollTop + '/' + (body.scrollHeight - body.clientHeight));
  }
  parent.postMessage(out.join('\\n'), '*');
}, 1800);
</script>`;

const wrapper = (w, h, inner) => `<!doctype html><html><body style="margin:0;background:#222;height:${h}px">
<iframe id="f" src="${inner}" style="width:${w}px;height:${h}px;border:0"></iframe>
<pre id="out" style="position:fixed;left:0;top:0;background:#000;color:#0f0;font:12px monospace;padding:6px;z-index:9"></pre>
<script>window.addEventListener('message', e => { document.getElementById('out').textContent += e.data + '\\n'; });</script>
</body></html>`;

const widths = [360, 430, 500, 560, 561, 801, 810, 840];
const results = [];
for (const w of widths) {
  const inner = join(here, `p_inner_${w}.html`);
  writeFileSync(inner, src.replace("</html>", innerJs + "\n</html>"), "utf8");
  const wrap = join(here, `p_wrap_${w}.html`);
  writeFileSync(wrap, wrapper(w, 700, `p_inner_${w}.html`), "utf8");
  const url = "file:///" + wrap.replace(/\\/g, "/").replace(/ /g, "%20");
  const dom = execFileSync(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
    "--allow-file-access-from-files", `--user-data-dir=${join(here, "ud")}`,
    "--virtual-time-budget=6000", "--window-size=1000,760", "--dump-dom", url,
  ], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
  const m = dom.match(/<pre id="out"[^>]*>([\s\S]*?)<\/pre>/);
  results.push('=== ' + w + ' ===\n' + (m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : 'NO OUTPUT'));
}
console.log(results.join('\n\n'));
