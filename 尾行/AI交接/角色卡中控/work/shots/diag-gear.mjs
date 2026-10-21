import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const probe = `<script>
setInterval(() => { const c=document.getElementById('wx-create-dialog'); if(c){try{c.close()}catch(e){}} }, 100);
setTimeout(() => { document.getElementById('wx-terminal-toggle-btn')?.click(); }, 1800);
setTimeout(() => {
  const g = document.getElementById('herGear');
  const out = [
    'herGear hidden = ' + (g ? g.hidden : 'MISSING'),
    '名字 = ' + (document.getElementById('herGearName')?.textContent || ''),
    '提示 = ' + (g ? g.getAttribute('data-tip') : '')
  ];
  const pre = document.createElement('pre'); pre.id='probeOut'; pre.textContent = out.join('\\n');
  pre.style.cssText='position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2800);
</script>`;
const file = join(here, "diag-gear.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, ["--headless=new","--no-sandbox","--disable-gpu","--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here,"_ud")}`,
  "--virtual-time-budget=7000","--window-size=1100,900","--dump-dom",url],
  { encoding:"utf8", timeout:120000, maxBuffer:64*1024*1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>') : "NO OUTPUT");
