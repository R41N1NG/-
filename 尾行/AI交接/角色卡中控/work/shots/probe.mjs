// 量取关键元素的盒模型与计算样式，输出到 <pre>，用 --dump-dom 读取。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const probe = `
<style>dialog.wx-dialog:not([open]){display:none!important;}html,body{margin:0;height:100%}body{display:flex;flex-direction:column;justify-content:flex-end}main.wx-standalone-main{min-height:0}</style>
<script>
const click = (s) => { const e = document.querySelector(s); if (e) e.click(); };
const closeCreate = () => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} } };
setInterval(closeCreate, 100);
setTimeout(() => {
  click('#heartPillBtn');
  setTimeout(() => {
    const out = [];
    const m = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return out.push(sel + ' :: MISSING');
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out.push(sel + ' :: x=' + r.x.toFixed(0) + ' y=' + r.y.toFixed(0) + ' w=' + r.width.toFixed(0) + ' h=' + r.height.toFixed(0)
        + ' | overflow=' + cs.overflow + ' maxH=' + cs.maxHeight + ' pos=' + cs.position + ' z=' + cs.zIndex
        + ' fs=' + cs.fontSize + ' color=' + cs.color);
    };
    ['.trpg', '#trpgSlimBar', '.slim-right', '#heartPopoverWrap', '#heartPillBtn', '#heartPopoverCard',
     '#heartPopoverCard .popover-content', '#instrument', '#instrument .heart-dial', '#instrument .stamina',
     '#instrument .spark', '.popover-audio-row', '#miniHeart', '.slim-stamina', '.slim-stamina-bar',
     '.slim-tag.remain', '.slim-tag.weather', '.slim-place', '.wx-posture-badge', '.wx-capsule-chip',
     '.wx-more-btn', '#zeroChip'].forEach(m);
    const pre = document.createElement('pre');
    pre.id = 'probeOut';
    pre.textContent = out.join('\\n');
    pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:11px monospace;padding:4px;max-width:100%';
    document.body.appendChild(pre);
  }, 300);
}, 1800);
</script>
`;

const file = join(here, "probe.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "ud")}`,
  "--virtual-time-budget=6000", "--window-size=980,760", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });

const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO PROBE OUTPUT");
