// 閲忔墜鏈哄搴︿笅鐨勬í鍚戞孩鍑轰笌鍏抽敭鐩掓ā鍨嬨€?import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "鐘舵€佹爮.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const W = process.argv[2] || "420";

const probe = `
<style>dialog.wx-dialog:not([open]){display:none!important;}</style>
<script>
const click = (s) => { const e = document.querySelector(s); if (e) e.click(); };
setInterval(() => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} } }, 100);
setTimeout(() => {
  click('#wx-terminal-toggle-btn');
  setTimeout(() => {
    const out = [];
    const ov = (sel, name) => {
      const el = document.querySelector(sel);
      if (!el) return out.push('OVERFLOW ' + name + ' :: MISSING');
      const r = el.getBoundingClientRect();
      out.push('OVERFLOW ' + name + ' :: x=' + r.x.toFixed(0) + ' w=' + r.width.toFixed(0) + ' right=' + r.right.toFixed(0)
        + ' client=' + el.clientWidth + ' scroll=' + el.scrollWidth + ' 婧㈠嚭=' + (el.scrollWidth - el.clientWidth) + 'px');
    };
    ov('.trpg', '甯搁┗瀹瑰櫒');
    ov('#trpgSlimBar', '甯搁┗鏉?);
    ov('.slim-left', '宸︾皣');
    ov('.slim-center', '涓皣');
    ov('.slim-right', '鍙崇皣');
    ov('.wx-capsule-bar', '鑳跺泭鏉?);
    ov('#wxMoreActionsBtn', '鏇村鎸夐挳');
    ov('#wx-terminal-dialog .wx-modal-head', '缁堢鏍囬');
    ov('#wx-attrs', '浜旂淮琛?);
    ov('#routeStepper', '鍔ㄧ嚎杞?);
    ov('#wx-terminal-dialog', '缁堢寮圭獥');
    const pre = document.createElement('pre');
    pre.id = 'probeOut';
    pre.textContent = out.join('\\n');
    pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:11px monospace;padding:4px';
    document.body.appendChild(pre);
  }, 400);
}, 1800);
</script>
`;

const file = join(here, `probe3-${W}.html`);
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "ud")}`,
  "--virtual-time-budget=6000", `--window-size=${W},900`, "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });

const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");

