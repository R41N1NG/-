// P1 预览构建器：把 token 覆盖层注入状态栏副本，渲染「现状 / A 冷蓝 / B 钠灯」三套对照图。
// 只读 状态栏.html，产物全部落在 work/p1/。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const src = readFileSync(join(root, "状态栏.html"), "utf8");
const base = readFileSync(join(here, "p1-base.css"), "utf8");
const variantB = readFileSync(join(here, "p1-b.css"), "utf8");
const variantC = readFileSync(join(here, "p1-c.css"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const VARIANTS = {
  now: "",
  a: base,
  b: base + "\n" + variantB,
  c: variantC,
};

// 页面外壳：把状态栏钉在底部，模拟酒馆输入栏上方
const LAYOUT = `<style>
html,body{margin:0;height:100%}
body{display:flex;flex-direction:column;justify-content:flex-end;background:#1b1f24}
main.wx-standalone-main{min-height:0;padding:0 8px 8px}
</style>`;

const helper = (js) => `
<script>
const click = (s) => { const e = document.querySelector(s); if (e) e.click(); };
setInterval(() => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} }
  const z = document.getElementById('zeroChip'); if (z) { z.hidden = true; z.style.display = 'none'; } }, 100);
/* mock 首帧渲染会把已开的 dialog 全关掉，所以点两次、且都排在首帧之后 */
setTimeout(() => { ${js} }, 2600);
setTimeout(() => { ${js} }, 3800);
</script>`;

function buildPage(css, js = "") {
  return src
    .replace("</html>", (css ? `<style>\n${css}\n</style>` : "") + LAYOUT + helper(js) + "\n</html>");
}

function shot(html, { w, h, out, iframe = 0 }) {
  const file = join(here, `_${out}.html`);
  writeFileSync(file, html, "utf8");
  let target = file;
  if (iframe) {
    const wrap = join(here, `_wrap_${out}.html`);
    writeFileSync(wrap, `<!doctype html><html><body style="margin:0;background:#20242a;display:flex;justify-content:center;align-items:flex-end;height:${h}px">
<iframe src="_${out}.html" style="width:${w}px;height:${h}px;border:0"></iframe></body></html>`, "utf8");
    target = wrap;
  }
  const url = "file:///" + target.replace(/\\/g, "/").replace(/ /g, "%20");
  execFileSync(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad", "--hide-scrollbars",
    "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
    "--virtual-time-budget=6000",
    `--window-size=${iframe ? Math.max(w + 60, 1000) : w},${h}`,
    `--screenshot=${join(here, out + ".png")}`, url,
  ], { stdio: "ignore", timeout: 120000 });
  return out + ".png";
}

const made = [];
for (const [key, css] of Object.entries(VARIANTS)) {
  // 常驻条（桌面）
  made.push(shot(buildPage(css), { w: 980, h: 220, out: `bar_${key}` }));
  // 常驻条（手机 390，真宽 iframe）
  made.push(shot(buildPage(css), { w: 390, h: 220, out: `bar390_${key}`, iframe: 390 }));
  // 终端
  made.push(shot(buildPage(css, "(()=>{const d=document.getElementById('wx-terminal-dialog'); if(d && !d.open) click('#wx-terminal-toggle-btn');})()"), { w: 980, h: 1180, out: `term_${key}` }));
  // 心跳弹层
  made.push(shot(buildPage(css, "(()=>{const c=document.getElementById('heartPopoverCard'); if(c && !c.classList.contains('show')) click('#heartPillBtn');})()"), { w: 980, h: 900, out: `heart_${key}` }));
}
console.log(made.join("\n"));
