#!/usr/bin/env node
/**
 * _test_hud_locatemes.mjs —— 用**桩 DOM** 验证 `XsdHUD` 取原文／挂载这条路（真机报「取不到原文」的修复验收）
 *
 * 覆盖三个真机场景：
 *   ① 容器**还没进 DOM**（bootstrap 先 load）⇒ 靠 `window.frameElement` 找到消息 → 取到原文  ★ 本次修复点
 *   ② frameElement 拿不到（跨源）⇒ 靠 DOM 扫描挑"含状态块"的楼
 *   ③ 楼号传的是 `null` ⇒ `xsdFillPanel` 用容器反推楼号，而不是直接放弃
 *
 * 用法：node _test_hud_locatemes.mjs
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync('卡片脚本/状态栏面板.js', 'utf8');

/* ── 极简桩 DOM ── */
const el = (tag, attrs = {}, kids = []) => {
  const node = {
    tagName: tag.toUpperCase(), attrs: { ...attrs }, kids, parentNode: null, textContent: attrs.__text || '',
    getAttribute: (k) => (k in node.attrs ? node.attrs[k] : null),
    setAttribute: (k, v) => { node.attrs[k] = String(v); },
    querySelector: (sel) => node._find(sel),
    querySelectorAll: (sel) => node._findAll(sel),
    closest: (sel) => {
      let n = node;
      while (n) { if (n._matches(sel)) return n; n = n.parentNode; }
      return null;
    },
    _matches(sel) {
      const cls = String(node.attrs.class || '');
      if (sel === '.mes') return cls.split(/\s+/).includes('mes');
      if (sel === '.mes[mesid]') return cls.split(/\s+/).includes('mes') && 'mesid' in node.attrs;
      if (sel === '.mes_text') return cls.split(/\s+/).includes('mes_text');
      if (sel === '[data-xds-panel]') return 'data-xds-panel' in node.attrs;
      if (sel === '[data-xds-src]') return 'data-xds-src' in node.attrs;
      return false;
    },
    _findAll(sel) {
      const out = [];
      const walk = (n) => { for (const k of n.kids) { if (k._matches && k._matches(sel)) out.push(k); walk(k); } };
      walk(node);
      return out;
    },
    _find(sel) { return node._findAll(sel)[0] || null; },
    cloneNode: () => node,
    appendChild: (c) => { c.parentNode = node; node.kids.push(c); return c; },
  };
  for (const k of kids) k.parentNode = node;
  return node;
};

const RAW = '正文一段。\n\n<Status_block>\n<地点>北域 · 毒瘴沼泽</地点>\n<修为>元婴中期</修为>\n</Status_block>';

function buildScene({ withFrameElement, containerAttached }) {
  const mesText = el('div', { class: 'mes_text', __text: RAW });
  const panelHost = el('div', {});
  const mes = el('div', { class: 'mes', mesid: '7' }, [mesText, panelHost]);
  const other = el('div', { class: 'mes', mesid: '8' }, [el('div', { class: 'mes_text', __text: '【身份】自设' })]);
  const body = el('body', {}, [mes, other]);
  const container = el('div', { id: 'content' });        // 模拟 bootstrap 手里的容器
  if (containerAttached) panelHost.appendChild(container);
  const head = el('div', {});
  const doc = {
    body, head,
    getElementById: (id) => (id === 'xsd-hud-injected-style' ? null : null),
    createElement: (t) => el(t),
    querySelectorAll: (sel) => body.querySelectorAll(sel),
  };
  const win = { document: doc };
  if (withFrameElement) win.frameElement = container;     // 未进 DOM 时靠它 closest('.mes')
  win.parent = win; win.top = win;
  const ctx = {
    console: { log() {}, warn() {}, error() {} }, setTimeout() {}, document: doc, window: win,
    Buffer, TextDecoder, Uint8Array,
    atob: (x) => Buffer.from(x, 'base64').toString('binary'),
    getChatMessages: undefined,       // 强制走 DOM 抠法（真机上 API 可能也不在）
  };
  return { ctx, container, doc, mes, RAW };
}

const results = [];
const run = (label, opts, expectKey) => {
  const sc = buildScene(opts);
  const box = vm.createContext(sc.ctx);
  try { vm.runInContext(code, box, { timeout: 8000 }); } catch (e) { results.push([label, false, '加载抛错：' + e.message]); return; }
  const hud = sc.ctx.window.XsdHUD;
  if (!hud) { results.push([label, false, 'XsdHUD 没挂上']); return; }
  let raw = null, mid = null, err = '';
  try { raw = hud.getMessageData(sc.container); } catch (e) { err = e.message; }
  try { mid = hud.detectCurrentMessageId(sc.container); } catch (e) { err += ' / ' + e.message; }
  const ok = expectKey === 'raw' ? (typeof raw === 'string' && raw.includes('<Status_block>')) : mid === 7;
  results.push([label, ok, ok ? `取到「${String(raw).slice(0, 24)}…」mesid=${mid}` : `raw=${raw} mesid=${mid} ${err}`]);
};

run('① 容器未进 DOM ⇒ 靠 frameElement 定位', { withFrameElement: true, containerAttached: false }, 'raw');
run('② frameElement 不可用 ⇒ 靠 DOM 扫描挑含状态块的楼', { withFrameElement: false, containerAttached: false }, 'raw');
run('③ 容器已进 DOM ⇒ 直接 closest 命中', { withFrameElement: false, containerAttached: true }, 'raw');
run('④ 楼号溯源（mesid）', { withFrameElement: true, containerAttached: false }, 'mid');

let bad = 0;
console.log('【XsdHUD 取原文／溯源 桩测】\n');
for (const [l, ok, info] of results) { if (!ok) bad += 1; console.log(`  ${ok ? '✔' : '✘'} ${l}\n      ${info}`); }
if (bad) { console.log(`\n❌ ${bad}/${results.length} 失败`); process.exit(2); }
console.log(`\n✅ ${results.length}/${results.length} 通过`);
