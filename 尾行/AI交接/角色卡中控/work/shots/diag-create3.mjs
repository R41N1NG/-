import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const probe = `<script>
setTimeout(() => {
  const st = document.querySelector('style');
  const css = st ? st.textContent : '';
  const out = [];
  out.push('style 文本长度 = ' + css.length);
  out.push('style 内含 C5 = ' + (css.indexOf('C5') >= 0));
  const sheet = [...document.styleSheets].find(s => { try { return s.cssRules && s.cssRules.length; } catch (e) { return false; } });
  const rules = [...(sheet ? sheet.cssRules : [])];
  const hit = rules.filter(r => r.selectorText === '.wx-create-dialog .create-tab');
  out.push('CSSOM 里同名规则 = ' + hit.length + (hit[0] ? ' :: ' + hit[0].cssText.slice(0, 120) : ''));
  out.push('CSSOM 最后一条 = ' + (rules[rules.length - 1] ? rules[rules.length - 1].cssText.slice(0, 90) : ''));
  const pre = document.createElement('pre'); pre.id = 'probeOut'; pre.textContent = out.join('\\n');
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:11px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2500);
</script>`;
const file = join(here, "diag-create3.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
  "--virtual-time-budget=6000", "--window-size=1100,900", "--dump-dom", url],
  { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
