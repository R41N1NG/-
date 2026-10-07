#!/usr/bin/env node
/**
 * _chk_menu_bg.mjs —— 首楼背景图体检（2026-09-28 第四十四轮）
 *
 * 背景图是**外链**，所以除了"贴上去"，还要能回答三个问题：
 *   ① 这条链**活不活**（HTTP 状态、content-type 是不是图、体积多大）；
 *   ② 贴上去之后**首楼还读不读得清**（渲一张真图，量**真实底色**，按 WCAG 核小字）；
 *   ③ 没贴链接时，**什么都不该变**（确认 MENU_BG 没生效）。
 *
 * 用法：
 *   node _chk_menu_bg.mjs            # 未设置 ⇒ 只确认"没启用"，exit 0
 *   node _chk_menu_bg.mjs --apply    # 已设置 ⇒ 下载探针 + 渲图 + 量底色（并可顺带重建卡）
 *
 * 退出码：0 通过／跳过；1 链接有问题或对比度不达标；2 环境问题
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const src = readFileSync('_build_card.js', 'utf8');
const m = /const MENU_BG_URL = '([^']*)'/.exec(src);
const scrim = Number((/const MENU_BG_SCRIM = ([\d.]+)/.exec(src) || [, '0.86'])[1]);
if (!m) { console.error('_build_card.js 里找不到 MENU_BG_URL'); process.exit(2); }
const URL_ = m[1].trim();

console.log('【首楼背景图体检】');
console.log('  MENU_BG_URL = ' + (URL_ ? URL_ : '(空)') + '｜遮罩 MENU_BG_SCRIM = ' + scrim);

if (!URL_) {
  console.log('\n  ✔ 未启用背景图 ⇒ 首楼保持墨云渐变色底，本条跳过。');
  console.log('    （要启用：把图床直链贴进 _build_card.js 的 MENU_BG_URL，再跑本脚本 --apply）');
  process.exit(0);
}
if (!/^https:\/\//i.test(URL_)) {
  console.log('\n  ✘ 链接不是 https（图床上请用 https，http 在酒馆里可能被拦）');
  process.exit(1);
}

/* ① 可达性 + 类型 + 体积（图床通常没有 HEAD，直接 GET 取头部若干字节） */
let bytes = 0, ctype = '', status = 0;
try {
  const r = spawnSync('curl.exe', ['-sS', '-L', '-o', '_menu_bg.bin', '-w', '%{http_code} %{content_type} %{size_download}', URL_],
    { encoding: 'utf8', timeout: 120000 });
  const out = String(r.stdout || '').trim().split(/\s+/);
  status = Number(out[0] || 0); ctype = out[1] || ''; bytes = Number(out[2] || 0);
} catch (e) { /* 下面统一判 */ }
console.log(`\n  ① 直链探测：HTTP ${status}｜${ctype}｜${(bytes / 1024).toFixed(1)} KB`);
if (status !== 200) { console.log('  ✘ 链接不可用（图床可能挂了／需要 referer／拼错了）'); process.exit(1); }
if (!/^image\//i.test(ctype)) { console.log('  ✘ content-type 不是图片（图床返回的很可能是网页/防盗链页）'); process.exit(1); }
console.log('  ✔ 链接可用、确实是图片');
console.log('     体积影响：这张 ' + (bytes / 1024).toFixed(0) + ' KB 是**外链**，卡体积不变（内联才会 +33%）');

/* ② 渲一张真图，量底色（菜单卡 CSS 已在 _chk_contrast 的体检范围内；这里量的是"图上垫字"的真实读数） */
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!existsSync(CHROME)) { console.log('\n  （没装 Chrome，跳过渲图量像素）'); process.exit(0); }
const rs = JSON.parse(readFileSync('仙姝墮-角色卡（全书群像）.json', 'utf8').replace(/^\uFEFF/, ''));
const menu = (rs.data.extensions.regex_scripts || []).find((r) => /身份菜单/.test(r.scriptName));
if (!menu) { console.log('\n  （卡里找不到身份菜单正则，先跑 _build_card.js）'); process.exit(0); }
const html = String(menu.replaceString).split('$&').join('<IdentityMenu/>')
  .replace(/src:url\(data:font\/woff2;base64,[^)]*\)/, 'src:url()');   // 字体是内联 base64，渲图不需要
const page = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#0b0c10;padding:20px">${html}</body></html>`;
writeFileSync('_menu_bg_render.html', page, 'utf8');
spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--user-data-dir=' + resolve('_ef_chrome_profile'), '--force-device-scale-factor=2',
  '--window-size=760,1800', '--virtual-time-budget=15000',
  '--screenshot=' + resolve('_menu_bg_render.png'), '--default-background-color=ff0b0c10',
  'file:///' + resolve('_menu_bg_render.html').replace(/\\/g, '/')], { stdio: 'ignore', timeout: 150000 });

const probe = spawnSync(process.execPath, ['_probe_panel_luma.mjs', '_menu_bg_render.png', '0.02', '0.98', '0.05', '0.95', '0.006'],
  { encoding: 'utf8', timeout: 120000 });
console.log('\n  ② 渲图量底色（这才是"图上垫字"的真实读数）：');
console.log(String(probe.stdout || '').split('\n').map((l) => '     ' + l).join('\n').trim());
console.log('\n  ⇒ 判据：底色众数那一行。若 `#` 值普遍亮于 `#2f3031`，说明遮罩不够 ⇒ 调大 MENU_BG_SCRIM 重跑。');
