const fs = require('fs');

const localPath = '预览_状态栏样式.html';
const artPath = 'C:/Users/11944/.gemini/antigravity/brain/1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f/status_bar_preview.html';

let content = fs.readFileSync(localPath, 'utf8');

// 1. 注入方案 A 所需的高精矢量微材质与样式
const schemeACss = `
    /* ============================================================
       方案 A：原生矢量微材质与西幻金石精雕层（零外部依赖）
       ============================================================ */
    
    /* 1. 羊皮纸/古籍微纤维噪点底纹层（注入真实物性颗粒，消除纯CSS塑料感） */
    .okh-hud-frame::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><filter id='okh-noise'><feTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23okh-noise)' opacity='0.055'/></svg>");
      pointer-events: none;
      border-radius: 6px;
      mix-blend-mode: overlay;
      z-index: 1;
    }

    /* 2. 中世纪哥特蔓草金属卷叶封角（Filigree Corner） */
    .okh-filigree-corner {
      position: absolute;
      width: 32px;
      height: 32px;
      pointer-events: none;
      z-index: 3;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.85));
    }
    .okh-corner-tl { top: 4px; left: 4px; }
    .okh-corner-tr { top: 4px; right: 4px; transform: scaleX(-1); }
    .okh-corner-bl { bottom: 4px; left: 4px; transform: scaleY(-1); }
    .okh-corner-br { bottom: 4px; right: 4px; transform: scale(-1); }

    /* 3. 天冠中世纪卷轴纹章与蔓草纹饰 */
    .okh-crest-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: -4px;
      margin-bottom: 12px;
      position: relative;
      z-index: 2;
    }
    .okh-crest-svg {
      width: 220px;
      height: 24px;
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.8));
    }

    /* 4. 黄铜日晷与星盘罗盘时计 */
    .okh-dial-astrolabe {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.7));
    }

    /* 5. 真实的物理级熔蜡火漆封印（物理凹凸压痕与高光受光折射） */
    .okh-wax-seal-svg {
      width: 38px;
      height: 38px;
      flex-shrink: 0;
      filter: drop-shadow(0 3px 8px rgba(0,0,0,0.75)) drop-shadow(0 1px 2px rgba(0,0,0,0.9));
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
    }
    .okh-wax-seal-svg:hover {
      transform: scale(1.06) rotate(-2deg);
    }

    /* 6. 待决事件公文手札质感强化（边缘微焦边与羊皮纸微颗粒） */
    .okh-event-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.045'/></svg>");
      pointer-events: none;
      border-radius: 4px;
      mix-blend-mode: overlay;
    }
    .okh-event-card {
      position: relative;
    }
`;

// 替换原有旧的 .okh-corner 样式
const oldCornerStart = content.indexOf('.okh-corner {');
const oldCornerEnd = content.indexOf('/* ============================================================', oldCornerStart);

if (oldCornerStart !== -1 && oldCornerEnd !== -1) {
  content = content.substring(0, oldCornerStart) + schemeACss + content.substring(oldCornerEnd);
  console.log('Replaced corner CSS with Scheme A CSS.');
}

// 2. 准备精美 SVG 矢量：哥特金属卷草封角
const svgCorner = `<svg class="okh-filigree-corner" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 外围金属铆钉与回纹护角 -->
      <path d="M2 2 L22 2 C16 4 12 8 10 14 C8 20 4 24 2 26 Z" fill="url(#goldGrad)" opacity="0.9" />
      <path d="M3 3 L20 3 C15 4.8 11.5 8.2 9.5 13.5 C7.5 19 4.2 22.8 3 24.5 Z" fill="#1b1511" />
      <!-- 哥特蔓草涡卷花纹 -->
      <path d="M4 4 C8 4 12 6 14 10 C15.5 13 14 16 11 16 C8.5 16 7.5 14 8.5 12 C9.2 10.5 11 10 11.5 10.5 C10.5 11.5 9 12 9 13.5" stroke="url(#goldGradBright)" stroke-width="1.2" stroke-linecap="round" fill="none" />
      <path d="M4 14 C5.5 14 8 17 8 20 C8 21.5 7 23 5 23" stroke="url(#goldGradBright)" stroke-width="1" stroke-linecap="round" fill="none" />
      <path d="M14 4 C14 5.5 17 8 20 8 C21.5 8 23 7 23 5" stroke="url(#goldGradBright)" stroke-width="1" stroke-linecap="round" fill="none" />
      <!-- 黄金防脱铆钉圆珠 -->
      <circle cx="5.5" cy="5.5" r="1.8" fill="url(#rivetGrad)" stroke="#221811" stroke-width="0.5" />
      <circle cx="21" cy="4" r="1.2" fill="url(#rivetGrad)" />
      <circle cx="4" cy="21" r="1.2" fill="url(#rivetGrad)" />
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#f5e1a4"/>
          <stop offset="40%" stop-color="#b88d48"/>
          <stop offset="100%" stop-color="#5a4220"/>
        </linearGradient>
        <linearGradient id="goldGradBright" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fff2c8"/>
          <stop offset="60%" stop-color="#d4aa5d"/>
          <stop offset="100%" stop-color="#8c6527"/>
        </linearGradient>
        <radialGradient id="rivetGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="40%" stop-color="#f5d580"/>
          <stop offset="100%" stop-color="#694b1a"/>
        </radialGradient>
      </defs>
    </svg>`;

