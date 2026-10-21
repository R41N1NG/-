// C4 验收：全页扫描残留的彩色 emoji（文本节点 + 属性），并统计 SVG 图标数量。
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
setTimeout(() => { const t = document.getElementById('wx-terminal-toggle-btn'); if (t && !document.getElementById('wx-terminal-dialog').open) t.click(); }, 1800);
setTimeout(() => {
  const EMOJI = /[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{FE0F}]/gu;
  const hits = [];
  const walk = (node) => {
    if (node.nodeType === 3) {
      const m = node.textContent.match(EMOJI);
      if (m) hits.push('文字节点「' + node.textContent.trim().slice(0, 28) + '」→ ' + [...new Set(m)].join(' '));
    } else if (node.nodeType === 1) {
      for (const a of node.attributes) {
        const m = a.value.match(EMOJI);
        if (m) hits.push('属性 ' + a.name + '（<' + node.tagName.toLowerCase() + '>）→ ' + [...new Set(m)].join(' '));
      }
      for (const c of node.childNodes) walk(c);
    }
  };
  walk(document.body);
  const svgs = document.querySelectorAll('svg.wx-ico').length;
  const names = new Set([...document.querySelectorAll('svg.wx-ico')].map(s => (s.getAttribute('class') || '').replace('wx-ico wx-ico-', '')));
  const out = [
    'SVG 图标实例 = ' + svgs,
    '用到的图标种类 = ' + names.size + '（' + [...names].sort().join(', ') + '）',
    '残留彩色 emoji = ' + hits.length,
    ...hits.slice(0, 12)
  ];
  const pre = document.createElement('pre'); pre.id = 'probeOut'; pre.textContent = out.join('\\n');
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2800);
</script>`;

const file = join(here, "audit-c4.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
  "--virtual-time-budget=9000", "--window-size=1100,900", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
