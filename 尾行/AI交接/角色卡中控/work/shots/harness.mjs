// 截图夹具：给状态栏注入一小段「点开某个面板」的脚本，再用无头浏览器截屏。
// 仅用于美术评审，不写回状态栏.html。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const cases = [
  { id: "main", w: 980, h: 620, js: "" },
  { id: "main-phone", w: 420, h: 620, js: "" },
  { id: "drawer", w: 980, h: 760, js: `(()=>{const b=document.getElementById('wxMoreActionsBtn');const d=document.getElementById('wxActionDrawer');if(b&&d&&d.style.display==='none')b.click();})()` },
  { id: "chip", w: 980, h: 320, js: `(()=>{const c=document.querySelector('.wx-capsule-chip');if(c&&!c.classList.contains('active'))c.click();})()` },
  { id: "heart", w: 980, h: 760, js: `(()=>{const c=document.getElementById('heartPopoverCard');if(c&&!c.classList.contains('show'))click('#heartPillBtn');})()` },
  { id: "terminal", w: 980, h: 1250, js: `(()=>{const d=document.getElementById('wx-terminal-dialog');if(d&&!d.open)click('#wx-terminal-toggle-btn');})()` },
  { id: "terminal-phone", w: 420, h: 1000, js: `(()=>{const d=document.getElementById('wx-terminal-dialog');if(d&&!d.open)click('#wx-terminal-toggle-btn');})()` },
  { id: "profile", w: 980, h: 1250, js: `click('[data-wx-dialog="wx-profile-dialog"]');`, keepCreate: true },
  { id: "devices", w: 980, h: 900, js: `click('.phone-stat');` },
  { id: "settle", w: 980, h: 1000, js: `try{window.WxStatusbar.settle({floor:3,actions:[{name:'跟缀',label:'跟缀｜身后',d20:14,dc:12,band:'success',attr:{name:'敏捷',v:4},mods:[{name:'雨幕',v:1},{name:'情报优势',v:2},{name:'她的暗账',v:-1,ripple:true}]}],account:{stamina:-3,heart:2},seg:{}});}catch(e){document.title='ERR '+e.message}` },
  { id: "create2", w: 980, h: 1100, js: `click('#zeroStepTab2');`, keepCreate: true },
  { id: "create1", w: 420, h: 1000, js: "", keepCreate: true },
];

const head = (js, keepCreate) => `
<style>dialog.wx-dialog:not([open]){display:none!important;}
/* 无头 + --virtual-time-budget 下 CSS 动画/过渡不推进，入场动画会卡在 opacity:0，
   截图前一律关掉（只影响截图，真实浏览器里动画正常） */
dialog.wx-dialog[open], .heart-popover-card.show, .wx-action-drawer { animation: none !important; }
.trpg *, .wx-dialog * { transition: none !important; }
html,body{margin:0;height:100%;}
body{display:flex;flex-direction:column;justify-content:flex-end;background:#20242a;}
main.wx-standalone-main{min-height:0;}
</style>
<script>
(() => {
  const click = (sel) => { const el = document.querySelector(sel); if (el) el.click(); };
  const closeCreate = () => {
    const c = document.getElementById('wx-create-dialog');
    if (c) { try { c.close(); } catch (e) {} c.removeAttribute('open'); }
    const z = document.getElementById('zeroChip'); if (z) { z.hidden = true; z.style.display = 'none'; }
  };
  ${keepCreate ? "" : "setInterval(closeCreate, 100);"}
  /* mock 首帧渲染会把已开的 dialog 全关掉，所以点两次（每次带状态守卫，避免把开关点回去） */
  setTimeout(() => { ${js} }, 2000);
  setTimeout(() => { ${js} }, 3400);
})();
</script>
`;

const results = [];
for (const c of cases) {
  const html = src.replace("</html>", head(c.js, c.keepCreate) + "\n</html>");
  const file = join(here, `sb_${c.id}.html`);
  writeFileSync(file, html, "utf8");
  const out = join(here, `shot_${c.id}.png`);
  const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
  try {
    execFileSync(CHROME, [
      "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
      "--hide-scrollbars", "--allow-file-access-from-files",
      `--user-data-dir=${join(here, "ud")}`,
      "--virtual-time-budget=7000",
      `--window-size=${c.w},${c.h}`,
      `--screenshot=${out}`, url,
    ], { stdio: "ignore", timeout: 120000 });
    results.push(`${c.id}: ok`);
  } catch (e) {
    results.push(`${c.id}: FAIL ${e.message}`);
  }
}
console.log(results.join("\n"));
