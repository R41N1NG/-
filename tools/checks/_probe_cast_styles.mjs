#!/usr/bin/env node
/**
 * _probe_cast_styles.mjs —— 问浏览器**算出来的颜色**（getComputedStyle），别猜
 *
 * 2026-09-28 第三十六轮续：主人贴真机截图说「看不清，还是黑」。
 *   我先前只改了 `.xh-*` 那套类（细目/折叠区），可「在场要角」那块是**脚本 renderCast 产出的
 *   `.xds-*` 类** —— 去 CSS 里搜 `xds-` ：**一条规则都没有**（立绘/小卡只下发了**布局**行内样式，
 *   没下发任何颜色）⇒ 那块的文字颜色根本不是我在 CSS 里定的那个，而是**继承**来的。
 * 本脚本把这条"继承链"整个打印出来：从面板根一层层往下，每个元素的 computed color 是什么。
 *
 * 用法：node _probe_cast_styles.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!existsSync(CHROME)) { console.error('没有 chrome'); process.exit(2); }
const script = readFileSync('卡片脚本/状态栏面板.js', 'utf8');

const RAW = '正文。\n\n<Status_block>'
  + '<地点>墨山道 · 宗主大殿</地点><修为>金丹中期</修为><身份>墨山道六弟子 · 赵无忧</身份>'
  + '<目标>赴天溪城协防</目标><危机>兽潮压境</危机><关系刻度>孤月 +1</关系刻度>'
  + '<在场>闻观语、叶红缨</在场>'
  + '<角色1><名>闻观语</名><阶段>器重 +1</阶段><气场>静水无波</气场><心境>人心还须稳住</心境><神态>端坐主位之侧</神态></角色1>'
  + '<角色2><名>叶红缨</名><阶段>信任 +1</阶段><气场>硬撑着的燥</气场><心境>怕被问起幽寂谷</心境><神态>咬了咬下唇</神态></角色2>'
  + '<角色3><名>玄机子</名><阶段>客气而拘谨</阶段><气场>滴水不漏</气场><心境>要名正言顺地站位</心境><神态>上前一步</神态></角色3>'
  + '</Status_block>';

const PAGE = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>·init·</title>
<style>/* 模拟酒馆主题的正文色：**注意**——宿主会给面板里的元素"继承"这个颜色 */
body{background:#0b0c10;color:#d4d4d4;font-family:"Microsoft YaHei",sans-serif}</style>
</head><body>
<div class="mes" mesid="3"><div class="mes_text">
<div class="xsd-root"><div id="content"><div class="loading">正在推演…</div></div></div>
</div></div>
<script>
window.__RAW = ${JSON.stringify(RAW)};
window.getChatMessages = function () { return [{ message: window.__RAW, mesid: 3, is_user: false }]; };
</script>
<script>
__PANEL_SCRIPT__
</script>
<script>
(function () {
  var out = {};
  var hud = window.XsdHUD;
  var el = document.getElementById('content');
  out['XsdHUD'] = !!hud;
  if (!hud) { document.title = '·' + JSON.stringify(out) + '·'; return; }
  hud.mount(el, hud.getMessageData(el), 3);

  function cs(node, prop) { try { return getComputedStyle(node)[prop]; } catch (e) { return 'ERR'; } }
  function add(label, node) {
    if (!node) { out[label] = '(无此元素)'; return; }
    out[label] = cs(node, 'color') + ' / ' + cs(node, 'fontSize');
  }
  add('宿主 body（继承源）', document.body);
  add('.xh 面板根', el.querySelector('.xh'));
  add('.xh-cc（设计稿类，CSS 里有规则）', el.querySelector('.xh-cc'));
  add('.xh-v 正文值（CSS 里有规则）', el.querySelector('.xh-v'));
  add('.xh-k 细目标签（CSS 里有规则）', el.querySelector('.xh-k'));
  /* ★ 真机那块是 xds-*（脚本产出） */
  add('★ .xds-cc（在场要角卡）', el.querySelector('.xds-cc'));
  add('★ .xds-cc-h（角色名）', el.querySelector('.xds-cc-h'));
  add('★ .xds-cc-body', el.querySelector('.xds-cc-body'));
  add('★ .xds-ck（阶段/气场…标签）', el.querySelector('.xds-ck'));
  add('★ .xds-cv（标签的值）', el.querySelector('.xds-cv'));
  add('★ .xds-cc-r（一行）', el.querySelector('.xds-cc-r'));
  out['★ .xds-cc 上的行内 style'] = (function () {
    var n = el.querySelector('.xds-cc'); return n ? (n.getAttribute('style') || '(无)') : '(无此元素)';
  })();
  out['★ CSS 里有 .xds- 规则吗'] = (function () {
    var hit = 0, sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i += 1) {
      var rs; try { rs = sheets[i].cssRules; } catch (e) { continue; }
      for (var j = 0; j < rs.length; j += 1) if (rs[j].selectorText && rs[j].selectorText.indexOf('.xds-') >= 0) hit += 1;
    }
    return hit;
  })();
  out['★ 在场要角这几行的字号'] = (function () {
    var n = el.querySelector('.xds-cv'); return n ? getComputedStyle(n).fontSize : '-';
  })();
  /* 逐张立绘图：是真图还是碎了？（naturalWidth===0 ⇒ 浏览器没加载成功 ⇒ 显示 alt 文本） */
  out['★ 立绘图逐张体检（名字｜src 头｜naturalWidth｜complete）'] = [].slice.call(el.querySelectorAll('img.xds-pi')).map(function (im) {
    var nm = im.getAttribute('data-char-name') || '?';
    var s = String(im.getAttribute('src') || '');
    return nm + '｜' + s.slice(0, 26) + '｜w=' + im.naturalWidth + '｜' + im.complete;
  });
  /* 降级头像（没立绘的角色最后落的那张 SVG）到底能不能解码出来？
   * 主人截图里「玄机子」那格是个**碎图 + alt 文字**，所以必须单独验一次。 */
  var done = function (extra) {
    for (var k in extra) out[k] = extra[k];
    document.title = '·' + JSON.stringify(out) + '·';
  };
  try {
    var api = window.xsdPortrait || {};
    var svg = api.fallbackSvg ? api.fallbackSvg('玄机子', '滴水不漏', 'xuanjizi') : null;
    out['★ 降级 SVG 生成'] = svg ? ('有，长 ' + svg.length + '，头 ' + svg.slice(0, 34)) : '(没有 fallbackSvg 入口)';
    var probe = new Image();
    var settled = false;
    probe.onload = function () { if (settled) return; settled = true; done({ '★ 降级 SVG 能否解码': '能，' + probe.naturalWidth + '×' + probe.naturalHeight }); };
    probe.onerror = function () { if (settled) return; settled = true; done({ '★ 降级 SVG 能否解码': '★不能★（浏览器拒绝加载 ⇒ 真机上就是碎图 + alt 文字）' }); };
    if (svg) probe.src = svg;
    setTimeout(function () { if (!settled) { settled = true; done({ '★ 降级 SVG 能否解码': '超时未回调（既没 load 也没 error）' }); } }, 1200);
  } catch (e) {
    done({ '★ 降级 SVG 能否解码': '抛错：' + ((e && e.message) || e) });
  }
})();
</script></body></html>`;

const inlined = PAGE.split('__PANEL_SCRIPT__').join(script.split('<' + '/script').join('<\\' + '/script'));
writeFileSync('_probe_cast.html', inlined, 'utf8');

const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--user-data-dir=' + resolve('_ef_chrome_profile'),
  '--virtual-time-budget=8000', '--dump-dom', 'file:///' + resolve('_probe_cast.html').replace(/\\/g, '/')],
{ encoding: 'utf8', timeout: 150000, maxBuffer: 64 * 1024 * 1024 });

const m = /<title>([\s\S]*?)<\/title>/.exec(r.stdout || '');
console.log('=== 在场要角那一块：浏览器算出来的颜色（并据此判定成败）===\n');
if (!m) { console.log('没拿到 title'); process.exit(2); }
const inner = m[1].replace(/^·|·$/g, '');
if (!inner.startsWith('{')) { console.log('title 不是 JSON：' + inner.slice(0, 200)); process.exit(2); }
const data = JSON.parse(inner.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));

const host = String(data['宿主 body（继承源）'] || '').split(' / ')[0];
const cssRules = Number(data['★ CSS 里有 .xds- 规则吗'] || 0);
const ck = String(data['★ .xds-ck（阶段/气场…标签）'] || '').split(' / ');
const cv = String(data['★ .xds-cv（标签的值）'] || '').split(' / ');
const h = String(data['★ .xds-cc-h（角色名）'] || '').split(' / ');
const svgOK = /^能，/.test(String(data['★ 降级 SVG 能否解码'] || ''));

/* 判定：① CSS 里必须有 .xds- 规则；② 三个元素的颜色/字号**不许等于宿主继承值**（等于＝根本没被样式化）；③ SVG 降级必须能解码 */
const checks = [
  ['★ CSS 里有 `.xds-` 规则（>0）', cssRules > 0, '实测 ' + cssRules + ' 条'],
  ['★ 角色名有专属颜色/字号（≠ 宿主继承）', h[0] !== host && h[1] !== '16px', h.join(' / ')],
  ['★ 属性标签有专属颜色/字号（≠ 宿主继承）', ck[0] !== host && ck[1] !== '16px', ck.join(' / ')],
  ['★ 属性值有专属颜色/字号（≠ 宿主继承）', cv[0] !== host && cv[1] !== '16px', cv.join(' / ')],
  ['★ 没立绘的角色降级 SVG 能解码（否则是碎图＋alt 文字）', svgOK, String(data['★ 降级 SVG 能否解码'] || '')],
  ['★ 未登记立绘的角色直接用 SVG（不再闯 404 链）',
    String((data['★ 立绘图逐张体检（名字｜src 头｜naturalWidth｜complete）'] || []).join()).includes('data:image/svg+xml'),
    String((data['★ 立绘图逐张体检（名字｜src 头｜naturalWidth｜complete）'] || []).join(' ／ ')) ],
];
let bad = 0;
for (const [k, ok, detail] of checks) { if (!ok) bad += 1; console.log(`  ${ok ? '✔' : '✘'} ${k}\n      → ${detail}`); }
console.log('\n  （宿主继承色＝' + host + '；凡是与它相同的元素，都说明**没被样式化**）');
if (bad) { console.log(`\n❌ ${bad} 项不符 —— 在场要角那块又变成裸继承了`); process.exit(2); }
console.log('\n✅ 在场要角已被真正样式化（有专属色/字号，未登记角色落 SVG）');
