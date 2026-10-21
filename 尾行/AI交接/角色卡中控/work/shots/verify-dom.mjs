// 复核 2（浏览器）：CSSOM 解析完整性、弹窗开合回归、tooltip 收起态、横向溢出。
// 结果写进 <pre id="probeOut">，用 --dump-dom 读。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "状态栏.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const probe = `
<style>html,body{margin:0;height:100%}body{display:flex;flex-direction:column;justify-content:flex-end}main.wx-standalone-main{min-height:0}</style>
<script>
window.__errs = [];
window.addEventListener('error', e => window.__errs.push('error: ' + e.message));
window.addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message)));
const _ce = console.error;
console.error = function (...a) { window.__errs.push('console.error: ' + a.map(String).join(' ')); _ce.apply(console, a); };

const R = [];
const ok = (name, cond, detail) => R.push((cond ? 'OK   ' : 'FAIL ') + name + (detail ? ' :: ' + detail : ''));
const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

setTimeout(async () => {
  // ── 1. CSSOM 完整性：若某条规则写错，其后同级规则会被整块丢弃
  const sheet = [...document.styleSheets].find(s => { try { return s.cssRules && s.cssRules.length > 0; } catch (e) { return false; } });
  const rules = sheet ? [...sheet.cssRules] : [];
  ok('CSSOM 可读且非空', rules.length > 0, 'rules=' + rules.length);
  const selSet = new Set();
  const walk = (list) => { for (const r of list) { if (r.selectorText) selSet.add(r.selectorText); if (r.cssRules) walk(r.cssRules); } };
  walk(rules);
  const selList = [...selSet];
  const has = (sel) => selList.some(s => s.split(',').map(x => x.trim()).includes(sel));
  for (const sel of ['dialog.wx-dialog:not([open])', '.trpg .dial-caption', '.trpg .wx-terminal-ledger[data-tip]',
                     '.trpg [data-tip]::after', '.trpg-slim-bar', '.wx-capsule-bar']) {
    ok('规则存在 ' + sel, has(sel));
  }
  const media = rules.filter(r => r.media).map(r => r.media.mediaText);
  ok('媒体查询三条断点在位', ['(max-width: 560px)', '(max-width: 430px)', '(max-width: 380px)'].every(m => media.includes(m)), media.join(' | '));

  // ── 2. 弹窗开合回归（我的 :not([open]) 兜底会不会把正常弹窗也挡住）
  const dlgTest = (name, id) => {
    const d = document.getElementById(id);
    if (!d) return R.push('FAIL 弹窗缺失 ' + id);
    if (!d.open) (typeof d.showModal === 'function' ? d.showModal() : d.setAttribute('open', ''));
    const opened = d.open && vis(d);
    try { d.close(); } catch (e) {}
    const closed = !d.open && !vis(d);
    ok('弹窗开合 ' + name, opened && closed, 'open=' + opened + ' close=' + closed);
  };
  ['wx-terminal-dialog', 'wx-devices-dialog', 'wx-profile-dialog', 'wx-lies-dialog', 'wx-wanted-dialog',
   'wx-item-dialog', 'wx-id-dialog', 'wx-create-dialog', 'wx-settle-dialog'].forEach(id => dlgTest(id, id));

  // ── 3. 心跳弹层、抽屉：显隐
  const pill = document.getElementById('heartPillBtn');
  const card = document.getElementById('heartPopoverCard');
  pill.click();
  ok('心跳弹层可打开', vis(card));
  document.getElementById('heartPopoverClose').click();
  ok('心跳弹层可关闭', !vis(card));
  const more = document.getElementById('wxMoreActionsBtn');
  more.click();
  ok('动作抽屉可打开', vis(document.getElementById('wxActionDrawer')));
  document.getElementById('wxActionDrawerClose').click();
  ok('动作抽屉可关闭', !vis(document.getElementById('wxActionDrawer')));
  pill.classList.remove('open'); card.classList.remove('show');

  // ── 4. tooltip 收起态不再占版面、且仍可悬停出现
  const tipEl = document.querySelector('.slim-left[data-tip]');
  const af = getComputedStyle(tipEl, '::after');
  ok('tooltip 收起态 display:none', af.display === 'none', 'display=' + af.display);
  const bar = document.getElementById('trpgSlimBar');
  ok('常驻条无横向虚胖', bar.scrollWidth <= bar.clientWidth + 1, 'scroll=' + bar.scrollWidth + ' client=' + bar.clientWidth);

  // ── 5. 红线标签契约与字号
  const strike = document.getElementById('routeStrikeTag');
  ok('红线标签类名 = slim-tag strike-tag allowed/sealed',
     /^slim-tag strike-tag (allowed|sealed)$/.test(strike.className), strike.className);
  const fs = getComputedStyle(strike).fontSize;
  ok('红线标签字号回落正常（≤11px）', parseFloat(fs) <= 11, fs);

  // ── 6. 结算条：应是弹窗页脚（在滚动区外、贴在正文下方）——先打开终端再量
  const led = document.getElementById('ledger');
  const bodyEl = document.querySelector('.wx-modal-body');
  const dlgEl = document.getElementById('wx-terminal-dialog');
  if (!dlgEl.open) dlgEl.showModal();
  const inBody = bodyEl.contains(led);
  const rb = bodyEl.getBoundingClientRect(), rl = led.getBoundingClientRect(), rd = dlgEl.getBoundingClientRect();
  ok('结算条不在滚动区内', !inBody);
  ok('结算条位于正文下方且在弹窗内', rl.top >= rb.bottom - 1 && rl.bottom <= rd.bottom + 1 && rl.height > 10,
     'bodyBottom=' + rb.bottom.toFixed(0) + ' ledTop=' + rl.top.toFixed(0) + ' ledBottom=' + rl.bottom.toFixed(0) + ' dlgBottom=' + rd.bottom.toFixed(0));
  ok('结算条不遮正文（滚动区底边=结算条顶边）', Math.abs(rb.bottom - rl.top) <= 2, 'delta=' + (rl.top - rb.bottom).toFixed(0));
  const dl = getComputedStyle(dlgEl), lm = getComputedStyle(led), bm = getComputedStyle(bodyEl);
  ok('页脚留白合理（弹窗底部 10~24px）', (rd.bottom - rl.bottom) >= 8 && (rd.bottom - rl.bottom) <= 26,
     'gap=' + (rd.bottom - rl.bottom).toFixed(0) + ' dlgPad=' + dl.paddingBottom + ' ledMargin=' + lm.marginBottom + ' bodyPad=' + bm.paddingBottom);
  dlgEl.close();

  // ── 6b. 弹窗内边距契约：终端 0（自带 header/body），其余仍走 20/22
  const pad = (id) => getComputedStyle(document.getElementById(id)).padding;
  ok('终端弹窗 padding=0', pad('wx-terminal-dialog') === '0px', pad('wx-terminal-dialog'));
  ok('普通弹窗 padding=20px 22px', pad('wx-profile-dialog') === '20px 22px', pad('wx-profile-dialog'));

  // ── 7. 横向溢出（整页）
  const de = document.documentElement;
  ok('整页无横向溢出', de.scrollWidth <= innerWidth + 1, 'scroll=' + de.scrollWidth + ' inner=' + innerWidth);

  // ── 8. 运行期报错
  ok('运行期零报错', window.__errs.length === 0, window.__errs.join(' / ') || '（无）');

  const pre = document.createElement('pre');
  pre.id = 'probeOut';
  pre.textContent = R.join('\\n');
  document.body.appendChild(pre);
}, 2200);
</script>`;

const file = join(here, "verify-dom.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const url = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const dom = execFileSync(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
  "--allow-file-access-from-files", `--user-data-dir=${join(here, "ud")}`,
  "--virtual-time-budget=6000", "--window-size=1000,900", "--dump-dom", url,
], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const m = dom.match(/<pre id="probeOut"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : "NO OUTPUT");
