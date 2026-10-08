#!/usr/bin/env node
/**
 * _pack_panel_script.mjs —— 把「面板 CSS ＋ 骨架 ＋ 内嵌字体」注入卡内脚本
 *
 * 为什么要在构建期做（照《制卡规范 v2.0》§3.2 / §C 卷）：
 *   · **禁止**把大段 HTML/CSS 塞进正则 `replaceString`（案例卡塞 7,467 字就被点名）
 *   · HUD 的 CSS 应当由卡内脚本 `ensureStyleInjected` **一次性注入消息 iframe**
 *   · 数据 URI 算内联 ⇒ 零外部资源，满足"无外链"，同时满足主人"别人下载也看得到楷体"
 *
 * 做法：读 `卡片脚本/_src/状态栏面板.模板.js`，把三个占位符替换成
 *   **用 base64 包住的字符串**（避免 CSS/HTML/字体里任何引号、反斜杠、`${}` 破坏源码）
 *   → 输出 `卡片脚本/状态栏面板.js`（真正进卡的那份；带"自动生成"抬头，别手改）
 *
 * 用法：node _pack_panel_script.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const TPL = '卡片脚本/_src/状态栏面板.模板.js';
const OUT = '卡片脚本/状态栏面板.js';
const SRC_REPLACE = existsSync('_card_panel_v4.replace.html') ? '_card_panel_v4.replace.html' : 'tools/previews/_card_panel_v4.replace.html';
const SRC_CSS = existsSync('_card_panel_v4.css') ? '_card_panel_v4.css' : 'tools/previews/_card_panel_v4.css';
const B64_FONT = '../_fonts/wenkai-subset.b64.txt';

for (const f of [TPL, SRC_REPLACE, B64_FONT]) {
  if (!existsSync(f)) { console.error('缺文件：' + f); process.exit(2); }
}

/* 从 v4 产物里切出 CSS 与骨架（v4 结构：<style>CSS</style> + 骨架 + 引导件） */
const v4 = readFileSync(SRC_REPLACE, 'utf8');
const styleOpen = v4.indexOf('<style>');
const styleClose = v4.indexOf('</style>');
if (styleOpen < 0 || styleClose < 0) { console.error('v4 产物里找不到 <style> 块'); process.exit(2); }
let css = v4.slice(styleOpen + 7, styleClose);
css = css.replace(/@font-face\{[^}]*\}\s*/g, '');            // 字体单独注入（同一份 base64 只出现一次）

/* ★★ 单一真源＝`_card_panel_v4.css`（2026-09-28 第三十六轮踩到的坑，务必读懂这一段）：
 *   上面那两行原本是**唯一**的 CSS 来源，而 banner 里却写着"要改样式 → 改 _card_panel_v4.css"
 *   ⇒ 我按 banner 改了 `.css`（对比度、噪点），**卡里一点没变**，还以为改好了；
 *      是"渲一张真图去量像素"才发现底色一模一样（replace.html 里还躺着旧 CSS）。
 *   ⇒ 现在：**有 `.css` 就用 `.css`**，并断言两者正文一致（去掉 @font-face 与空白后比较），
 *      不一致就**当场报错退出**，绝不静默用错的那份。 */
if (existsSync(SRC_CSS)) {
  const cssFile = readFileSync(SRC_CSS, 'utf8').replace(/^\uFEFF/, '');
  const norm = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
  if (norm(cssFile) !== norm(css)) {
    console.error('❌ CSS 不同步：`' + SRC_CSS + '` 与 `' + SRC_REPLACE + '` 的 <style> 正文不一致。');
    console.error('   ⇒ 先跑：node _sync_panel_css.mjs --apply（把 .css 同步进 replace.html）再打包。');
    console.error('   （这条断言就是上一版静默用错 CSS 的直接后果）');
    process.exit(2);
  }
  css = cssFile;
  console.log('CSS 来源：' + SRC_CSS + '（与 ' + SRC_REPLACE + ' 已同步 ✅）');
} else {
  console.log('⚠️ 没找到 ' + SRC_CSS + '，退回从 ' + SRC_REPLACE + ' 里切 CSS');
}
/* 规范 §4【必须】：根容器带容器查询（窄栏不塌）—— 对齐范例卡 `.daqian-hud-root` 的 J:40-41 */
if (!css.includes('container-type')) {
  css = css.replace(/(\.xh\{[^}]*?)(\})/, '$1container-type:inline-size;container-name:xsd-hud;$2');
}
const bodyStart = v4.indexOf('<div class="xh"');
if (bodyStart < 0) { console.error('v4 产物里找不到面板骨架'); process.exit(2); }
let skeleton = v4.slice(bodyStart);
skeleton = skeleton.slice(0, skeleton.indexOf('<pre hidden')).trim();   // 去掉原文副本与引导件

const font = readFileSync(B64_FONT, 'utf8').replace(/\s+/g, '');

/* 用 base64 承载纯文本 ⇒ 源码里只有 [A-Za-z0-9+/=]，绝无引号/反斜杠/模板字面量风险 */
const asB64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const tpl = readFileSync(TPL, 'utf8');
const need = ['/*__XSD_CSS_B64__*/', '/*__XSD_SKEL_B64__*/', '/*__XSD_FONT_B64__*/'];
for (const n of need) if (!tpl.includes(n)) { console.error('模板里缺占位符：' + n); process.exit(2); }

const out = tpl
  .replace('/*__XSD_CSS_B64__*/', "'" + asB64(css) + "'")
  .replace('/*__XSD_SKEL_B64__*/', "'" + asB64(skeleton) + "'")
  .replace('/*__XSD_FONT_B64__*/', "'" + font + "'");

const banner = `/* ⚠️ 本文件由 _pack_panel_script.mjs 自动生成，**不要直接手改**。
 *    要改逻辑 → 改 卡片脚本/_src/状态栏面板.模板.js
 *    要改样式 → 改 _card_panel_v4.css / _card_panel_v4.skeleton.html（或 _preview_H.html 后重跑拆解）
 *    生成时间：${new Date().toLocaleString('zh-CN')}
 *    架构照《制卡规范 v2.0》§C 卷：正则只出迷你壳 → 本脚本 getMessageData → mount(el, raw, msgId) */
`;
writeFileSync(OUT, banner + out, 'utf8');
console.log(JSON.stringify({
  模板: TPL,
  输出: OUT,
  CSS字符: css.length,
  骨架字符: skeleton.length,
  字体base64: font.length,
  脚本字节: Buffer.byteLength(banner + out),
}, null, 2));
