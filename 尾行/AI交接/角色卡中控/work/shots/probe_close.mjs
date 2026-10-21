// 最小复现：创角弹窗 close() 之后是否还占版面。
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
  const d = document.getElementById('wx-create-dialog');
  const before = { open: d.open, display: getComputedStyle(d).display, h: d.getBoundingClientRect().height };
  try { d.close(); } catch (e) {}
  const after = { open: d.open, display: getComputedStyle(d).display, h: d.getBoundingClientRect().height };
  const pre = document.createElement('pre'); pre.id = 'probeOut';
  pre.textContent = 'close() 前 :: ' + JSON.stringify(before) + '\\nclose() 后 :: ' + JSON.stringify(after);
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2500);
</script>`;

const file = join(here, "probe_close.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "ud")}`,
  "--virtual-time-budget=5000", "--window-size=1000,900", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"') : "NO OUTPUT");
