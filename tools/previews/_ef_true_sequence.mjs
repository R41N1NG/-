#!/usr/bin/env node
/**
 * _ef_true_sequence.mjs —— 复现**真机时序**：壳先跑（XsdHUD 还不存在）→ 脚本后加载 → 面板该被填上
 *
 * 为什么要这条：真机上「面板是黑金本体」但**控制台一行日志都没有**。若 bootstrap 比卡内脚本先跑，
 *   它会重试 40×50ms≈2s；脚本若是"晚一点"才加载，早该填上；若根本没加载，就会停在"等待酒馆助手核心载入…"。
 *   本脚本把「壳 + 脚本」按真机顺序拼在一个页面里（**故意让壳先执行**），并读真实 DOM 判定。
 *
 * 用法：node _ef_true_sequence.mjs
 * 退出码：0 通过 / 2 失败
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!existsSync(CHROME)) { console.error('没有 chrome'); process.exit(2); }

const card = JSON.parse(readFileSync('仙姝墮-角色卡（全书群像）.json', 'utf8').replace(/^\uFEFF/, ''));
const rs = card.data.extensions.regex_scripts.find((r) => /状态栏渲染/.test(r.scriptName));
const shell = String(rs.replaceString).replace(/^\s*```[a-zA-Z]*\r?\n?/, '').replace(/\r?\n?```\s*$/, '');
const panel = readFileSync('卡片脚本/状态栏面板.js', 'utf8');

const RAW = '正文一段。\n\n<Status_block>\n<地点>墨山道 · 宗主大殿</地点>\n<修为>金丹中期</修为>\n<身份>墨山道六弟子 · 赵无忧</身份>\n<在场>闻观语</在场>\n<角色1><名>闻观语</名><阶段>器重 +1</阶段><气场>静水无波</气场><心境>稳住人心</心境><神态>端坐主位之侧</神态></角色1>\n</Status_block>';

/* 把壳里的 bootstrap 抠出来，做成"先执行"的那段（真机里 iframe 一建就执行） */
const bootstrap = /<script>([\s\S]*?)<\/script>/.exec(shell)[1];
const shellBody = shell.replace(/<script>[\s\S]*?<\/script>/, '');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>·init·</title></head><body>
<div class="mes" mesid="3"><div class="mes_text">
  <div class="xsd-root">${shellBody.replace(/<div id="content">[\s\S]*?<\/div><\/div>$/, '<div id="content"><div class="loading">正在推演…</div></div></div>')}</div>
</div></div>
<script>
window.__RAW = ${JSON.stringify(RAW)};
window.getChatMessages = function () { return [{ message: window.__RAW, mesid: 3, is_user: false }]; };
window.__log = [];
var _log = console.log, _warn = console.warn;
console.log = function () { window.__log.push([].slice.call(arguments).join(' ')); };
console.warn = function () { window.__log.push('WARN ' + [].slice.call(arguments).join(' ')); };
/* ① 壳的 bootstrap **先跑**（此时 XsdHUD 还不存在） */
try { (function(){ ${bootstrap} })(); window.__boot = 'ok'; } catch (e) { window.__boot = 'ERR ' + e.message; }
<\/script>
<script>
/* ② 500ms 后卡内脚本才"加载"（模拟助手晚一步注入） */
setTimeout(function () {
  (function () { ${panel.split('<' + '/script').join('<\\' + '/script')} })();
  window.__scriptLoaded = true;
}, 500);
<\/script>
<script>
setTimeout(function () {
  var el = document.getElementById('content');
  var out = { boot: window.__boot, scriptLoaded: !!window.__scriptLoaded, xsdhud: typeof window.XsdHUD };
  out['面板有 .xh（骨架已挂）'] = !!(el && el.querySelector('.xh'));
  out['已填格数'] = el ? [].slice.call(el.querySelectorAll('[data-xds]')).filter(function (n) { return (n.textContent || '').trim(); }).length : -1;
  out['地点'] = el && el.querySelector('[data-xds="loc"]') ? el.querySelector('[data-xds="loc"]').textContent.trim() : null;
  out['身份'] = el && el.querySelector('[data-xds="id"]') ? el.querySelector('[data-xds="id"]').textContent.trim() : null;
  out['样式已注入'] = !!document.getElementById('xsd-hud-injected-style');
  out['还有 loading 文案'] = /正在推演|等待酒馆助手核心载入|取不到原文/.test(el ? el.textContent : '');
  out['控制台日志条数'] = window.__log.length;
  out['日志样本'] = window.__log.slice(0, 4);
  document.title = '·' + JSON.stringify(out) + '·';
}, 3000);
<\/script></body></html>`;

writeFileSync('_ef_true_seq.html', html, 'utf8');
const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--user-data-dir=' + resolve('_ef_chrome_profile3'),
  '--virtual-time-budget=12000', '--dump-dom', 'file:///' + resolve('_ef_true_seq.html').replace(/\\/g, '/')],
{ encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024 });

const m = /<title>([\s\S]*?)<\/title>/.exec(r.stdout || '');
console.log('=== 真机时序复现：壳先跑 → 脚本后到 → 面板该被填上 ===');
if (!m) { console.log('没拿到 title（stdout ' + (r.stdout || '').length + '）'); process.exit(2); }
const inner = m[1].replace(/^·|·$/g, '');
if (!inner.startsWith('{')) { console.log('title 非 JSON：' + inner.slice(0, 200)); process.exit(2); }
const data = JSON.parse(inner.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
let bad = 0;
for (const [k, v] of Object.entries(data)) {
  /* 注意语义：`还有 loading 文案` **false 才是好**（说明骨架已被真面板顶掉） */
  const good = k.includes('还有 loading 文案') ? v === false
    : (k.includes('日志') ? true : (v !== false && v !== null && v !== 0));
  if (!good) bad += 1;
  console.log(`  ${good ? '✔' : '✘'} ${k}: ${JSON.stringify(v)}`);
}
if (bad) { console.log(`\n❌ ${bad} 项不符`); process.exit(2); }
console.log('\n✅ 时序这条路是通的');