// 3. 准备精美 SVG 矢量：天冠卷轴纹饰
const svgCrest = `<svg class="okh-crest-svg" viewBox="0 0 260 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 左侧典雅蔓草卷轴线 -->
        <path d="M10 13 H75 M25 9 C35 9 45 13 55 13 M35 17 C45 17 55 13 65 13" stroke="url(#crestLineGradL)" stroke-width="1.2" stroke-linecap="round" />
        <circle cx="12" cy="13" r="2" fill="#d4aa5d" />
        <!-- 核心剑盾与星盘羽翼纹章 -->
        <g transform="translate(100, 1)">
          <path d="M30 2 L42 8 L42 16 C42 20 30 24 30 24 C30 24 18 20 18 16 L18 8 Z" fill="#201813" stroke="url(#goldGradBright)" stroke-width="1.5" />
          <path d="M30 4 L30 22 M22 10 L38 10" stroke="url(#goldGradBright)" stroke-width="1" />
          <polygon points="30,7 32,10 30,13 28,10" fill="#fce1a6" />
        </g>
        <text x="130" y="29" font-family="'Cinzel', serif, ui-sans-serif" font-size="7.5" font-weight="700" fill="url(#goldGradBright)" text-anchor="middle" letter-spacing="2.5">OAKHAVEN</text>
        <!-- 右侧典雅蔓草卷轴线 -->
        <path d="M185 13 H250 M195 13 C205 13 215 9 225 9 M205 13 C215 13 225 17 235 17" stroke="url(#crestLineGradR)" stroke-width="1.2" stroke-linecap="round" />
        <circle cx="248" cy="13" r="2" fill="#d4aa5d" />
        <defs>
          <linearGradient id="crestLineGradL" x1="0" y1="0" x2="80" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#b88d48" stop-opacity="0"/>
            <stop offset="60%" stop-color="#e8c278"/>
            <stop offset="100%" stop-color="#b88d48"/>
          </linearGradient>
          <linearGradient id="crestLineGradR" x1="180" y1="0" x2="260" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#b88d48"/>
            <stop offset="40%" stop-color="#e8c278"/>
            <stop offset="100%" stop-color="#b88d48" stop-opacity="0"/>
          </linearGradient>
        </defs>
      </svg>`;

// 4. 准备精美 SVG 矢量：黄铜日晷星盘罗盘
const svgAstrolabe = `<svg class="okh-dial-astrolabe" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 外圈黄铜刻度环 -->
        <circle cx="12" cy="12" r="10.5" stroke="url(#goldGradBright)" stroke-width="1.2" fill="#1c1612" />
        <circle cx="12" cy="12" r="8.5" stroke="#755627" stroke-width="0.6" stroke-dasharray="1.5 1.5" />
        <!-- 星盘指针与天球仪经纬度 -->
        <path d="M12 3 L12 21 M3 12 L21 12" stroke="#a6803e" stroke-width="0.8" opacity="0.75" />
        <polygon points="12,4 13.5,12 12,14 10.5,12" fill="url(#goldGradBright)" />
        <polygon points="12,20 13,12 12,11 11,12" fill="#755627" />
        <circle cx="12" cy="12" r="2.2" fill="#ffe094" stroke="#3d2c13" stroke-width="0.8" />
      </svg>`;

