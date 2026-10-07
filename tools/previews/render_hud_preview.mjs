#!/usr/bin/env node
/**
 * render_hud_preview.mjs —— 生成真实跑团态势 HUD 两翼名器 4 阶段实装效果图
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\11944\\.gemini\\antigravity\\brain\\e462c9c5-5b44-4184-a03a-8c552e55ca9c';
const relicData = JSON.parse(readFileSync('src/assets_data/_relics_embed.json', 'utf8'));

const XSD_RG = '#d4af37', XSD_RGL = '#fff1b8', XSD_RGD = '#8c6d1f';
const XSD_RO = '#e84118', XSD_ROL = '#ff7675', XSD_ROD = '#8c1d10';

function getRelicSvg(id, N, stArcs, stState) {
  const R = 436;
  const isSelf = stState === 'self';
  const isOther = stState === 'other';
  const isActive = isSelf || isOther;

  const P = (ang, r) => [(500 + r * Math.cos(ang * Math.PI / 180)).toFixed(1), (500 + r * Math.sin(ang * Math.PI / 180)).toFixed(1)];
  const A = (a1, a2) => { const p1 = P(a1, R), p2 = P(a2, R); return 'M' + p1[0] + ' ' + p1[1] + ' A' + R + ' ' + R + ' 0 0 1 ' + p2[0] + ' ' + p2[1]; };
  const span = 360 / N, pad = 10, parts = [];
  const activeStroke = isSelf ? ('url(#ra' + id + ')') : (isOther ? ('url(#ro' + id + ')') : '#39404a');

  for (let k = 0; k < N; k++) {
    const s = -90 - span / 2 + span * (k + 0.5) + pad;
    const e = -90 - span / 2 + span * (k + 1.5) - pad;
    const mid = (s + e) / 2;
    if (!(isActive && k < stArcs)) {
      parts.push('<path d="' + A(s, e) + '" fill="none" stroke="' + (isActive ? activeStroke : '#39404a') + '" stroke-width="11" opacity="' + (isActive ? 0.12 : 0.12) + '"/>');
      continue;
    }
    const gap = N === 4 ? [0, 34, 20, 10, 0][stArcs] : [0, 30, 18, 0][stArcs];
    if (gap > 0) {
      parts.push('<path d="' + A(s, mid - gap / 2) + '" fill="none" stroke="' + activeStroke + '" stroke-width="16" stroke-linecap="round" filter="url(#rg' + id + ')"/>');
      parts.push('<path d="' + A(mid + gap / 2, e) + '" fill="none" stroke="' + activeStroke + '" stroke-width="16" stroke-linecap="round" filter="url(#rg' + id + ')"/>');
    } else {
      parts.push('<path d="' + A(s, e) + '" fill="none" stroke="' + activeStroke + '" stroke-width="16" stroke-linecap="round" filter="url(#rg' + id + ')"/>');
    }
    const len = N === 4 ? [0, 18, 26, 34, 44][stArcs] : [0, 16, 26, 38][stArcs];
    const b = P(mid, R + 6), t = P(mid, R + 6 + len), d1 = P(mid - 10, R + 6 + len * 0.5), d2 = P(mid + 10, R + 6 + len * 0.5);
    parts.push('<path d="M' + b[0] + ' ' + b[1] + ' L' + t[0] + ' ' + t[1] + '" stroke="' + activeStroke + '" stroke-width="14" stroke-linecap="round" filter="url(#rg' + id + ')"/>');
    parts.push('<path d="M' + b[0] + ' ' + b[1] + ' L' + d1[0] + ' ' + d1[1] + '" stroke="' + activeStroke + '" stroke-width="9" stroke-linecap="round" opacity="0.85"/>');
    parts.push('<path d="M' + b[0] + ' ' + b[1] + ' L' + d2[0] + ' ' + d2[1] + '" stroke="' + activeStroke + '" stroke-width="9" stroke-linecap="round" opacity="0.85"/>');
  }
  const bloom = isSelf && stArcs >= N, inner = isActive && stArcs >= 2;
  return '<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<defs>'
    + '<linearGradient id="ra' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + XSD_RGL + '"/><stop offset="50%" stop-color="' + XSD_RG + '"/><stop offset="100%" stop-color="' + XSD_RGD + '"/></linearGradient>'
    + '<linearGradient id="ro' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + XSD_ROL + '"/><stop offset="50%" stop-color="' + XSD_RO + '"/><stop offset="100%" stop-color="' + XSD_ROD + '"/></linearGradient>'
    + '<radialGradient id="rv' + id + '" cx="50%" cy="50%" r="62%"><stop offset="46%" stop-color="#0b0f14" stop-opacity="0"/><stop offset="84%" stop-color="#0b0f14" stop-opacity="0.62"/><stop offset="100%" stop-color="#0b0f14" stop-opacity="0.92"/></radialGradient>'
    + '<radialGradient id="rb' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff8dc" stop-opacity="' + (bloom ? 0.24 : 0) + '"/><stop offset="100%" stop-color="#d4af37" stop-opacity="0"/></radialGradient>'
    + '<filter id="rg' + id + '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    + '</defs>'
    + '<rect width="1000" height="1000" fill="url(#rv' + id + ')"/>'
    + (bloom ? '<circle cx="500" cy="500" r="420" fill="url(#rb' + id + ')"/>' : '')
    + '<circle cx="500" cy="500" r="436" fill="none" stroke="#0b0f14" stroke-width="17" opacity="0.62"/>'
    + (inner ? '<circle cx="500" cy="500" r="406" fill="none" stroke="' + activeStroke + '" stroke-width="5" opacity="' + (stArcs >= 3 ? 0.5 : 0.3) + '"/>' : '')
    + parts.join('')
    + '<rect x="16" y="16" width="968" height="968" rx="72" fill="none" stroke="' + (isSelf ? 'url(#ra' + id + ')' : (isOther ? 'url(#ro' + id + ')' : '#39404a')) + '" stroke-width="10" opacity="' + (isActive ? 1 : 0.55) + '"/>'
    + '<rect x="46" y="46" width="908" height="908" rx="54" fill="none" stroke="' + (isSelf ? XSD_RG : (isOther ? XSD_RO : '#6b7280')) + '" stroke-width="3" opacity="' + (isSelf ? 0.32 : (isOther ? 0.45 : 0.2)) + '"/>'
    + '</svg>';
}

function makeRelicBox(rel, stage, state, title) {
  const imgSrc = relicData[`${rel.id}_${stage}`] || relicData[rel.id] || '';
  let filterStyle = '';
  if (state === 'self') filterStyle = '';
  else if (state === 'other') filterStyle = 'filter:invert(1) contrast(1.15);';
  else filterStyle = 'filter:grayscale(1) brightness(.5);opacity:0.6;';

  const svgHtml = getRelicSvg(rel.id + '_hud', rel.a || 4, state === 'none' ? 0 : stage, state);

  return `
    <div class="xh-relic xh-relic-${state}" title="${title}">
      <div class="xh-relic-img" style="background-image:url('${imgSrc}');${filterStyle}"></div>
      <div style="position:absolute;inset:0;pointer-events:none;">${svgHtml}</div>
    </div>
  `;
}

// 模拟左翼 7 枚纹章
const leftRelics = [
  makeRelicBox({ id: 'zhuojiuliuyanxue', a: 4 }, 3, 'self', '灼酒流炎穴（第3阶段 · 契约认主）'),
  makeRelicBox({ id: 'jiuyouxuanyinxue', a: 4 }, 2, 'other', '九幽玄阴穴（第2阶段 · 被九皇子占据）'),
  makeRelicBox({ id: 'beimingchaoshengxue', a: 3 }, 1, 'self', '北冥潮生穴（第1阶段 · 契约认主）'),
  makeRelicBox({ id: 'lingxitongxin', a: 3 }, 1, 'other', '灵犀同心（第1阶段 · 被残阳老怪占据）'),
  makeRelicBox({ id: 'xinmochayingru', a: 4 }, 1, 'none', '心魔茶璎乳（未出世 · 1阶灰暗图）'),
  makeRelicBox({ id: 'boruoputiju', a: 4 }, 1, 'none', '般若菩提菊（未出世 · 1阶灰暗图）'),
  makeRelicBox({ id: 'meiruixue', a: 4 }, 1, 'none', '梅蕊穴（未出世 · 1阶灰暗图）'),
].join('\n');

// 模拟右翼 6 枚纹章
const rightRelics = [
  makeRelicBox({ id: 'fenghuangyuhua', a: 4 }, 4, 'self', '凤凰羽花（第4阶段 · 极乐大成）'),
  makeRelicBox({ id: 'bingpojianxinxue', a: 4 }, 2, 'self', '冰魄剑心穴（第2阶段 · 契约认主）'),
  makeRelicBox({ id: 'yanxialingru', a: 3 }, 2, 'self', '烟霞灵乳（第2阶段 · 契约认主）'),
  makeRelicBox({ id: 'qinggexianmingxue', a: 4 }, 1, 'none', '清歌弦鸣穴（未出世 · 1阶灰暗图）'),
  makeRelicBox({ id: 'liuyandiexinxue', a: 4 }, 1, 'none', '流焰叠薪穴（未出世 · 1阶灰暗图）'),
  makeRelicBox({ id: 'yuhuxiangru', a: 3 }, 1, 'none', '玉虎噙香乳（未出世 · 1阶灰暗图）'),
].join('\n');

const css = readFileSync('tools/previews/_card_panel_v4.css', 'utf8');

const hudHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
  ${css}
  body { background: #08090c; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .demo-header {
    width: 900px;
    margin-bottom: 24px;
    text-align: center;
    border-bottom: 1px solid rgba(212,175,55,0.2);
    padding-bottom: 14px;
  }
  .demo-header h2 { font-size: 18px; color: #ffd700; letter-spacing: 2px; }
  .demo-header p { font-size: 12px; color: #8e8576; margin-top: 4px; }
</style>
</head>
<body>

<div class="demo-header">
  <h2>✦ 仙姝墮 · 真实跑团态势 HUD 两翼四阶段纹章渲染</h2>
  <p>左右两翼 13 枚纹章：左侧 3 阶灼酒流炎穴（金）与 2 阶九幽玄阴穴（红）｜右侧 4 阶凤凰羽花（金晕）｜未出世一律一阶暗图</p>
</div>

<div class="xh-wrap">
  <!-- 左翼 -->
  <div class="xh-rail xh-rail-l">
    ${leftRelics}
  </div>

  <!-- 面板主体 -->
  <div class="xh" style="margin: 0; min-height: 520px;">
    <div class="xh-frame"></div>
    <div class="xh-body">
      <div class="xh-top">
        <div class="xh-id">
          <div class="xh-title">仙姝墮<span class="xh-sub">XIAN SHU DUO · 态势HUD</span></div>
          <div class="xh-rule"><svg viewBox="0 0 600 10" preserveAspectRatio="none"><path d="M0 6 H120 M480 6 H600" stroke="rgba(170,140,74,.6)" stroke-width="1"/><path d="M300 1.5 l5 4.5 -5 4.5 -5 -4.5 Z" fill="none" stroke="rgba(200,170,100,.9)" stroke-width="1"/></svg></div>
          <div><span class="xh-jade"><span class="seal"></span><span>墨山道六弟子 · 赵无忧</span></span></div>
          <div class="xh-quick">
            <div class="xh-q"><div class="k">修为</div><div class="v num">筑基后期大圆满</div></div>
            <div class="xh-q here"><div class="k">在场</div><div class="v">叶红缨、孤月、双姝</div></div>
            <div class="xh-q"><div class="k">地点</div><div class="v">幽寂谷 · 隐秘灵洞</div></div>
            <div class="xh-q"><div class="k">时间</div><div class="v">夜 · 朔月阴极之时</div></div>
          </div>
        </div>
      </div>

      <div class="xh-band goal"><span class="k">目标</span><span class="v">突破金丹桎梏，为大师姐叶红缨护法化解极乐引毒力</span></div>
      <div class="xh-band crisis"><span class="k">危机</span><span class="v">深渊老怪魔气外溢；南域神诅阴谋暗涌</span></div>
      <div class="xh-band rel"><span class="k">羁绊</span><span class="v">叶红缨（情根深种·灼酒流炎成形）｜孤月（冰心未泯）</span></div>

      <div class="xh-cast">
        <div class="hd">在场要角情况</div>
        <div class="xds-cc">
          <div class="xds-cc-body">
            <div class="xds-cc-h">叶红缨（赤羽焚天 · 大师姐）</div>
            <div class="xds-cc-r"><span class="xds-ck">神态</span><span class="xds-cv">满面酡红，美眸迷离，体表火凤道纹暗暗流转，灼酒流炎穴三阶初动。</span></div>
            <div class="xds-cc-r"><span class="xds-ck">情况</span><span class="xds-cv">体泛浓醇烈酒异香，花径滚烫如沸，正沉醉于元阴化解之后的充盈真元中。</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 右翼 -->
  <div class="xh-rail xh-rail-r">
    ${rightRelics}
  </div>
</div>

</body>
</html>
`;

const hudPreviewFile = resolve('tools/previews/preview_hud_4stages.html');
writeFileSync(hudPreviewFile, hudHtml, 'utf8');

const outImgHud = join(ARTIFACT_DIR, 'relic_4stages_preview_hud.png');
console.log('正在生成 HUD 两翼实装全景效果图...');
spawnSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1180,1050',
  `--screenshot=${outImgHud}`,
  hudPreviewFile
]);
console.log('✔ HUD 实装效果图已生成:', outImgHud);
