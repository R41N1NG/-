#!/usr/bin/env node
/**
 * _chk_panel_artifact.mjs —— 面板产物终点断言（2026-09-28 第二十三轮：**按规范 C 卷重写**）
 *
 * 规范依据：
 *   §3.2【禁止】把大段 HTML/CSS 塞进 replaceString ⇒ 替换串应当**极小**、**不含** style／骨架／字体
 *   §C 卷：替换串 = 围栏 ＋ `<!DOCTYPE html>` ＋ 唯一一段 bootstrap；界面由卡内脚本 `XsdHUD.mount` 渲染
 *   §4【必须】双轨制：显示层与提示词剔除**共用同一条 findRegex**
 *   §4【必须】HUD 样式内联、零外部资源；根容器带 container-type
 *
 * 用法：node _chk_panel_artifact.mjs [卡.json]
 * 退出码：0 通过 / 2 不符
 */
import { readFileSync, existsSync } from 'node:fs';

const CARD = process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json';
const card = JSON.parse(readFileSync(CARD, 'utf8').replace(/^\uFEFF/, ''));
const scripts = card.data.extensions.regex_scripts || [];
const render = scripts.find((r) => r.scriptName.includes('状态栏渲染') || r.scriptName === '仙姝墮·状态栏');
const purge = scripts.find((r) => r.scriptName.includes('净化历史状态栏'));
if (!render) { console.error('找不到状态栏渲染正则'); process.exit(2); }
const rep = String(render.replaceString);
const cardScripts = (card.data.extensions?.tavern_helper?.scripts) || [];
const panelScript = cardScripts.find((s) => /状态栏面板/.test(String(s.name)));
const ps = panelScript ? String(panelScript.content) : '';

let cssText = '';
try {
  const m = /const XSD_CSS = '([A-Za-z0-9+/=]+)'/.exec(ps);
  if (m) cssText = Buffer.from(m[1], 'base64').toString('utf8');
} catch (e) { /* 留空 */ }

const checks = [
  /* ── 替换串：必须"瘦"（§3.2 禁止塞大段 HTML/CSS） ── */
  ['替换串 ≤ 2,500 字（规范：不塞大段 HTML/CSS）', rep.length <= 2500],
  ['替换串不含 <style>', !rep.includes('<style')],
  ['替换串不含面板骨架类名 .xh-body', !rep.includes('xh-body')],
  ['替换串不含 @font-face / 字体 base64', !rep.includes('@font-face') && !rep.includes('d09GMg')],
  ['替换串不含 data-xds 槽位', !rep.includes('data-xds=')],
  ['替换串不含 iframe 字样（由宿主机制完成）', !rep.includes('<iframe')],
  /* ── 替换串：必须是规范 C 卷那个壳 ── */
  ['替换串以 markdown 围栏开头', rep.trimStart().startsWith('```')],
  ['替换串含 <!DOCTYPE html>', rep.includes('<!DOCTYPE html>')],
  ['替换串含 #content 占位', rep.includes('id="content"')],
  ['替换串含静态骨架（loading 文案，失败也不白屏）', /class="loading"/.test(rep)],
  ['bootstrap 跨 realm 找 XsdHUD', rep.includes('XsdHUD') && rep.includes('window.parent')],
  ['bootstrap 调 mount(el, raw, msgId)', rep.includes('hud.mount')],
  /* ── 双轨制（§4 必须） ── */
  ['有环境提示词剔除条', !!purge],
  ['★ 双轨制：渲染条与剔除条 findRegex 逐字相同', !!purge && String(purge.findRegex) === String(render.findRegex)],
  ['剔除条 promptOnly=true', !!purge && purge.promptOnly === true],
  ['剔除条 minDepth=3（保留最近两楼）', !!purge && purge.minDepth === 3],
  ['渲染条 markdownOnly=true / promptOnly=false', render.markdownOnly === true && render.promptOnly === false],
  ['渲染条 placement=[2]', JSON.stringify(render.placement) === '[2]'],
  /* ── 流式隐藏 ── */
  ['有流式半截隐藏条（maxDepth=3）', scripts.some((r) => /流式半截/.test(r.scriptName) && r.maxDepth === 3)],
  /* ── 界面必须在卡内脚本里（§C 卷） ── */
  ['卡内有「状态栏面板」脚本', !!panelScript],
  ['该脚本体量 ≥ 100 KB（含 CSS ＋ 骨架 ＋ 字体）', ps.length >= 100000],
  ['脚本里有 XSD_CSS 常量', ps.includes('const XSD_CSS = ')],
  ['脚本里有骨架常量', ps.includes('const XSD_SKELETON = ')],
  ['脚本里有 ensureStyleInjected（规范 §C 卷）', ps.includes('ensureStyleInjected')],
  ['脚本里有 mount 纯入口（规范 §3.1）', ps.includes('mount:') || ps.includes('function mount')],
  ['脚本里有 getMessageData（反查原文）', ps.includes('getMessageData')],
  /* ── 样式约束（§4） ── */
  ['CSS 解出成功（>3 KB）', cssText.length > 3000],
  ['根容器带 container-type（容器查询就绪）', cssText.includes('container-type:inline-size')],
  ['根容器带 container-name', cssText.includes('container-name:xsd-hud')],
  ['样式含内联字体 data URI（零外链）', ps.includes('url(data:font/woff2;base64,')],
  ['样式表里无 http(s) 外链', !/url\(\s*['"]?https?:/.test(cssText)],
  /* ── 旧架构残留 ── */
  ['无旧版「场/我/人/局」分区', !rep.includes('xds-sec')],
  ['无旧版标题「局中录」', !rep.includes('局中录')],
];

let bad = 0;
console.log(`【面板产物终点断言】${CARD}\n  替换串 ${rep.length} 字（范例卡 7,467 字）｜面板脚本 ${ps.length} 字符｜CSS ${cssText.length} 字\n`);
for (const [k, v] of checks) { if (!v) bad += 1; console.log(`  ${v ? '✔' : '✘'} ${k}`); }
if (bad) { console.log(`\n❌ ${bad}/${checks.length} 项不符`); process.exit(2); }
console.log(`\n✅ 全部通过（${checks.length} 项）—— 架构＝范例卡同构，样式内联零外链`);
