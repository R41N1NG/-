// 诊断：胶囊为什么点不动 / 为什么高度 0 / aria-expanded 值是什么
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const probe = `
<script>
window.__errs = [];
window.addEventListener('error', e => window.__errs.push('error: ' + e.message));
setInterval(() => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} }
  const z = document.getElementById('zeroChip'); if (z) { z.hidden = true; z.style.display = 'none'; } }, 100);
setTimeout(() => {
  const out = [];
  const bar = document.getElementById('wxCapsuleBar');
  const wrap = document.getElementById('wxChipsWrap');
  const chip = document.querySelector('#wxChipsWrap .wx-capsule-chip');
  const badge = document.getElementById('wxPostureBadge');
  const more = document.getElementById('wxMoreActionsBtn');
  const m = (n, el) => { if (!el) return out.push(n + ' MISSING');
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    out.push(n + ' :: display=' + cs.display + ' vis=' + cs.visibility + ' op=' + cs.opacity
      + ' wh=' + r.width.toFixed(0) + 'x' + r.height.toFixed(0)
      + ' minH=' + cs.minHeight + ' pad=' + cs.padding + ' bg=' + cs.backgroundColor + ' color=' + cs.color + ' cls=' + (el.className || '')); };
  m('bar', bar); m('wrap', wrap); m('chip', chip); m('badge', badge); m('more', more);
  out.push('chip.offsetParent=' + (chip && chip.offsetParent ? chip.offsetParent.id || chip.offsetParent.className : 'null'));
  out.push('more aria-expanded=' + more.getAttribute('aria-expanded'));
  out.push('bar hidden=' + bar.hidden + ' style=' + bar.getAttribute('style'));
  out.push('badge style=' + (badge.getAttribute('style') || '(none)'));
  out.push('errs=' + (window.__errs.join(' / ') || '无'));
  // 直接读 CSSOM 里我这批规则是否在
  const sheet = [...document.styleSheets].find(s => { try { return s.cssRules && s.cssRules.length; } catch (e) { return false; } });
  const found = [];
  for (const r of sheet.cssRules) {
    if (r.selectorText && (r.selectorText.includes('wx-capsule-chip') || r.selectorText.includes('posture-badge'))) found.push(r.selectorText);
  }
  out.push('规则命中=' + found.join(' || '));
  const pre = document.createElement('pre'); pre.id = 'probeOut'; pre.textContent = out.join('\\n');
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2600);
</script>`;

const file = join(here, "diag-c3.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
  "--virtual-time-budget=8000", "--window-size=1100,900", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
