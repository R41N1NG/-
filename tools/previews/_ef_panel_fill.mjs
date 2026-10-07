#!/usr/bin/env node
/**
 * _ef_panel_fill.mjs —— **在无头 Chrome 里跑真脚本**，验证「取原文 → 填值 → 面板显示」全链路
 *
 * 为什么必须这么做：主人两次说"还是老问题"，我一直在离线自证。这次直接把**卡里那份脚本**
 *   加载进浏览器，模拟酒馆的宿主环境（`.mes` / `.mes_text` / 迷你壳 / getChatMessages），
 *   调 `XsdHUD.mount()`，然后**读真正的 DOM 文本**看格子填没填上。
 *
 * 用法：node _ef_panel_fill.mjs
 * 退出码：0 通过 / 2 失败
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import http from 'node:http';

/** 定位聊天目录：优先「名字以 仙姝墮 开头且最近修改」的那个（酒馆会改名，写死会 ENOENT） */
function resolveChatDir() {
  const root = 'E:/tavern/SillyTavern/data/default-user/chats';
  try {
    const ds = readdirSync(root, { withFileTypes: true })
      .filter(function (d) { return d.isDirectory() && /^仙姝墮/.test(d.name); })
      .map(function (d) { return { p: join(root, d.name), t: statSync(join(root, d.name)).mtimeMs }; })
      .sort(function (a, b) { return b.t - a.t; });
    if (ds.length) return ds[0].p;
  } catch (e) { /* 退回落定名 */ }
  return join(root, '仙姝墮 · 一张跑全书');
}

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!existsSync(CHROME)) { console.error('没有 chrome'); process.exit(2); }

/* ① 取一份**真实**状态块原文（最近一楼、当前 swipe） */
const DIR = resolveChatDir();
let raw = '';
try {
  const files = readdirSync(DIR).map((f) => ({ f, t: statSync(join(DIR, f)).mtimeMs })).sort((a, b) => b.t - a.t);
  const lines = readFileSync(join(DIR, files[0].f), 'utf8').split('\n').filter(Boolean);
  for (let i = 1; i < lines.length; i += 1) {
    const r = JSON.parse(lines[i]);
    const sw = Array.isArray(r.swipes) && typeof r.swipe_id === 'number' ? r.swipes[r.swipe_id] : null;
    const txt = String(sw ?? r.mes ?? '');
    if (txt.includes('<Status_block>')) raw = txt;
  }
} catch (e) { /* 用兜底样本文 */ }
if (!raw) raw = '正文一段。\n\n<Status_block>\n<地点>北域 · 毒瘴沼泽</地点>\n<修为>元婴中期</修为>\n<身份>魂欢殿主 · 鬼医病相思</身份>\n<目标>摘花芷凝</目标>\n</Status_block>';
console.log('现场原文长度 ' + raw.length + '｜含状态块 ' + raw.includes('<Status_block>'));

/* ② 卡里那份脚本（真货） */
const script = readFileSync('卡片脚本/状态栏面板.js', 'utf8');

/* ③ 造宿主页面：一个 .mes[mesid=3] + .mes_text（含迷你壳）*/
const page = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>#P#</title></head><body>
<div id="chat">
  <div class="mes" mesid="2"><div class="mes_text">上一楼</div></div>
  <div class="mes" mesid="3"><div class="mes_text">
    <div class="saying">他佝偻着背，把玉简收进袖中。</div>
    <div class="xsd-root"><div id="content"><div class="loading">正在推演仙姝墮态势…</div></div></div>
  </div></div>
