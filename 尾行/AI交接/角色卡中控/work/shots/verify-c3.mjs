// C3 功能回归：胶囊点选/取消、抽屉开合与抽屉内点选、姿态徽记切换、aria-expanded。
// 只验证交互，不改代码。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const probe = `
<style>/* 无头 + virtual time 下过渡不推进，会把颜色钉在起始值，断言前一律关掉 */
.trpg *, .wx-dialog *, .wx-action-drawer * { transition: none !important; animation: none !important; }</style>
<script>
window.__errs = [];
window.addEventListener('error', e => window.__errs.push('error: ' + e.message));
const R = [];
const ok = (n, c, d) => R.push((c ? 'OK   ' : 'FAIL ') + n + (d ? ' :: ' + d : ''));
const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
setInterval(() => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} }
  const z = document.getElementById('zeroChip'); if (z) { z.hidden = true; z.style.display = 'none'; } }, 100);

setTimeout(() => {
  /* mock 会周期性重渲染胶囊，节点会换掉；每次操作前重新取 */
  const chip0 = () => document.querySelector('#wxChipsWrap .wx-capsule-chip');

  ok('胶囊存在', document.querySelectorAll('#wxChipsWrap .wx-capsule-chip').length > 0,
     'n=' + document.querySelectorAll('#wxChipsWrap .wx-capsule-chip').length);

  // 1. 点选 / 取消
  chip0().click();
  ok('胶囊点选后进入 active', chip0().classList.contains('active'));
  ok('选中态带 ✓', !!chip0().querySelector('.chip-check'));
  ok('选中态文本色 = --safe', getComputedStyle(chip0()).color === 'rgb(95, 214, 195)', getComputedStyle(chip0()).color);
  const h = chip0().getBoundingClientRect().height;
  ok('触控高度 ≥ 24px', h >= 24, 'h=' + h.toFixed(1) + ' minH=' + getComputedStyle(chip0()).minHeight);
  chip0().click();
  ok('再次点击取消 active', !chip0().classList.contains('active'));

  // 2. 抽屉开合
  const more = document.getElementById('wxMoreActionsBtn');
  const drawer = document.getElementById('wxActionDrawer');
  ok('抽屉初始关闭', !vis(drawer), 'display=' + getComputedStyle(drawer).display);
  more.click();
  ok('点更多后抽屉可见', vis(drawer));
  ok('更多按钮 aria-expanded=true', more.getAttribute('aria-expanded') === 'true', String(more.getAttribute('aria-expanded')));
  ok('抽屉内动作数量 > 0', document.querySelectorAll('#wxActionDrawerBody .wx-capsule-chip').length > 0,
     'n=' + document.querySelectorAll('#wxActionDrawerBody .wx-capsule-chip').length);

  // 3. 抽屉内点选：取一个与常驻胶囊相同的动作，验证跨面同步
  const capIcon = document.querySelector('#wxChipsWrap .wx-capsule-chip');
  const capId = capIcon.dataset.actionId;
  const capArgs = capIcon.dataset.actionArgs;
  const sameDrawn = [...document.querySelectorAll('#wxActionDrawerBody .wx-capsule-chip')]
    .find(c => c.dataset.actionId === capId && c.dataset.actionArgs === capArgs);
  ok('抽屉里能找到与胶囊同名的动作', !!sameDrawn, 'id=' + capId);
  sameDrawn.click();
  ok('抽屉内点选后抽屉自动收起', !vis(drawer));
  const capAfter = document.querySelector('#wxChipsWrap .wx-capsule-chip[data-action-id="' + capId + '"]');
  ok('跨面同步：胶囊栏对应胶囊带勾', !!capAfter && capAfter.classList.contains('active'),
     capAfter ? capAfter.className : 'MISSING');

  // 4. 关闭抽屉
  more.click();
  document.getElementById('wxActionDrawerClose').click();
  ok('关闭按钮收起抽屉', !vis(drawer));
  ok('关闭后 aria-expanded=false', more.getAttribute('aria-expanded') === 'false', String(more.getAttribute('aria-expanded')));

  // 5. 姿态徽记切换（默认 ↔ 纯叙事）
  const badge = document.getElementById('wxPostureBadge');
  const before = badge.className;
  badge.click();
  ok('姿态徽记可切换', badge.className !== before, before + ' -> ' + badge.className);
  ok('纯叙事态使用暖色', getComputedStyle(badge).color === 'rgb(240, 179, 85)', getComputedStyle(badge).color);
  badge.click();
  ok('再点回到默认姿态', badge.className === before, badge.className);

  ok('运行期零报错', window.__errs.length === 0, window.__errs.join(' / ') || '（无）');

  const pre = document.createElement('pre');
  pre.id = 'probeOut'; pre.textContent = R.join('\\n');
  pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:6px';
  document.body.appendChild(pre);
}, 2600);
</script>`;

const file = join(here, "verify-c3.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "_ud")}`,
  "--virtual-time-budget=8000", "--window-size=1100,900", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
