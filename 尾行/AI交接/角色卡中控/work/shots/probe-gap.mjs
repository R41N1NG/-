// 一次性量取：终端弹窗各段几何，找空隙来源。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const probe = `
<script>
setInterval(() => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} }
  const z = document.getElementById('zeroChip'); if (z) { z.hidden = true; z.style.display = 'none'; } }, 100);
setTimeout(() => { const t = document.getElementById('wx-terminal-toggle-btn'); if (t) t.click(); }, 1200);
setTimeout(() => {
  const out = [];
  const m = (name, el) => { if (!el) return out.push(name + ' MISSING');
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    out.push(name + ' :: y=' + r.y.toFixed(0) + ' h=' + r.height.toFixed(0) + ' bottom=' + r.bottom.toFixed(0)
      + ' | pad=' + cs.paddingTop + '/' + cs.paddingBottom + ' flex=' + cs.flex + ' maxH=' + cs.maxHeight + ' h=' + cs.height); };
  const d = document.getElementById('wx-terminal-dialog');
  const head = d.querySelector('.wx-modal-head');
  const body = d.querySelector('.wx-modal-body');
  const led = document.getElementById('ledger');
  const nav = d.querySelector('.wx-terminal-links');
  m('dialog', d); m('head', head); m('body', body); m('nav', nav); m('ledger', led);
  out.push('body.scrollHeight=' + body.scrollHeight + ' clientHeight=' + body.clientHeight);
  const kids = [...body.children];
  kids.forEach((k, i) => { const r = k.getBoundingClientRect(); out.push('  child' + i + ' ' + k.className.slice(0, 26) + ' y=' + r.y.toFixed(0) + ' h=' + r.height.toFixed(0) + ' mt=' + getComputedStyle(k).marginTop + ' mb=' + getComputedStyle(k).marginBottom); });
  const pre = document.createElement('pre'); pre.id = 'probeOut'; pre.textContent = out.join('\\n');
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2000);
</script>`;

const file = join(here, "probe-gap.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "ud")}`,
  "--virtual-time-budget=6000", "--window-size=980,1250", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const mm = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(mm ? mm[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
