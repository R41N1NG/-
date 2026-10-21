// 状态即天气：正常 / 过线(deform) / 崩溃(crash) / 终局封(sealed) 四态对照图。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const LAYOUT = `<style>html,body{margin:0;height:100%}body{display:flex;flex-direction:column;justify-content:flex-end;background:#1b1f24}main.wx-standalone-main{min-height:0;padding:0 8px 8px}</style>`;

const cases = {
  normal: "",
  deform: "document.querySelector('.trpg').dataset.line='deform';",
  crash: "document.querySelector('.trpg').dataset.line='crash';",
  sealed: `const t=document.getElementById('routeStrikeTag');
           if(t){t.className='slim-tag strike-tag sealed';t.textContent='探头锁定 · 禁动手';}`,
};

for (const [name, js] of Object.entries(cases)) {
  const helper = `<script>
    setInterval(()=>{const c=document.getElementById('wx-create-dialog');if(c){try{c.close()}catch(e){}};
      const z=document.getElementById('zeroChip');if(z){z.hidden=true;z.style.display='none'}},100);
    setTimeout(()=>{ ${js} }, 1600);
    setTimeout(()=>{ ${js} }, 2400);
  </script>`;
  const html = src.replace("</html>", LAYOUT + helper + "\n</html>");
  const file = join(here, `_state_${name}.html`);
  writeFileSync(file, html, "utf8");
  const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
  execFileSync(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
    "--hide-scrollbars", "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
    "--virtual-time-budget=5000", "--window-size=980,150", `--screenshot=${join(here, `state_${name}.png`)}`, url],
    { stdio: "ignore" });
  console.log("state_" + name + ".png");
}
