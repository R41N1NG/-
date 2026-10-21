// 变体测试：为什么 .narrative 的颜色没生效
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
setTimeout(() => {
  const out = [];
  const badge = document.getElementById('wxPostureBadge');
  const cs = getComputedStyle(badge);
  out.push('--heat = [' + cs.getPropertyValue('--heat') + ']');
  out.push('--t-low = [' + cs.getPropertyValue('--t-low') + ']');
  badge.className = 'wx-posture-badge narrative';
  out.push('narrative color = ' + getComputedStyle(badge).color);
  // 直接注入一条同选择器规则，看是否生效
  const st = document.createElement('style');
  st.textContent = '.wx-posture-badge.narrative{color:#00ff00 !important;}';
  document.head.appendChild(st);
  out.push('注入 !important 后 color = ' + getComputedStyle(badge).color);
  // 看现有规则里 narrative 的声明
  const sheet = [...document.styleSheets].find(s => { try { return s.cssRules && s.cssRules.length; } catch (e) { return false; } });
  for (const r of sheet.cssRules) {
    if (r.selectorText === '.wx-posture-badge.narrative') out.push('规则文本 = ' + r.cssText);
  }
  const pre = document.createElement('pre'); pre.id = 'probeOut'; pre.textContent = out.join('\\n');
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2600);
</script>`;

const file = join(here, "diag-c3c.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
  "--virtual-time-budget=8000", "--window-size=1100,900", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
