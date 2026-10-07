#!/usr/bin/env node
/**
 * _chk_click_paths.mjs —— 断言「立绘点击」的四条路都在卡产物里
 *
 * 起因（2026-09-28 第三十一轮）：主人指出"之前可以、后面不行"。查明是我自己把两条路拆了：
 *   · 旧版 img 上有**内联 onclick**（同文档直接生效）
 *   · 旧版脚本启动靠**事件钩子自填**
 *   · 我改成 mini-shell 时把这两条都删了，只剩一条跨 realm 的委托 ⇒ 点不动
 * 本脚本把"四条路"固化，缺一条就红。
 *
 * 用法：node _chk_click_paths.mjs [卡.json]
 */
import { readFileSync } from 'node:fs';

const CARD = process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json';
const card = JSON.parse(readFileSync(CARD, 'utf8').replace(/^\uFEFF/, ''));
const panel = (card.data.extensions.tavern_helper.scripts || []).find((s) => /状态栏面板/.test(String(s.name)));
if (!panel) { console.error('卡里找不到「状态栏面板」脚本'); process.exit(2); }
const ps = String(panel.content);
const rs = String(card.data.extensions.regex_scripts.find((r) => /状态栏渲染/.test(r.scriptName)).replaceString);

const checks = [
  ['★ 路 0（最稳）：渲染后给入口挂**函数引用 onclick**（xsdWireInline）', ps.includes('function xsdWireInline(') && ps.includes('el.onclick = function')],
  ['★ 路 0+：同时挂 onmousedown 兜底', ps.includes('el.onmousedown = function')],
  ['★ 路 0 的调用点：填值后调用', ps.includes('xsdWireInline(panel)')],
  ['路 A：img 上有内联 onclick（同文档兜底；**含 stopPropagation 防"一次点击开两次箱"**）', ps.includes('onclick="try{event.stopPropagation();}catch(e){}if(window.xsdPortrait&amp;&amp;window.xsdPortrait.openFrom)')],
  ['路 C 的去重：capture 委托处理完要 stopPropagation（否则元素 onclick 再跑一次＝双开箱）', ps.includes('if (ev && typeof ev.stopPropagation === \'function\') ev.stopPropagation();')],
  ['双开箱的第二道保险：xsdOpenFrom 400ms 去重闸门', ps.includes('xsdLastOpen') && ps.includes('< 400')],
  ['路 B：事件钩子（换楼重绑 ＋ 补填）', ps.includes('hookEvents') && ps.includes('CHARACTER_MESSAGE_RENDERED')],
  ['路 C：委托监听（优先绑宿主 document）', ps.includes("'宿主 document'") && ps.includes("'本层 document（回落）'")],
  ['路 C+：补绑 mousedown（有的宿主吞 click）', ps.includes("addEventListener('mousedown', xsdPortraitClick, true)")],
  ['点击处理不用 closest（跨 realm 安全）', ps.includes('guard++ < 64')],
  ['面板显眼横幅（一眼可见接线状态）', ps.includes('data-xds-selfcheck') && ps.includes('点击接线：自包含=')],
  ['mount 之后会调 wirePortrait（把横幅画上）', ps.includes('if (typeof wirePortrait ===')],
  ['立绘 HTML 入口 [data-xsd-open] 仍在', ps.includes('data-xsd-open')],
  ['壳是单行 HTML（助手才会建 iframe）', rs.split('\n')[1].startsWith('<!DOCTYPE html><html lang="zh-CN"><head>')],
];

let bad = 0;
console.log('【立绘点击 · 四条路断言】' + CARD + '\n');
for (const [k, v] of checks) { if (!v) bad += 1; console.log(`  ${v ? '✔' : '✘'} ${k}`); }
if (bad) { console.log(`\n❌ 缺 ${bad} 项`); process.exit(2); }
console.log('\n✅ 四条路齐全：内联 onclick ＋ 事件钩子 ＋ 宿主委托（含 mousedown）＋ 自检行');
