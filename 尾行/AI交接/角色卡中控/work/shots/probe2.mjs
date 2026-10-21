// 量手机宽度下的横向溢出与关键盒模型。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const W = process.argv[2] || "420";

const probe = `
<style>dialog.wx-dialog:not([open]){display:none!important;}${process.env.NOLAYOUT ? "" : "html,body{margin:0;height:100%}body{display:flex;flex-direction:column;justify-content:flex-end}main.wx-standalone-main{min-height:0}"}</style>
<script>
const click = (s) => { const e = document.querySelector(s); if (e) e.click(); };
setInterval(() => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} } }, 100);
setTimeout(() => {
  click('#wx-terminal-toggle-btn');
  setTimeout(() => {
    const out = [];
    out.push('VIEWPORT :: innerWidth=' + innerWidth + ' docClient=' + document.documentElement.clientWidth + ' bodyScroll=' + document.body.scrollWidth);
    const ov = (sel, name) => {
      const el = document.querySelector(sel);
      if (!el) return out.push('OVERFLOW ' + name + ' :: MISSING');
      const r = el.getBoundingClientRect();
      out.push('OVERFLOW ' + name + ' :: x=' + r.x.toFixed(0) + ' w=' + r.width.toFixed(0) + ' right=' + r.right.toFixed(0)
        + ' client=' + el.clientWidth + ' scroll=' + el.scrollWidth + ' 溢出=' + (el.scrollWidth - el.clientWidth) + 'px');
    };
    ov('.trpg', '常驻容器');
    ov('#trpgSlimBar', '常驻条');
    ov('.slim-left', '左簇');
    ov('.slim-center', '中簇');
    ov('.slim-right', '右簇');
    ov('.wx-capsule-bar', '胶囊条');
    ov('#wxMoreActionsBtn', '更多按钮');
    ov('#wx-terminal-dialog .wx-modal-head', '终端标题');
    ov('#wx-attrs', '五维行');
    ov('#routeStepper', '动线轨');
    ov('#wx-terminal-dialog', '终端弹窗');
    const pre = document.createElement('pre');
    pre.id = 'probeOut';
    pre.textContent = out.join('\\n');
    pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:11px monospace;padding:4px';
    document.body.appendChild(pre);
  }, 400);
}, 1800);
</script>
`;

const file = join(here, `probe${W}.html`);
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "ud")}`,
  "--virtual-time-budget=6000", `--window-size=${W},900`, "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });

const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
