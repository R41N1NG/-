const fs = require('fs');
const path = require('path');

const uiDir = path.resolve('assets/ui');
if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });

// 1. 生成 frame_medieval_gold_9slice.svg (96x96, slice 28)
const frameGoldSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs>
    <!-- 金属高光渐变 -->
    <linearGradient id="goldH" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#faecc8"/>
      <stop offset="25%" stop-color="#dfb971"/>
      <stop offset="65%" stop-color="#9a7130"/>
      <stop offset="100%" stop-color="#543c16"/>
    </linearGradient>
    <linearGradient id="goldV" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#faecc8"/>
      <stop offset="25%" stop-color="#dfb971"/>
      <stop offset="65%" stop-color="#9a7130"/>
      <stop offset="100%" stop-color="#543c16"/>
    </linearGradient>
    <radialGradient id="cornerGold" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="20%" stop-color="#faecc8"/>
      <stop offset="55%" stop-color="#c99e4f"/>
      <stop offset="85%" stop-color="#734e1c"/>
      <stop offset="100%" stop-color="#3d280d"/>
    </radialGradient>
    <radialGradient id="rivet" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#f5d687"/>
      <stop offset="100%" stop-color="#4a310c"/>
    </radialGradient>
    <!-- 羊皮纸底心微滤镜 -->
    <filter id="centerNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="n"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.8  0 0 0 0 0.7  0 0 0 0 0.55  0 0 0 0.06 0"/>
    </filter>
  </defs>

  <!-- 中心羊皮底板 (28..68) -->
  <rect x="0" y="0" width="96" height="96" fill="#1b1612"/>
  <rect x="12" y="12" width="72" height="72" fill="#15110e" filter="url(#centerNoise)"/>

  <!-- 4条边缘金属导轨 (宽度 8px，带阴阳凹凸高光) -->
  <!-- 顶边 -->
  <rect x="28" y="2" width="40" height="2" fill="#faecc8" opacity="0.9"/>
  <rect x="28" y="4" width="40" height="4" fill="url(#goldH)"/>
  <rect x="28" y="8" width="40" height="2" fill="#30200b"/>
  <!-- 底边 -->
  <rect x="28" y="86" width="40" height="2" fill="#30200b"/>
  <rect x="28" y="88" width="40" height="4" fill="url(#goldH)"/>
  <rect x="28" y="92" width="40" height="2" fill="#faecc8" opacity="0.9"/>
  <!-- 左边 -->
  <rect x="2" y="28" width="2" height="40" fill="#faecc8" opacity="0.9"/>
  <rect x="4" y="28" width="4" height="40" fill="url(#goldV)"/>
  <rect x="8" y="28" width="2" height="40" fill="#30200b"/>
  <!-- 右边 -->
  <rect x="86" y="28" width="2" height="40" fill="#30200b"/>
  <rect x="88" y="28" width="4" height="40" fill="url(#goldV)"/>
  <rect x="92" y="28" width="2" height="40" fill="#faecc8" opacity="0.9"/>

  <!-- 4个中世纪哥特金属重装雕花角标 (各 28x28) -->
  <!-- 左上角 (0..28, 0..28) -->
  <g id="cornerAsset">
    <path d="M2 2 L26 2 C20 4 15 8 13 14 C11 20 6 24 2 26 Z" fill="url(#cornerGold)" stroke="#2a1b0b" stroke-width="0.8"/>
    <path d="M4 4 L22 4 C17 5.8 13.5 9 11.5 14 C9.5 19 6 22 4 23.5 Z" fill="#241a13"/>
    <!-- 蔓草叶脉 -->
    <path d="M5 5 C9 5 14 7 16 11 C17.5 14 16 17 13 17 C10 17 9 15 10 13 C10.8 11.5 12.5 11 13 11.5" stroke="#faecc8" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <!-- 铆钉 -->
    <circle cx="6.5" cy="6.5" r="2.2" fill="url(#rivet)" stroke="#1a1106" stroke-width="0.6"/>
    <circle cx="23" cy="5" r="1.4" fill="url(#rivet)"/>
    <circle cx="5" cy="23" r="1.4" fill="url(#rivet)"/>
  </g>

  <!-- 右上角 (68..96, 0..28) -->
  <use href="#cornerAsset" transform="translate(96, 0) scale(-1, 1)"/>
  <!-- 左下角 (0..28, 68..96) -->
  <use href="#cornerAsset" transform="translate(0, 96) scale(1, -1)"/>
  <!-- 右下角 (68..96, 68..96) -->
  <use href="#cornerAsset" transform="translate(96, 96) scale(-1, -1)"/>
