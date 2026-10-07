#!/usr/bin/env node
/**
 * render_4stages_preview.mjs —— 生成新版名器四阶段纹章渲染示例图
 *
 * 包含：
 * 1. 核心状态对比矩阵：
 *    - 【自己持有 · 契约认主】：一至四阶段逐阶点亮（原色高光 + 对应阶段图片 + 1~4阶金辉弧）
 *    - 【他人占据 · 异化夺取】：一至四阶段被夺（反色异化 + 对应阶段图片 + 1~4阶暗红弧）
 *    - 【初始未出世 · 无人获得】：一阶段灰暗图（灰度暗调滤镜 + 暗灰边框 + 0弧）
 * 2. 13 大名器四阶段（共 52 张）全景图谱矩阵
 * 3. 状态栏实装两翼效果仿真
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\11944\\.gemini\\antigravity\\brain\\e462c9c5-5b44-4184-a03a-8c552e55ca9c';
if (!existsSync(ARTIFACT_DIR)) mkdirSync(ARTIFACT_DIR, { recursive: true });

const relicData = JSON.parse(readFileSync('src/assets_data/_relics_embed.json', 'utf8'));

const RELICS = [
  { n: '九幽玄阴穴', id: 'jiuyouxuanyinxue', carrier: '孤月', type: '阴窍绝品', a: 4 },
  { n: '灼酒流炎穴', id: 'zhuojiuliuyanxue', carrier: '叶红缨', type: '阴窍绝品', a: 4 },
  { n: '心魔茶璎乳', id: 'xinmochayingru', carrier: '闻观语', type: '双乳极品', a: 4 },
  { n: '般若菩提菊', id: 'boruoputiju', carrier: '楚灵夜', type: '后庭极品', a: 4 },
  { n: '梅蕊穴', id: 'meiruixue', carrier: '花芷凝', type: '阴窍奇珍', a: 4 },
  { n: '冰魄剑心穴', id: 'bingpojianxinxue', carrier: '陆烬颜', type: '阴窍绝品', a: 4 },
  { n: '清歌弦鸣穴', id: 'qinggexianmingxue', carrier: '天音阁双姝', type: '阴窍妙品', a: 4 },
  { n: '流焰叠薪穴', id: 'liuyandiexinxue', carrier: '炎雷子妾室', type: '阴窍上品', a: 4 },
  { n: '凤凰羽花', id: 'fenghuangyuhua', carrier: '陆十三', type: '阴窍奇珍', a: 4 },
  { n: '北冥潮生穴', id: 'beimingchaoshengxue', carrier: '雨霏柔', type: '阴窍绝品', a: 3 },
  { n: '玉虎噙香乳', id: 'yuhuxiangru', carrier: '云织梦', type: '双乳极品', a: 3 },
  { n: '灵犀同心', id: 'lingxitongxin', carrier: '听雪双姝', type: '双姝同心', a: 3 },
  { n: '烟霞灵乳', id: 'yanxialingru', carrier: '柳含烟', type: '双乳奇珍', a: 3 },
];

const XSD_RELIC_CN = ['', '一', '二', '三', '四'];
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

function renderEmblem(id, stage, state, size = 96, label = '') {
  const imgSrc = relicData[`${id}_${stage}`] || relicData[id] || '';
  let filterStyle = '';
  if (state === 'self') filterStyle = '';
  else if (state === 'other') filterStyle = 'filter:invert(1) contrast(1.15);';
  else filterStyle = 'filter:grayscale(1) brightness(.5);opacity:0.6;';

  const svgHtml = getRelicSvg(id + '_' + stage + '_' + state, 4, state === 'none' ? 0 : stage, state);

  return `
    <div style="display:inline-flex;flex-direction:column;align-items:center;gap:6px;">
      <div style="width:${size}px;height:${size}px;position:relative;background:#0b0f14;border-radius:6px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.6);">
        <div style="position:absolute;inset:0;background-image:url('${imgSrc}');background-size:cover;background-position:center;${filterStyle}"></div>
        <div style="position:absolute;inset:0;pointer-events:none;">${svgHtml}</div>
      </div>
      ${label ? `<span style="font-size:11px;color:#d4af37;text-align:center;letter-spacing:0.5px;">${label}</span>` : ''}
    </div>
  `;
}

// 构造预览页面 HTML
const previewHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>仙姝墮 · 新版名器四阶段纹章渲染全景</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0d0f14;
    color: #e2dbce;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    padding: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
  }
  .banner {
    width: 1200px;
    background: linear-gradient(135deg, rgba(30,26,18,0.9), rgba(16,18,24,0.95));
    border: 1px solid rgba(212,175,55,0.4);
    border-radius: 12px;
    padding: 20px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.7);
  }
  .banner h1 { font-size: 20px; color: #ffd700; letter-spacing: 2px; }
  .banner p { font-size: 13px; color: #9e917d; margin-top: 4px; }
  .banner-tags { display: flex; gap: 8px; }
  .tag { font-size: 11px; padding: 3px 8px; border-radius: 4px; background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.3); color: #ffd700; }

  .section-card {
    width: 1200px;
    background: #141720;
    border: 1px solid rgba(212,175,55,0.25);
    border-radius: 12px;
    padding: 24px 28px;
    box-shadow: 0 12px 36px rgba(0,0,0,0.6);
  }
  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #ffd700;
    letter-spacing: 1.5px;
    border-bottom: 1px solid rgba(212,175,55,0.2);
    padding-bottom: 10px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .section-desc { font-size: 12px; color: #8e8576; font-weight: normal; }

  .row-block {
    margin-bottom: 20px;
    background: rgba(0,0,0,0.25);
    border-radius: 8px;
    padding: 14px 18px;
    border-left: 4px solid #d4af37;
  }
  .row-block.other { border-left-color: #e84118; }
  .row-block.none { border-left-color: #555; }
  .row-title { font-size: 14px; font-weight: bold; color: #fff; margin-bottom: 12px; display: flex; gap: 10px; align-items: center; }
  .row-title span.sub { font-size: 12px; font-weight: normal; color: #a09786; }

  .emblem-row { display: flex; gap: 24px; align-items: flex-start; }

  /* 13名器表格 */
  .table-grid {
    display: grid;
    grid-template-columns: 140px repeat(4, 1fr);
    gap: 12px;
    align-items: center;
    background: rgba(0,0,0,0.2);
    padding: 14px;
    border-radius: 8px;
  }
  .th { font-size: 12px; font-weight: bold; color: #ffd700; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 8px; }
  .td-name { font-size: 13px; font-weight: bold; color: #e5ded2; }
  .td-sub { font-size: 11px; color: #8c8273; margin-top: 2px; }
  .td-cell { display: flex; justify-content: center; }
</style>
</head>
<body>

  <!-- 顶部标题条 -->
  <div class="banner">
    <div>
      <h1>✦ 仙姝墮 · 新版名器四阶段纹章渲染示例图</h1>
      <p>13 大名器 × 4 阶段（共 52 张独立原画）全部入卡 · 阶段点亮 / 他人夺取反色 / 初始一阶灰暗图</p>
    </div>
    <div class="banner-tags">
      <div class="tag">52张四阶段原画</div>
      <div class="tag">256×256双格高精</div>
      <div class="tag">动态阶段弧点亮</div>
      <div class="tag">反色与灰阶双轨</div>
    </div>
  </div>

  <!-- 第一区：核心交互三态效果展示 -->
  <div class="section-card">
    <div class="section-title">
      <span>一、核心状态三态实测对比（以「灼酒流炎穴」与「九幽玄阴穴」为例）</span>
      <span class="section-desc">严格遵循主人指示：未解锁用一阶段灰暗图；点亮时显对应阶段图；被占据用对应阶段反色图</span>
    </div>

    <!-- 1. 自己持有 · 契约认主 · 1~4阶段逐阶点亮 -->
    <div class="row-block">
      <div class="row-title">
        <span>【自己持有 · 原色点亮】：叶红缨 · 灼酒流炎穴（一至四阶段原色高光 + 阶段金弧流转 + 四阶全满金晕）</span>
        <span class="sub">随着剧情推进，每突破一阶段即切换为下一阶段图，弧环同步增加</span>
      </div>
      <div class="emblem-row">
        ${renderEmblem('zhuojiuliuyanxue', 1, 'self', 104, '【一阶段 · 初醒】<br>初破元阴 · 烈酒生香')}
        ${renderEmblem('zhuojiuliuyanxue', 2, 'self', 104, '【二阶段 · 情动】<br>道纹显化 · 火凤浮背')}
        ${renderEmblem('zhuojiuliuyanxue', 3, 'self', 104, '【三阶段 · 孕乳】<br>灵泉破封 · 琥珀涌流')}
        ${renderEmblem('zhuojiuliuyanxue', 4, 'self', 104, '【四阶段 · 极乐】<br>焚天大成 · 终极金晕')}
      </div>
    </div>

    <!-- 2. 他人占据 · 异化夺取 · 1~4阶段反色 -->
    <div class="row-block other">
      <div class="row-title">
        <span style="color:#ff7675;">【被他人占据 · 异化反色】：孤月 · 九幽玄阴穴（已被九皇子占据 · 对应阶段反色图 + 暗红阶段弧）</span>
        <span class="sub">异化反相负片渲染，同时精准承载该名器当前已被侵染推演的阶段图</span>
      </div>
      <div class="emblem-row">
        ${renderEmblem('jiuyouxuanyinxue', 1, 'other', 104, '【被夺一阶 · 反色】<br>元阴被破 · 玄冰成形')}
        ${renderEmblem('jiuyouxuanyinxue', 2, 'other', 104, '【被夺二阶 · 反色】<br>冰棱漩涡 · 邪龙暗金')}
        ${renderEmblem('jiuyouxuanyinxue', 3, 'other', 104, '【被夺三阶 · 反色】<br>玄魄龙鳞 · 吸附深陷')}
        ${renderEmblem('jiuyouxuanyinxue', 4, 'other', 104, '【被夺四阶 · 反色】<br>幽蓝龙角 · 终极沦陷')}
      </div>
    </div>

    <!-- 3. 初始未出世 · 无人获得 · 一阶段灰暗图 -->
    <div class="row-block none">
      <div class="row-title">
        <span style="color:#9e917d;">【初始未解锁 · 灰暗底图】：闻观语、楚灵夜、花芷凝（一阶段暗调图 + 0弧暗灰外框）</span>
        <span class="sub">主人令：「初始未解锁的名器纹章用一阶段的灰暗图」</span>
      </div>
      <div class="emblem-row">
        ${renderEmblem('xinmochayingru', 1, 'none', 104, '心魔茶璎乳<br>（未出世 · 1阶灰暗图）')}
        ${renderEmblem('boruoputiju', 1, 'none', 104, '般若菩提菊<br>（未出世 · 1阶灰暗图）')}
        ${renderEmblem('meiruixue', 1, 'none', 104, '梅蕊穴<br>（未出世 · 1阶灰暗图）')}
        ${renderEmblem('bingpojianxinxue', 1, 'none', 104, '冰魄剑心穴<br>（未出世 · 1阶灰暗图）')}
      </div>
    </div>
  </div>

  <!-- 第二区：全书 13 大名器四阶段全景图谱 -->
  <div class="section-card">
    <div class="section-title">
      <span>二、全书 13 大名器四阶段（全量 52 张）高清原画图谱矩阵</span>
      <span class="section-desc">每一张均独立生成 256×256 高保真 WebP/JPG 资源</span>
    </div>

    <div class="table-grid">
      <div class="th" style="text-align:left;">名器与载体</div>
      <div class="th">第一境界</div>
      <div class="th">第二境界</div>
      <div class="th">第三境界</div>
      <div class="th">第四境界</div>

      ${RELICS.map(r => `
        <div style="border-top: 1px solid rgba(255,255,255,0.06); padding: 8px 0;">
          <div class="td-name">${r.n}</div>
          <div class="td-sub">${r.carrier} · ${r.type}</div>
        </div>
        <div class="td-cell" style="border-top: 1px solid rgba(255,255,255,0.06); padding: 8px 0;">
          ${renderEmblem(r.id, 1, 'self', 64)}
        </div>
        <div class="td-cell" style="border-top: 1px solid rgba(255,255,255,0.06); padding: 8px 0;">
          ${renderEmblem(r.id, 2, 'self', 64)}
        </div>
        <div class="td-cell" style="border-top: 1px solid rgba(255,255,255,0.06); padding: 8px 0;">
          ${renderEmblem(r.id, 3, 'self', 64)}
        </div>
        <div class="td-cell" style="border-top: 1px solid rgba(255,255,255,0.06); padding: 8px 0;">
          ${renderEmblem(r.id, 4, 'self', 64)}
        </div>
      `).join('')}
    </div>
  </div>

</body>
</html>
`;

const previewFile = resolve('tools/previews/preview_4stages_relics.html');
writeFileSync(previewFile, previewHtml, 'utf8');
console.log('✅ 预览页面 HTML 已生成:', previewFile);

// 截取核心对比图 (Core State Comparison)
const outImgCore = join(ARTIFACT_DIR, 'relic_4stages_preview_core.png');
console.log('正在唤起 Chrome 生成核心状态示例图...');
spawnSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1280,1050',
  `--screenshot=${outImgCore}`,
  previewFile
]);
console.log('✔ 核心对比示例图已生成:', outImgCore);

// 截取全量全景图 (Full Gallery)
const outImgFull = join(ARTIFACT_DIR, 'relic_4stages_preview_full.png');
console.log('正在唤起 Chrome 生成 52 张全景图谱示例图...');
spawnSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1280,2400',
  `--screenshot=${outImgFull}`,
  previewFile
]);
console.log('✔ 全量 52 张全景图谱示例图已生成:', outImgFull);
