#!/usr/bin/env node
/**
 * _sync_panel_css.mjs —— 把 `_card_panel_v4.css`（样式单一真源）同步进 `_card_panel_v4.replace.html`
 *
 * 为什么要有它（2026-09-28 第三十六轮，一个"改了没生效"的经典坑）：
 *   `_pack_panel_script.mjs` 早先是**从 `_card_panel_v4.replace.html` 的 `<style>` 里切 CSS**，
 *   而它自己生成的 banner 却写着"要改样式 → 改 `_card_panel_v4.css`"。
 *   我照 banner 改了 `.css`（对比度／噪点）⇒ **卡里一点没变**，还回报"改好了"；
 *   最后是"渲一张真图去量像素"才发现底色分毫未动（replace.html 里躺着旧 CSS）。
 *
 * 现在两道保险：
 *   ① 本脚本负责把 `.css` 正文写进 `replace.html` 的 `<style>`（**保留那段 @font-face**，它是预览页用的）；
 *   ② `_pack_panel_script.mjs` 打完包会断言两者正文一致，不一致**直接报错退出**。
 *
 * 用法：node _sync_panel_css.mjs           （预演，只报告差异）
 *       node _sync_panel_css.mjs --apply   （写回 replace.html）
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const CSS = existsSync('_card_panel_v4.css') ? '_card_panel_v4.css' : 'tools/previews/_card_panel_v4.css';
const REPLACE = existsSync('_card_panel_v4.replace.html') ? '_card_panel_v4.replace.html' : 'tools/previews/_card_panel_v4.replace.html';
const APPLY = process.argv.includes('--apply');

for (const f of [CSS, REPLACE]) {
  if (!existsSync(f)) { console.error('缺文件：' + f); process.exit(2); }
}
const css = readFileSync(CSS, 'utf8').replace(/^\uFEFF/, '');
const html = readFileSync(REPLACE, 'utf8');
const i = html.indexOf('<style>');
const j = html.indexOf('</style>', i);
if (i < 0 || j < 0) { console.error('replace.html 里找不到 <style> 块'); process.exit(2); }

const inner = html.slice(i + 7, j);
const fontBlock = (inner.match(/@font-face\{[^}]*\}\s*/g) || []).join('\n');
const norm = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
const curCssOnly = inner.replace(/@font-face\{[^}]*\}\s*/g, '');

console.log('【面板 CSS 同步】');
console.log('  ' + CSS + '：' + css.length + ' 字');
console.log('  ' + REPLACE + ' <style>：' + inner.length + ' 字（其中 @font-face ' + fontBlock.length + ' 字）');
console.log('  正文本是否一致：' + (norm(curCssOnly) === norm(css) ? '✅ 已同步' : '❌ 不一致'));

if (norm(curCssOnly) === norm(css)) { console.log('\n无需改动。'); process.exit(0); }

const nextInner = (fontBlock ? fontBlock + '\n' : '') + css;
const next = html.slice(0, i + 7) + nextInner + html.slice(j);
if (!APPLY) {
  console.log('\n（预演）将把 replace.html 的 <style> 正文替换为 ' + CSS + ' 的内容（保留 @font-face）');
  console.log('加 --apply 才写盘');
  process.exit(0);
}
writeFileSync(REPLACE, next, 'utf8');
console.log('\n✅ 已同步：' + REPLACE + '（新长度 ' + next.length + ' 字）');
