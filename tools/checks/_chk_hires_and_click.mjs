#!/usr/bin/env node
/** _chk_hires_and_click.mjs —— 断言「放大用大图」＋「自包含点击」都在卡产物里 */
import { readFileSync } from 'node:fs';

const c = JSON.parse(readFileSync(process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json', 'utf8').replace(/^\uFEFF/, ''));
const ps = String((c.data.extensions.tavern_helper.scripts || []).find((s) => /状态栏面板/.test(String(s.name))).content);

const checks = [
  ['① 自包含 onclick（函数引用，不依赖跨域）', ps.includes('function xsdWireInline(') && ps.includes('el.onclick = function')],
  ['② 填值后调用自包含接线', ps.includes('xsdWireInline(panel)')],
  ['③ 显眼横幅（面板上可见接线状态）', ps.includes('点击接线：自包含=')],
  ['④ 放大用大图链（.png 优先）', ps.includes('function xsdBigSourcesFor') && ps.includes("XSD_BIG_EXTS = ['.png'")],
  ['⑤ 灯箱起始源取大图（big2first(chain, want)：优先"面板上正显示的那张"的大图）', ps.includes('function big2first(chainJson, want)') && ps.includes('big2first(chain, want)')],
  ['⑥ 面板仍用小图（.jpg 优先，省流量）', ps.includes("XSD_LOCAL_EXTS = ['.jpg', '.png', '.webp']")],
  ['⑦ 翻面组必须是大图（data-alt 用 XSD_BIG_EXTS[0]，否则一按「›」就从高清掉回马赛克）', ps.includes('xsdStageImages(pinyin, st, table, XSD_BIG_EXTS[0])')],
  ['⑧ 翻面数据两段式读取（data-alt／data-alt-idx／data-stage 写在 img 上）', ps.includes('function xsdAttrFrom(') && ps.includes("xsdAttrFrom(el, img, 'data-alt')")],
  ['⑨ 开一次箱：capture 委托 stopPropagation ＋ 400ms 去重闸门', ps.includes('xsdLastOpen') && ps.includes("ev.stopPropagation();")],
];
let bad = 0;
console.log('【大图放大 ＋ 自包含点击 断言】\n');
for (const [k, v] of checks) { if (!v) bad += 1; console.log(`  ${v ? '✔' : '✘'} ${k}`); }
if (bad) { console.log(`\n❌ 缺 ${bad} 项`); process.exit(2); }
console.log('\n✅ 全部通过');