</svg>`;

// 2. 生成 card_inlaid_slot_9slice.svg (48x48, slice 14)
const cardSlotSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="slotGoldH" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dfb971"/>
      <stop offset="50%" stop-color="#73501f"/>
      <stop offset="100%" stop-color="#1f160a"/>
    </linearGradient>
    <linearGradient id="slotGoldV" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#dfb971"/>
      <stop offset="50%" stop-color="#73501f"/>
      <stop offset="100%" stop-color="#1f160a"/>
    </linearGradient>
  </defs>

  <!-- 内凹手札底 (14..34) -->
  <rect x="0" y="0" width="48" height="48" fill="#17120e"/>
  <!-- 深度内阴影 -->
  <rect x="4" y="4" width="40" height="40" fill="#0f0c09" rx="3"/>

  <!-- 4边导轨金属槽 (微凹刻痕) -->
  <!-- 顶 -->
  <rect x="14" y="1" width="20" height="1.5" fill="#e8c98e" opacity="0.75"/>
  <rect x="14" y="2.5" width="20" height="2" fill="url(#slotGoldH)"/>
  <!-- 底 -->
  <rect x="14" y="43.5" width="20" height="2" fill="url(#slotGoldH)"/>
  <rect x="14" y="45.5" width="20" height="1.5" fill="#e8c98e" opacity="0.6"/>
  <!-- 左 -->
  <rect x="1" y="14" width="1.5" height="20" fill="#e8c98e" opacity="0.75"/>
  <rect x="2.5" y="14" width="2" height="20" fill="url(#slotGoldV)"/>
  <!-- 右 -->
  <rect x="43.5" y="14" width="2" height="20" fill="url(#slotGoldV)"/>
  <rect x="45.5" y="14" width="1.5" height="20" fill="#e8c98e" opacity="0.6"/>

  <!-- 4角青铜铸角 (各 14x14) -->
  <g id="slotCorner">
    <path d="M1 1 L13 1 C9 2 6 5 5 9 C4 11 2 12 1 13 Z" fill="#916a2d"/>
    <circle cx="3.8" cy="3.8" r="1.3" fill="#ffe2a1" stroke="#332109" stroke-width="0.5"/>
  </g>
  <use href="#slotCorner" transform="translate(48, 0) scale(-1, 1)"/>
  <use href="#slotCorner" transform="translate(0, 48) scale(1, -1)"/>
  <use href="#slotCorner" transform="translate(48, 48) scale(-1, -1)"/>
</svg>`;

// 3. 生成 parchment_dark_seamless.svg (256x256, 无缝贴图)
const parchmentSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <filter id="pNoise" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="4" stitchTiles="stitch" result="noise"/>
      <feDiffuseLighting in="noise" lighting-color="#eed8ae" surfaceScale="1.4" result="light">
        <feDistantLight azimuth="55" elevation="60"/>
      </feDiffuseLighting>
      <feBlend mode="multiply" in="SourceGraphic" in2="light"/>
    </filter>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#241b16" stop-opacity="0.8"/>
      <stop offset="60%" stop-color="#19130f" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#110d0a"/>
    </radialGradient>
  </defs>
  <rect width="256" height="256" fill="#1d1612"/>
  <rect width="256" height="256" fill="url(#vignette)" filter="url(#pNoise)"/>
</svg>`;

// 4. 生成 wax_seal_3d.svg (48x48, 真实3D物理流蜡封印)
const waxSealSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <radialGradient id="waxBase3D" cx="33%" cy="30%" r="68%">
      <stop offset="0%" stop-color="#e84a3c"/>
      <stop offset="35%" stop-color="#ab231a"/>
      <stop offset="75%" stop-color="#69100a"/>
      <stop offset="100%" stop-color="#3d0704"/>
    </radialGradient>
    <radialGradient id="waxInner3D" cx="36%" cy="34%" r="58%">
      <stop offset="0%" stop-color="#b8261c"/>
      <stop offset="70%" stop-color="#731109"/>
      <stop offset="100%" stop-color="#470703"/>
    </radialGradient>
    <filter id="sealGlow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.85"/>
      <feDropShadow dx="0" dy="1" stdDeviation="0.8" flood-color="#ff998f" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- 自然流淌凝固的熔蜡外缘 (带波浪高光与沉降) -->
  <g filter="url(#sealGlow)">
    <path d="M24 2.5 C31 2 38 4.5 42.5 10 C47 15.5 47.5 23 45.5 30 C43.5 37 39.5 43 33 46 C26.5 48.5 18 47.5 11.5 43.5 C5 39.5 1.5 31.5 2 24 C2.5 16 6.5 7.5 13 4 C17.5 1.5 20.5 2 24 2.5 Z" fill="url(#waxBase3D)"/>
    <!-- 熔蜡受光弧线 -->
    <path d="M13 5 C7 9 3.5 16.5 3 24 C2.5 31 6.5 38.5 12 42.5" stroke="#ffa399" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.55"/>
    <!-- 铜模压下的圆形沉降槽 -->
    <circle cx="24" cy="24" r="16" fill="url(#waxInner3D)" stroke="#380502" stroke-width="1.4"/>
    <circle cx="24" cy="24" r="14.2" stroke="#e65a4e" stroke-width="0.8" stroke-dasharray="2 1.5" fill="none" opacity="0.5"/>
    
    <!-- 核心压痕纹章：剑盾与“待决” -->
    <path d="M24 12 L30.5 16.5 L30.5 24 C30.5 28.5 24 32 24 32 C24 32 17.5 28.5 17.5 24 L17.5 16.5 Z" fill="#470703" stroke="#260301" stroke-width="1"/>
    <text x="24" y="26.5" font-family="'Noto Serif SC', serif" font-size="9.5" font-weight="900" fill="#fce5dd" text-anchor="middle" letter-spacing="1" style="text-shadow: 0 -1px 1px #200301, 0 1px 2px rgba(255,255,255,0.45);">待决</text>
  </g>
</svg>`;

// 保存到 assets/ui/ 目录
fs.writeFileSync(path.join(uiDir, 'frame_medieval_gold_9slice.svg'), frameGoldSvg, 'utf8');
fs.writeFileSync(path.join(uiDir, 'card_inlaid_slot_9slice.svg'), cardSlotSvg, 'utf8');
fs.writeFileSync(path.join(uiDir, 'parchment_dark_seamless.svg'), parchmentSvg, 'utf8');
fs.writeFileSync(path.join(uiDir, 'wax_seal_3d.svg'), waxSealSvg, 'utf8');

console.log('Saved 4 SVG asset files to assets/ui/');