</div>
<script>
/* 宿主 API 桩：真机上由酒馆助手提供 */
window.__RAW = ${JSON.stringify(raw)};
window.getChatMessages = function (id) {
  return [{ message: window.__RAW, mesid: (id === undefined ? 3 : id), is_user: false }];
};
window.__probe = {};
</script>
<script>
__PANEL_SCRIPT__
</script>
<script>
(function () {
  var out = {};
  var hud = window.XsdHUD;
  out['XsdHUD 已挂载'] = !!hud;
  out['加载后诊断'] = window.__after || null;
  if (!hud) { document.title = '#P#' + JSON.stringify(out) + '#P#'; return; }
  var host = document.querySelector('.mes[mesid="3"] .xsd-root');
  var el = document.getElementById('content');
  /* 真实时序：容器此刻**还没被宿主插入**（bootstrap 先 load）—— 这正是真机报"取不到原文"的场景 */
  var detached = el;
  var raw1 = hud.getMessageData(detached);
  out['① 容器未插入时取到原文'] = !!(raw1 && raw1.length > 0);
  /* 现在按宿主行为插入，再正式 mount */
  host.innerHTML = '';
  host.appendChild(el);
  var res = hud.mount(el, raw1 || window.__RAW, hud.detectCurrentMessageId(el));
  out['② mount 返回'] = !!res;
  var q = function (k) { var n = el.querySelector('[data-xds="' + k + '"]'); return n ? (n.textContent || '').trim() : null; };
  out['③ 地点'] = q('loc');
  out['④ 修为'] = q('realm');
  out['⑤ 身份'] = q('id');
  out['⑥ 目标'] = q('goal');
  out['⑦ 槽位总数'] = el.querySelectorAll('[data-xds]').length;
  out['⑧ 已填格数'] = [].slice.call(el.querySelectorAll('[data-xds]')).filter(function (n) { return (n.textContent || '').trim(); }).length;
  var sampleHit = null;
  [].slice.call(el.querySelectorAll('*')).forEach(function (n) {
    if (!sampleHit && n.children.length === 0 && /元婴初期|九皇子/.test(n.textContent || '')) {
      sampleHit = n.getAttribute('data-xds') || n.className || n.tagName;
    }
  });
  out['⑨ 样例值残留位置（null=没有）'] = sampleHit;
  out['⑨b 骨架是否真的空（顶部样式里那串 base64 不算）'] = sampleHit === null;
  out['⑩ 在场要角已渲染'] = /xds-cc|闻观语|柳玉|黑袍属下|病相思|残阳老怪/.test(el.innerHTML);
  out['⑪ 样式已注入（父文档 head）'] = !!document.getElementById('xsd-hud-injected-style');
  out['⑫ 样式中含字体 data URI'] = (function () { var s = document.getElementById('xsd-hud-injected-style'); return !!(s && s.textContent.indexOf('url(data:font/woff2;base64,') >= 0); })();
  out['⑬ 骨架真的进了容器（无 .xh 则是没渲染）'] = !!el.querySelector('.xh');
  document.title = '·' + JSON.stringify(out) + '·';
})();
<\/script></body></html>`;

writeFileSync('_ef_fill.html', page, 'utf8');
writeFileSync('_ef_fill_panel.js', script, 'utf8');

const r = (() => {
  /* ⚠️ 两个坑都记下来：
   *   ① `file://` 下 Chrome 不加载 `<script src>` 的本地脚本（静默失败）
   *   ② 起 http 服务器时**不能**用 spawnSync —— Node 事件循环被阻塞，请求永远得不到响应
   *   ⇒ 改成把脚本**内联**进页面（只需转义 `</script>`），并给独立 user-data-dir 免 profile 锁。 */
  const inline = script.split('<' + '/script').join('<\\' + '/script');   // 防 HTML 解析器提前收尾
  /* ⚠️ 用 `split/join` 而不是 `String.replace`：占位符在模板里出现两次，
   *   而 `replace` 只换第一处 —— 上一次就是因此把整段脚本注进了**注释里**（探针全 false）。 */
  const payload = 'window.__err = null; window.onerror = function (m, s, l, c, e) { window.__err = String(m) + " @" + l + ":" + c; };\n'
    + inline + '\n'
    + 'window.__after = { err: window.__err, xsdhud: typeof XsdHUD, winxsd: typeof window.XsdHUD };';
  const inlined = page.split('__PANEL_SCRIPT__').join(payload);
  writeFileSync('_ef_fill_inline.html', inlined, 'utf8');
  return spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--user-data-dir=' + resolve('_ef_chrome_profile'),
    '--virtual-time-budget=8000', '--dump-dom',
    'file:///' + resolve('_ef_fill_inline.html').replace(/\\/g, '/')],
  { encoding: 'utf8', timeout: 150000, maxBuffer: 64 * 1024 * 1024 });
})();

const m = /<title>([\s\S]*?)<\/title>/.exec(r.stdout || '');
console.log('\n=== 浏览器里跑真脚本：取原文 → mount → 读真实 DOM ===');
if (!m) { console.log('没拿到 title（stdout ' + (r.stdout || '').length + ' 字）'); process.exit(2); }
const inner = m[1].replace(/^·|·$/g, '');
if (!inner.startsWith('{')) { console.log('title 不是 JSON：' + inner.slice(0, 200)); process.exit(2); }
let data;
try { data = JSON.parse(inner.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')); }
catch (e) { console.log('JSON 解析失败：' + inner.slice(0, 300)); process.exit(2); }

let bad = 0;
for (const [k, v] of Object.entries(data)) {
  /* 判定：布尔 false 一律算失败；显式 null 也算失败；唯二例外 ——
   *   ⑨ 样例残留位置（null 才是好）、⑨b 布尔（true 才是好） */
  let isBad;
  if (k.startsWith('⑨b')) isBad = v !== true;
  else if (k.startsWith('⑨')) isBad = v !== null;
  else isBad = (v === false || v === null);
  if (isBad) bad += 1;
  console.log(`  ${isBad ? '✘' : '✔'} ${k}: ${JSON.stringify(v)}`);
}
if (bad) { console.log(`\n❌ ${bad} 项不符`); process.exit(2); }
console.log('\n✅ 全部通过 —— 面板确实被脚本填上了');
