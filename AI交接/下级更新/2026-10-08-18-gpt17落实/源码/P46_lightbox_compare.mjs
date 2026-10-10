/**
 * P46_lightbox_compare.mjs —— 出「灯箱清晰度」对比图：**卡内 720×1146** vs **本地 993×1583 原图**。
 * 用 DPR=2 模拟高分屏（这正是主人看到"糊"的场景）。只读，不改源码。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = 'E:/角色卡制作/仙姝堕';
const OUT = 'E:/角色卡制作/导出/预览图';
const GAL = 'E:/tavern/SillyTavern/data/default-user/user/images/xsd_gallery';
fs.mkdirSync(OUT, { recursive: true });

const card = JSON.parse(fs.readFileSync(path.join(ROOT, '最新角色卡/仙姝堕.json'), 'utf8'));
const lb = (card.data.extensions.xsd_assets || {}).lightbox || {};
const 人 = [['苏倾寒', 'suqinghan'], ['慕容清歌', 'murongqingge'], ['顾云舒', 'guyunshu']];

const 块 = (名, py) => {
  const embedded = lb[py] || lb[名] || '';
  const local = 'file:///' + path.join(GAL, py + '.png').replace(/\\/g, '/');
  const 一张 = (标题, src, 备注) => '<div class="col"><div class="t">' + 标题 + '</div>'
    + '<div class="frame"><img src="' + src + '" alt=""></div>'
    + '<div class="n">' + 备注 + '</div></div>';
  return '<section><h3>' + 名 + '</h3><div class="row">'
    + 一张('卡内嵌图（旧行为）', embedded, '720×1146 · 被放大到约 560 CSS px（DPR2 ⇒ 1120 物理像素）⇒ 糊')
    + 一张('本地原图（本次改为优先）', local, '993×1583 · 同一显示尺寸 ⇒ 清晰')
    + '</div></section>';
};

const HTML = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>灯箱清晰度对比</title><style>'
  + 'body{margin:0;background:#0b0a0e;color:#ddd;font:14px/1.6 system-ui,"Microsoft YaHei",sans-serif;padding:16px}'
  + 'h2{margin:0 0 4px;font-size:16px;color:#e8dfc8}.sub{color:#8f886f;font-size:12px;margin:0 0 14px}'
  + 'section{margin:0 0 18px}h3{margin:0 0 6px;font-size:14px;color:#cbbd93;font-weight:600}'
  + '.row{display:flex;gap:14px}.col{flex:0 0 auto}'
  + '.t{font-size:12px;color:#a89f86;margin-bottom:4px}'
  + '.frame{width:560px;border:1px solid #b8933f;border-radius:6px;overflow:hidden;background:#000;display:flex;justify-content:center}'
  + '.frame img{width:560px;display:block}'
  + '.n{font-size:11px;color:#7d7663;margin-top:4px;max-width:560px}'
  + '</style></head><body>'
  + '<h2>灯箱清晰度对比（同一显示尺寸，DPR＝2 模拟高分屏）</h2>'
  + '<p class="sub">左＝本次修复前的行为（卡内嵌 720 图抢先）；右＝修复后（本地 993 原图优先）</p>'
  + 人.map(([n, p]) => 块(n, p)).join('')
  + '</body></html>';

const htmlPath = path.join(OUT, '灯箱清晰度对比.html');
fs.writeFileSync(htmlPath, HTML, 'utf8');
const pngPath = path.join(OUT, '灯箱清晰度对比.png');
execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--allow-file-access-from-files',
  '--force-device-scale-factor=2', '--virtual-time-budget=3000', '--window-size=1180,2400',
  '--screenshot=' + pngPath, 'file:///' + htmlPath.replace(/\\/g, '/'),
], { stdio: 'inherit' });
console.log('  ✔ ' + pngPath + '（' + fs.statSync(pngPath).size + ' B）');
