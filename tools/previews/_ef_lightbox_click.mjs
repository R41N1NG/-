#!/usr/bin/env node
/**
 * _ef_lightbox_click.mjs —— 在无头 Chrome 里**真的点一下立绘**，看灯箱开不开
 *
 * 背景：主人反馈"立绘点不开"。之前一直是推测（事件委托有没有挂上），本脚本把这条路走完：
 *   内联真脚本 → mount 出面板 → 派发 click 到立绘 → 读 DOM 看 `#xsd-lightbox-modal` 是否出现。
 *   同时诊断：委托监听条数、内联 onclick 是否存在、`window.xsdPortrait` 是否挂上。
 *
 * 用法：node _ef_lightbox_click.mjs
 * 退出码：0 通过 / 2 失败
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!existsSync(CHROME)) { console.error('没有 chrome'); process.exit(2); }

const script = readFileSync('卡片脚本/状态栏面板.js', 'utf8');
const RAW = '正文一段。\n\n<Status_block>\n<地点>墨山道 · 宗主大殿</地点>\n<修为>金丹中期</修为>\n<身份>墨山道六弟子 · 赵无忧</身份>\n<在场>闻观语、玄机子</在场>\n<角色1><名>闻观语</名><阶段>器重 +1</阶段><气场>静水无波</气场><心境>要稳住人心</心境><神态>端坐主位之侧</神态></角色1>\n<角色2><名>玄机子</名><阶段>客气而拘谨</阶段><气场>滴水不漏</气场><心境>正言顺地站位</心境><神态>上前一步</神态></角色2>\n</Status_block>';

const PAGE = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>·init·</title></head><body>
<div class="mes" mesid="3"><div class="mes_text">
<div class="xsd-root"><div id="content"><div class="loading">正在推演…</div></div></div>
</div></div>
<script>
window.__RAW = ${JSON.stringify(RAW)};
window.getChatMessages = function (id) { return [{ message: window.__RAW, mesid: 3, is_user: false }]; };
window.__probe = {};
/* ★ 模拟真机的恶劣环境：**跨源 window** —— 访问 parent/top 会抛错。
 *   原来的接线把「挂 API ＋ 绑监听 ＋ 打日志」塞在一个 try 里，这里一抛就**连监听都不绑**。 */
try {
  Object.defineProperty(window, 'top', { get: function () { throw new Error('Blocked a frame with origin "null" from accessing a cross-origin frame.'); }, configurable: true });
  Object.defineProperty(window, 'parent', { get: function () { throw new Error('cross-origin parent'); }, configurable: true });
} catch (e) { window.__probe.defineErr = String(e && e.message); }
</script>
<script>
__PANEL_SCRIPT__
</script>
<script>
(function () {
  var out = {};
  var hud = window.XsdHUD;
  out['XsdHUD'] = !!hud;
  var el = document.getElementById('content');
  if (hud) { var raw = hud.getMessageData(el); hud.mount(el, raw, 3); }
  /* 找立绘（微卡）：先看 a.xds-pw[data-xsd-open]，再看 img.xds-pi */
  var opener = el.querySelector('a.xds-pw[data-xsd-open]') || el.querySelector('[data-xsd-open]');
  var img = opener ? opener.querySelector('img.xds-pi') : el.querySelector('img.xds-pi');
  out['找到立绘入口(a)'] = !!opener;
  out['找到立绘图片(b)'] = !!img;
  out['图片有内联 onclick（兜底路）'] = !!(img && /xsdPortrait/.test(img.getAttribute('onclick') || ''));
  out['window.xsdPortrait 已挂'] = typeof window.xsdPortrait === 'object' && !!window.xsdPortrait;
  out['★ 委托监听已绑（wireCount>0）'] = !!(window.xsdPortrait && window.xsdPortrait.diag && window.xsdPortrait.diag().wireListeners > 0);
  out['opener 的 data-sources 长度'] = opener ? String(opener.getAttribute('data-sources') || '').length : -1;
  /* ★ 真的点一下（按真机行为：点击图片本身） */
  var target = img || opener;
  var boxBefore = document.querySelectorAll('#xsd-lightbox-modal').length;
  out['点击前灯箱数'] = boxBefore;
  if (target) {
    try {
      var ev = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      target.dispatchEvent(ev);
    } catch (e) { out['点击抛错'] = String(e && e.message); }
  }
  out['★ 面板自检横幅'] = String(el.textContent || '').indexOf('点击接线') >= 0;
  out['★ 挂 onclick 的是入口元素 [data-xsd-open]'] = typeof (opener && opener.onclick) === 'function';
  out['★ 直接点图片也能冒泡命中（图片在入口内）'] = !!(opener && img && (img === opener || opener.contains(img)));
  out['自检行原文（诊断用）'] = (function () {
    var f = el.querySelector('[data-xds-selfcheck]');
    return f ? f.textContent : '(没画上)';
  })();
  var box = document.querySelector('#xsd-lightbox-modal');
  out['★ 点击后灯箱出现'] = !!box;
  if (box) {
    var big = box.querySelector('img');
    out['灯箱里有大图'] = !!big;
    out['灯箱图片 src 前 60 字'] = big ? String(big.getAttribute('src')).slice(0, 60) : null;
    out['灯箱内提示文案'] = (box.textContent || '').slice(0, 60);
  }
  /* 兜底：直接调公开入口 */
  if (!box && window.xsdPortrait && window.xsdPortrait.openFrom && opener) {
    try { var r = window.xsdPortrait.openFrom(opener); out['直接调 openFrom 返回'] = r; } catch (e) { out['openFrom 抛错'] = String(e && e.message); }
    var box2 = document.querySelector('#xsd-lightbox-modal');
    out['★ 直调后灯箱出现'] = !!box2;
  }
  document.title = '·' + JSON.stringify(out) + '·';
})();
</script></body></html>`;

const inline = script.split('<' + '/script').join('<\\' + '/script');
writeFileSync('_ef_lb.html', PAGE.split('__PANEL_SCRIPT__').join(inline), 'utf8');

const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--user-data-dir=' + resolve('_ef_chrome_profile2'),
  '--virtual-time-budget=8000', '--dump-dom', 'file:///' + resolve('_ef_lb.html').replace(/\\/g, '/')],
{ encoding: 'utf8', timeout: 150000, maxBuffer: 64 * 1024 * 1024 });

const m = /<title>([\s\S]*?)<\/title>/.exec(r.stdout || '');
console.log('=== 浏览器里真点立绘 ===');
if (!m) { console.log('没拿到 title'); process.exit(2); }
const inner = m[1].replace(/^·|·$/g, '');
if (!inner.startsWith('{')) { console.log('title 不是 JSON：' + inner.slice(0, 200)); process.exit(2); }
const data = JSON.parse(inner.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
let bad = 0;
for (const [k, v] of Object.entries(data)) {
  const optional = k.includes('兜底路');                       // 跨源时内联 onclick 属可选路径
  const isBad = (v === false && !optional) || v === null;
  if (isBad) bad += 1;
  console.log(`  ${isBad ? '✘' : (v === false ? '·' : '✔')} ${k}: ${JSON.stringify(v)}${v === false && optional ? '（跨源下不可用，靠委托，属正常）' : ''}`);
}
if (bad) { console.log(`\n❌ ${bad} 项不符`); process.exit(2); }
console.log('\n✅ 灯箱点击这条路是通的');
