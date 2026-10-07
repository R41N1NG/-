#!/usr/bin/env node
/**
 * _ef_lightbox_flip.mjs —— 在无头 Chrome 里**真的开一次灯箱**，验「同阶段翻面（翻页）」这条路
 *
 * 为什么要有它（2026-09-28 第三十六轮，主人：「角色没有翻页」）：
 *   上一轮我只验了"点开"，没验"点开之后能不能翻"。这一轮把翻面整条数据链走一遍：
 *     ① 微卡上到底有没有 `data-alt`（同阶段各张的首选 URL）／`data-alt-idx`；
 *     ② `xsdOpenFrom` 有没有把 `alts` **传进** `xsdOpenLightbox`（**本轮真因就在这里**：
 *        微卡把 `data-alt` 写在 `<img>` 上，而 `xsdLightboxArgsFrom` 只读 `<a>` ⇒ `a.alts` 恒为 undefined）；
 *     ③ 灯箱里有没有 `‹ ›` 两个按钮 ＋ `n / N` 计数；点 `›` 之后 src 与计数有没有变；
 *     ④ `←`/`→` 键能不能翻。
 *
 * 用法：node _ef_lightbox_flip.mjs
 * 退出码：0 通过 / 2 失败
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!existsSync(CHROME)) { console.error('没有 chrome'); process.exit(2); }
const script = readFileSync('卡片脚本/状态栏面板.js', 'utf8');

/* 用**有 2 张以上同阶段立绘**的角色当样本（图库与 XSD_VARIANTS 的登记以此为准） */
const RAW = '正文一段。\n\n<Status_block>'
  + '<地点>墨山道 · 宗主大殿</地点><环境>殿内焚香，窗外细雨</环境><修为>金丹中期</修为>'
  + '<身份>墨山道六弟子 · 赵无忧</身份>'
  + '<在场>闻观语、叶红缨、孤月</在场>'
  + '<角色1><名>闻观语</名><阶段>器重 +1</阶段><气场>静水无波</气场><心境>要稳住人心</心境><神态>端坐主位之侧</神态></角色1>'
  + '<角色2><名>叶红缨</名><阶段>戒备</阶段><气场>冷冽</气场><心境>压着火</心境><神态>按剑而立</神态></角色2>'
  + '<角色3><名>孤月</名><阶段>暧昧</阶段><气场>清冷</气场><心境>不肯认</心境><神态>侧身避开</神态></角色3>'
  + '</Status_block>';

