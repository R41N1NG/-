// 为什么 C5 覆盖层对创角弹窗没生效
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
  out.push('匹配数量 .wx-create-dialog .create-tab = ' + document.querySelectorAll('.wx-create-dialog .create-tab').length);
  const sheet = [...document.styleSheets].find(s => { try { return s.cssRules && s.cssRules.length; } catch (e) { return false; } });
  const rules = [...(sheet ? sheet.cssRules : [])];
  const wanted = rules.filter(r => r.selectorText && r.selectorText.indexOf('wx-create-dialog') >= 0);
  out.push('样式表里带 wx-create-dialog 的规则数 = ' + wanted.length);
  out.push('样式表总规则数 = ' + rules.length);
  const tab = document.querySelector('.create-tab.active');
  out.push('tab 的 border = ' + getComputedStyle(tab).border);
  // 直接注入一条，看能不能压住
  const st = document.createElement('style');
  st.textContent = '.wx-create-dialog .create-tab{border:0 !important;}';
  document.head.appendChild(st);
  out.push('注入后 border = ' + getComputedStyle(tab).border);
  // 打印 CSS 文本里 C5 段是否存在
  out.push('文件含 C5 标记 = ' + document.documentElement.outerHTML.indexOf('C5 · 创角向导') >= 0);
  const pre = document.createElement('pre'); pre.id = 'probeOut'; pre.textContent = out.join('\\n');
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:11px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2500);
</script>`;

const file = join(here, "diag-create2.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
  "--virtual-time-budget=6000", "--window-size=1100,900", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