// 5. 准备精美 SVG 矢量：物理流蜡火漆封印（带真实凹凸冲压印模）
const svgWaxSeal = `<svg class="okh-wax-seal-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" title="冒险者公会待决敕令火漆封签">
        <defs>
          <radialGradient id="waxBase" cx="36%" cy="32%" r="65%">
            <stop offset="0%" stop-color="#d63d31"/>
            <stop offset="45%" stop-color="#961f18"/>
            <stop offset="85%" stop-color="#590e09"/>
            <stop offset="100%" stop-color="#360805"/>
          </radialGradient>
          <radialGradient id="waxInner" cx="38%" cy="36%" r="58%">
            <stop offset="0%" stop-color="#ab261d"/>
            <stop offset="70%" stop-color="#70120c"/>
            <stop offset="100%" stop-color="#4a0b07"/>
          </radialGradient>
          <filter id="waxShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.8"/>
          </filter>
        </defs>
        <!-- 自然流淌凝固的熔蜡外缘（非呆板正圆） -->
        <path d="M22 2 C28 1.5 35 4 39 9 C43 14 43.5 21 42 27 C40.5 33 37 39 31 42 C25 44.5 17 43.5 11 40 C5 36.5 1.5 29 2 22 C2.5 15 6 7 12 4 C16 1.8 19 2.2 22 2 Z" fill="url(#waxBase)" />
        <!-- 压痕受光高光轮廓 -->
        <path d="M12 5 C7 8 3.5 15 3 22 C2.5 28 6 35 11 38.5" stroke="#ff7c73" stroke-width="0.9" stroke-linecap="round" opacity="0.45" fill="none" />
        <!-- 铜模压下的沉降圆槽 -->
        <circle cx="22" cy="22" r="14.5" fill="url(#waxInner)" stroke="#3d0704" stroke-width="1.2" />
        <circle cx="22" cy="22" r="13" stroke="#e05348" stroke-width="0.6" stroke-dasharray="1.5 1.2" opacity="0.4" fill="none" />
        <!-- 印章中心剑盾与「待决」阴刻压印 -->
        <path d="M22 11 L28 15 L28 22 C28 26 22 29 22 29 C22 29 16 26 16 22 L16 15 Z" fill="#4d0905" stroke="#2a0402" stroke-width="0.8" />
        <text x="22" y="24" font-family="'Noto Serif SC', serif, ui-sans-serif" font-size="9" font-weight="900" fill="#fce5dd" text-anchor="middle" letter-spacing="1" style="text-shadow: 0 -1px 1px #220402, 0 1px 2px rgba(255,255,255,0.35);">待决</text>
      </svg>`;

// 替换 HTML 中的旧四角方块
const oldFrameStart = content.indexOf('<div class="okh-hud-frame">');
const oldCornersStart = content.indexOf('<!-- 四角古典包角 -->', oldFrameStart);
const oldCornersEnd = content.indexOf('<!-- 顶部天冠卷轴纹饰 -->', oldCornersStart);

if (oldCornersStart !== -1 && oldCornersEnd !== -1) {
  const newCornersHtml = `<!-- 四角古典哥特金属卷草纹封角（SVG 矢量精雕） -->
    <div class="okh-corner-tl">${svgCorner}</div>
    <div class="okh-corner-tr">${svgCorner}</div>
    <div class="okh-corner-bl">${svgCorner}</div>
    <div class="okh-corner-br">${svgCorner}</div>

    `;
  content = content.substring(0, oldCornersStart) + newCornersHtml + content.substring(oldCornersEnd);
  console.log('Replaced corners with SVG filigree.');
}

// 替换天冠卷轴
const oldCrestStart = content.indexOf('<div class="okh-crest-header">');
const oldCrestEnd = content.indexOf('<!-- 一、顶层常驻条', oldCrestStart);

if (oldCrestStart !== -1 && oldCrestEnd !== -1) {
  const newCrestHtml = `<div class="okh-crest-header">
      ${svgCrest}
    </div>

    `;
  content = content.substring(0, oldCrestStart) + newCrestHtml + content.substring(oldCrestEnd);
  console.log('Replaced crest with SVG crest.');
}

// 替换顶栏日晷时计图标
const oldDialIcon = '<span class="okh-dial-icon">☀️</span>';
if (content.includes(oldDialIcon)) {
  content = content.replace(oldDialIcon, svgAstrolabe);
  console.log('Replaced dial icon with SVG astrolabe.');
}

// 替换待决事件右侧的火漆印章
const oldWaxSealStart = content.indexOf('<div class="okh-wax-seal"');
if (oldWaxSealStart !== -1) {
  const oldWaxSealEnd = content.indexOf('</div>', oldWaxSealStart) + 6;
  content = content.substring(0, oldWaxSealStart) + svgWaxSeal + content.substring(oldWaxSealEnd);
  console.log('Replaced wax seal with SVG physical wax seal.');
}

fs.writeFileSync(localPath, content, 'utf8');
fs.writeFileSync(artPath, content, 'utf8');
console.log('Scheme A successfully implemented into both files.');
