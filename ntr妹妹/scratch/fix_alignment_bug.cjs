const fs = require('fs');

const localPath = '预览_状态栏样式.html';
const artPath = 'C:/Users/11944/.gemini/antigravity/brain/1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f/status_bar_preview.html';

let content = fs.readFileSync(localPath, 'utf8');

// 1. 修复封角 CSS：使角标父级为严格的 28x28 absolute 容器，并且各自精确定位
const oldCornerCssStart = content.indexOf('.okh-filigree-corner {');
const oldCornerCssEnd = content.indexOf('/* 3. 天冠中世纪卷轴纹章', oldCornerCssStart);

const fixedCornerCss = `.okh-corner-box {
      position: absolute;
      width: 28px;
      height: 28px;
      pointer-events: none;
      z-index: 4;
    }
    .okh-corner-tl { top: 3px; left: 3px; }
    .okh-corner-tr { top: 3px; right: 3px; transform: scaleX(-1); }
    .okh-corner-bl { bottom: 3px; left: 3px; transform: scaleY(-1); }
    .okh-corner-br { bottom: 3px; right: 3px; transform: scale(-1); }

    .okh-filigree-corner {
      width: 100%;
      height: 100%;
      display: block;
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.9));
    }
    `;

if (oldCornerCssStart !== -1 && oldCornerCssEnd !== -1) {
  content = content.substring(0, oldCornerCssStart) + fixedCornerCss + content.substring(oldCornerCssEnd);
  console.log('Fixed corner CSS.');
}

// 2. 修复天冠 SVG 的高度与文字 y 坐标越界问题
const oldCrestSvg = `<svg class="okh-crest-svg" viewBox="0 0 260 26" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const fixedCrestSvg = `<svg class="okh-crest-svg" viewBox="0 0 280 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 左侧典雅蔓草卷轴线 -->
        <path d="M15 16 H80 M30 11 C40 11 50 16 60 16 M40 21 C50 21 60 16 70 16" stroke="url(#crestLineGradL)" stroke-width="1.2" stroke-linecap="round" />
        <circle cx="16" cy="16" r="2" fill="#d4aa5d" />
        <!-- 核心剑盾与星盘羽翼纹章 -->
        <g transform="translate(110, 2)">
          <path d="M30 2 L42 8 L42 16 C42 20 30 24 30 24 C30 24 18 20 18 16 L18 8 Z" fill="#201813" stroke="url(#goldGradBright)" stroke-width="1.5" />
          <path d="M30 4 L30 22 M22 10 L38 10" stroke="url(#goldGradBright)" stroke-width="1" />
          <polygon points="30,7 32,10 30,13 28,10" fill="#fce1a6" />
        </g>
        <text x="140" y="30" font-family="'Cinzel', serif, ui-sans-serif" font-size="7.5" font-weight="700" fill="url(#goldGradBright)" text-anchor="middle" letter-spacing="2.5">OAKHAVEN</text>
        <!-- 右侧典雅蔓草卷轴线 -->
        <path d="M200 16 H265 M210 16 C220 16 230 11 240 11 M220 16 C230 16 240 21 250 21" stroke="url(#crestLineGradR)" stroke-width="1.2" stroke-linecap="round" />
        <circle cx="264" cy="16" r="2" fill="#d4aa5d" />
        <defs>
          <linearGradient id="crestLineGradL" x1="0" y1="0" x2="80" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#b88d48" stop-opacity="0"/>
            <stop offset="60%" stop-color="#e8c278"/>
            <stop offset="100%" stop-color="#b88d48"/>
          </linearGradient>
          <linearGradient id="crestLineGradR" x1="200" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#b88d48"/>
            <stop offset="40%" stop-color="#e8c278"/>
            <stop offset="100%" stop-color="#b88d48" stop-opacity="0"/>
          </linearGradient>
        </defs>
      </svg>`;

if (content.includes(oldCrestSvg)) {
  content = content.replace(oldCrestSvg, fixedCrestSvg);
  console.log('Fixed crest SVG.');
}

// 3. 更新 HTML 中角标的 class 为 okh-corner-box
content = content.replace('<div class="okh-corner-tl">', '<div class="okh-corner-box okh-corner-tl">');
content = content.replace('<div class="okh-corner-tr">', '<div class="okh-corner-box okh-corner-tr">');
content = content.replace('<div class="okh-corner-bl">', '<div class="okh-corner-box okh-corner-bl">');
content = content.replace('<div class="okh-corner-br">', '<div class="okh-corner-box okh-corner-br">');

fs.writeFileSync(localPath, content, 'utf8');
fs.writeFileSync(artPath, content, 'utf8');
console.log('Corner alignment and crest bug fixed.');