const PAGE = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>·init·</title></head><body>
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
  out['XsdHUD 已挂载'] = !!hud;
  var el = document.getElementById('content');
  if (!hud) { document.title = '·' + JSON.stringify(out) + '·'; return; }
  hud.mount(el, hud.getMessageData(el), 3);
  var style = document.getElementById('xsd-hud-injected-style');
  out['样式已注入'] = !!style;

  /* ① 微卡上的 data-alt 现状 */
  var cards = [].slice.call(el.querySelectorAll('[data-xsd-open]'));
  out['微卡数'] = cards.length;
  var groups = cards.map(function (c) {
    var img = c.querySelector('img');
    var altRaw = (img && img.getAttribute('data-alt')) || c.getAttribute('data-alt') || '';
    var arr = [];
    try { arr = JSON.parse(altRaw) || []; } catch (e) { arr = []; }
    return {
      n: c.getAttribute('data-char-name') || '?',
      分组张数: arr.length,
      写在: img && img.getAttribute('data-alt') ? 'img' : (c.getAttribute('data-alt') ? 'a' : '无'),
      样例: String(arr[0] || '').split('/').pop(),
    };
  });
  out['各微卡 data-alt 分组张数'] = groups.map(function (g) { return g.n + ':' + g.分组张数 + '(' + g.写在 + ')'; }).join(' ｜ ');
  var multi = cards.filter(function (c, i) { return groups[i].分组张数 > 1; });
  out['★ 有同阶段多张的微卡数'] = multi.length;

  /* ② 开灯箱（挑一张有多张的；没有就挑第一张）。
   *    先装个计数器：面板在**开箱时**才会注册 keydown（ESC/←/→），
   *    数一数它到底注册到哪个文档上，免得我瞎猜"监听没绑"。 */
  var kdDoc = 0, kdWin = 0, kdBody = 0, opens = 0;
  (function () {
    var oa = document.addEventListener.bind(document);
    document.addEventListener = function (t, f, o) { if (t === 'keydown') kdDoc += 1; return oa(t, f, o); };
    var ow = window.addEventListener.bind(window);
    window.addEventListener = function (t, f, o) { if (t === 'keydown') kdWin += 1; return ow(t, f, o); };
    if (document.body) { var ob = document.body.addEventListener.bind(document.body); document.body.addEventListener = function (t, f, o) { if (t === 'keydown') kdBody += 1; return ob(t, f, o); }; }
    /* 数一数**开了几次箱**（内联 onclick 与委托监听同时命中时会开两次 —— 这会让 keydown 监听翻倍、
     *   并且先注册的那份 handler 闭包里握着的是**已经被换掉的** flip/counter/big） */
    var op = document.body.appendChild.bind(document.body);
    document.body.appendChild = function (n) { if (n && n.id === 'xsd-lightbox-modal') opens += 1; return op(n); };
  })();
  var target = multi[0] || cards[0];
  var box = null;
  if (target) {
    try { target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); }
    catch (e) { out['点击抛错'] = String(e && e.message); }
    box = document.querySelector('#xsd-lightbox-modal');
  }
  out['★ 灯箱已开'] = !!box;
  if (box) {
    var bar = box.firstChild ? box.firstChild.firstChild : null;
    var btns = [];
    if (bar) btns = [].slice.call(bar.querySelectorAll('button'));
    out['★ 灯箱内按钮数（应 2）'] = btns.length;
    var big = box.querySelector('img');
    var counter = null;
    if (bar) {
      var spans = [].slice.call(bar.querySelectorAll('span'));
      for (var i = 0; i < spans.length; i += 1) if (/\\d+\\s*\\/\\s*\\d+/.test(spans[i].textContent || '')) counter = spans[i];
    }
    out['★ 计数「n / N」'] = counter ? counter.textContent : null;
    out['★ 大图 src（尾段）'] = big ? String(big.getAttribute('src') || '').split('/').pop() : null;
    var tip = bar ? (bar.textContent || '') : '';
    out['★ 提示文案含「翻面」'] = tip.indexOf('翻面') >= 0;
    /* ③ 点 › 翻一张 */
    var srcBefore = big ? String(big.getAttribute('src') || '') : '';
    var next = null;
    for (var j = 0; j < btns.length; j += 1) if ((btns[j].textContent || '').indexOf('›') >= 0) next = btns[j];
    if (next) { try { next.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); } catch (e) { out['点下一张抛错'] = String(e && e.message); } }
    out['★ 点「›」后按钮存在'] = !!next;
    out['★ 点「›」后 src 变化'] = big ? (String(big.getAttribute('src') || '') !== srcBefore) : false;
    out['★ 点「›」后计数'] = counter ? counter.textContent : null;
    /* ④ ← / → 键（每次都**重新从 DOM 取**计数与 src，别用捕获的旧引用） */
    var readCounter = function () {
      var b = document.querySelector('#xsd-lightbox-modal');
      if (!b) return null;
      var sp = [].slice.call(b.querySelectorAll('span'));
      for (var i = 0; i < sp.length; i += 1) if (/\\d+\\s*\\/\\s*\\d+/.test(sp[i].textContent || '')) return sp[i].textContent;
      return null;
    };
    var readSrc = function () { var b = document.querySelector('#xsd-lightbox-modal'); var im = b && b.querySelector('img'); return im ? String(im.getAttribute('src') || '') : ''; };
    var cntBeforeKey = readCounter(), srcBeforeKey = readSrc();
    /* 自测：我自己的监听能不能收到？（证明"派发"这件事本身没问题） */
    var sawSelf = 0;
    document.addEventListener('keydown', function () { sawSelf += 1; });
    var sendKey = function (key, keyCode, node) {
      try { (node || document).dispatchEvent(new KeyboardEvent('keydown', { key: key, keyCode: keyCode, which: keyCode, bubbles: true, cancelable: true })); }
      catch (e) { out['方向键抛错'] = String(e && e.message); }
    };
    /* ⚠️ 一次只发**一个**键再读一次 —— 上一版连发 3 个 → 步进叠在一起，读数看着像"没反应" */
    sendKey('ArrowRight', 39, document);
    out['（诊断）自测监听到的 keydown 次数'] = sawSelf;
    out['★ → 键后计数'] = readCounter();
    out['★ → 键后 src 变化'] = readSrc() !== srcBeforeKey;
    out['（诊断）按键前计数'] = cntBeforeKey;
    out['（诊断）灯箱还在'] = !!document.querySelector('#xsd-lightbox-modal');
    var srcBeforeLeft = readSrc();
    sendKey('ArrowLeft', 37, document);
    out['★ ← 键后计数'] = readCounter();
    out['★ ← 键后 src 变化'] = readSrc() !== srcBeforeLeft;
    sendKey('Escape', 27, document);
    out['（诊断）ESC 后灯箱还在'] = !!document.querySelector('#xsd-lightbox-modal');
    out['（诊断）开箱时注册的 keydown：document/window/body'] = kdDoc + '/' + kdWin + '/' + kdBody;
    out['★ 开箱次数（内联＋委托同时命中就会开 2 次）'] = opens;
  }
  /* ⑤ 源码级证据：函数里到底传了什么（哪怕上面的 DOM 探针因环境差异失败，这一条也能定位） */
  out['源码：xsdOpenFrom 传 a.alts'] = /xsdOpenLightbox\\([^)]*a\\.alts/.test(String(window.__PANEL_SRC__ || '')) || null;
  document.title = '·' + JSON.stringify(out) + '·';
})();
</script></body></html>`;

/* 把源码也塞进页面，供 ⑤ 做纯文本判断 */
const withSrc = PAGE.replace('<script>\n__PANEL_SCRIPT__',
  '<script>window.__PANEL_SRC__ = ' + JSON.stringify(script) + ';</script>\n<script>\nvar __PANEL_SRC__ = window.__PANEL_SRC__;\n__PANEL_SCRIPT__');

const inline = withSrc.split('<' + '/script').join('<\\' + '/script');
writeFileSync('_ef_flip.html', PAGE.split('__PANEL_SCRIPT__').join(script.split('<' + '/script').join('<\\' + '/script')), 'utf8');

const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--user-data-dir=' + resolve('_ef_chrome_profile3'),
  '--virtual-time-budget=8000', '--dump-dom', 'file:///' + resolve('_ef_flip.html').replace(/\\/g, '/')],
{ encoding: 'utf8', timeout: 150000, maxBuffer: 64 * 1024 * 1024 });

const m = /<title>([\s\S]*?)<\/title>/.exec(r.stdout || '');
console.log('=== 浏览器里真开灯箱：验「同阶段翻面」===');
if (!m) { console.log('没拿到 title（stdout ' + String(r.stdout || '').length + ' 字）'); process.exit(2); }
const inner = m[1].replace(/^·|·$/g, '');
if (!inner.startsWith('{')) { console.log('title 不是 JSON：' + inner.slice(0, 200)); process.exit(2); }
const data = JSON.parse(inner.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));

let bad = 0;
const MUST = /^★/;
for (const [k, v] of Object.entries(data)) {
  const bad1 = MUST.test(k) && (v === false || v === 0 || v === null);
  if (bad1) bad += 1;
  console.log(`  ${bad1 ? '✘' : '✔'} ${k}: ${JSON.stringify(v)}`);
}
if (bad) { console.log(`\n❌ ${bad} 项不符 —— 翻面这条路是断的`); process.exit(2); }
console.log('\n✅ 同阶段翻面这条路是通的（灯箱有按钮、能翻、计数会动）');
