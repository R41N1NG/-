// 定点测试：姿态徽记 narrative 态的实际颜色 + 更多按钮的 aria 行为
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
  // A. 手动打类，看颜色
  badge.className = 'wx-posture-badge narrative';
  out.push('A 手打 narrative :: cls=' + badge.className + ' color=' + getComputedStyle(badge).color);
  badge.className = 'wx-posture-badge';
  // B. 真点一次，立刻读
  const before = badge.className;
  badge.click();
  out.push('B 点击后 :: before=' + before + ' after=' + badge.className + ' color=' + getComputedStyle(badge).color);
  // C. 再点回来
  badge.click();
  out.push('C 再点 :: cls=' + badge.className + ' color=' + getComputedStyle(badge).color);
  // D. 更多按钮 handler 是否维护 aria-expanded
  const more = document.getElementById('wxMoreActionsBtn');
  const drawer = document.getElementById('wxActionDrawer');
  out.push('D0 aria=' + more.getAttribute('aria-expanded') + ' drawerDisplay=' + getComputedStyle(drawer).display);
  more.click();
  out.push('D1 aria=' + more.getAttribute('aria-expanded') + ' drawerDisplay=' + getComputedStyle(drawer).display);
  const pre = document.createElement('pre'); pre.id = 'probeOut'; pre.textContent = out.join('\\n');
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2600);
</script>`;

const file = join(here, "diag-c3b.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
  "--virtual-time-budget=8000", "--window-size=1100,900", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
