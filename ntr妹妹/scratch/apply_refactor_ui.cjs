const fs = require('fs');

const localPath = '预览_状态栏样式.html';
const artPath = 'C:/Users/11944/.gemini/antigravity/brain/1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f/status_bar_preview.html';

let content = fs.readFileSync(localPath, 'utf8');

// 1. 替换伙伴卡片相关的 CSS 样式
const oldCardCssStart = content.indexOf('.okh-member-card {');
const oldCardCssEnd = content.indexOf('/* ============================================================', oldCardCssStart);

if (oldCardCssStart !== -1 && oldCardCssEnd !== -1) {
  const newCardCss = `.okh-member-card {
      display: flex;
      background: linear-gradient(145deg, rgba(32, 26, 21, 0.95), rgba(18, 14, 11, 0.98));
      border: 1px solid rgba(195, 162, 108, 0.3);
      border-radius: 6px;
      padding: 12px;
      gap: 12px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .okh-member-card:hover {
      border-color: rgba(224, 190, 126, 0.55);
      background: linear-gradient(145deg, rgba(38, 30, 24, 0.98), rgba(22, 17, 13, 0.99));
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6), 0 0 10px rgba(215, 175, 110, 0.15);
    }

    .okh-portrait-slot {
      position: relative;
      width: 68px;
      height: 86px;
      flex-shrink: 0;
      border: 1px solid rgba(215, 175, 110, 0.45);
      border-radius: 5px;
      background: #120f0d;
      overflow: hidden;
      box-shadow: 
        0 3px 8px rgba(0, 0, 0, 0.6),
        inset 0 0 12px rgba(0, 0, 0, 0.85);
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .okh-portrait-slot:hover {
      border-color: var(--okh-border-gold-bright);
      box-shadow: 0 0 12px rgba(224, 190, 126, 0.45), inset 0 0 6px rgba(0,0,0,0.6);
      transform: scale(1.03);
    }

    .okh-portrait-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }
    .okh-portrait-slot:hover .okh-portrait-img {
      transform: scale(1.06);
    }

    .okh-sigil-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 35%, rgba(56, 44, 34, 0.9), rgba(16, 13, 10, 0.98));
      color: var(--okh-gold-dim);
      padding: 4px;
      text-align: center;
    }
    .okh-sigil-glyph {
      font-size: 22px;
      line-height: 1;
      margin-bottom: 4px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    }
    .okh-sigil-sub {
      font-size: 9px;
      color: rgba(180, 160, 130, 0.55);
      margin-top: 2px;
    }

    .okh-card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
      gap: 6px;
    }

    .okh-body-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .okh-name-title {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .okh-hero-name {
      font-size: 14.5px;
      font-weight: 600;
      color: var(--okh-gold-light);
      letter-spacing: 0.5px;
    }
    .okh-hero-job {
      font-size: 10.5px;
      color: var(--okh-gold-dim);
    }
    .okh-hero-locale {
      font-size: 10.5px;
      color: var(--okh-gold-main);
      background: rgba(195, 162, 108, 0.12);
      border: 1px solid rgba(195, 162, 108, 0.25);
      padding: 1px 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .okh-bond-metric {
      margin: 2px 0;
    }
    .okh-bond-labels {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 10px;
      margin-bottom: 4px;
    }
    .okh-bond-title {
      color: rgba(185, 165, 135, 0.6);
      letter-spacing: 0.3px;
    }
    .okh-bond-tier {
      color: #ffd875;
      font-weight: 500;
      font-size: 10.5px;
    }
    .okh-bond-num {
      font-weight: 600;
      color: #ffe699;
      margin-left: 2px;
    }

    .okh-gauge-track {
      width: 100%;
      height: 4px;
      background: rgba(0, 0, 0, 0.65);
      border: 1px solid rgba(195, 162, 108, 0.18);
      border-radius: 2px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.8);
    }
    .okh-gauge-fill {
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, #9e8a67, #e0be7e);
      box-shadow: 0 0 6px rgba(224, 190, 126, 0.4);
    }
    .okh-gauge-fill.love {
      background: linear-gradient(90deg, #b85b63, #f5848d);
      box-shadow: 0 0 6px rgba(245, 132, 141, 0.5);
    }

    /* Refactoring UI 核心升级：手札式微凹槽位，去除死板冒号标签 */
    .okh-state-slot {
      background: rgba(12, 9, 7, 0.55);
      border: 1px solid rgba(195, 162, 108, 0.12);
      border-radius: 4px;
      padding: 5px 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
    }
    .okh-soul-row {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      line-height: 1.35;
    }
    .okh-soul-icon {
      font-size: 11px;
      opacity: 0.85;
      flex-shrink: 0;
    }
    .okh-soul-quote {
      color: #e2d7c3;
      font-weight: 500;
      letter-spacing: 0.2px;
    }

    .okh-action-row {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 10.5px;
      line-height: 1.35;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .okh-action-icon {
      font-size: 10px;
      opacity: 0.75;
      flex-shrink: 0;
    }
    .okh-action-text {
      color: rgba(195, 175, 145, 0.7);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* 爱德专属墨玉伙伴卡微调 */
    .okh-member-card.ed-card {
      border-color: rgba(104, 173, 124, 0.35);
      background: linear-gradient(145deg, rgba(20, 28, 22, 0.95), rgba(12, 18, 14, 0.98));
    }
    .okh-member-card.ed-card:hover {
      border-color: rgba(135, 215, 158, 0.65);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(104, 173, 124, 0.2);
    }
    .okh-member-card.ed-card .okh-hero-name {
      color: #c8edd3;
    }
    .okh-member-card.ed-card .okh-state-slot {
      background: rgba(9, 14, 10, 0.6);
      border-color: rgba(104, 173, 124, 0.15);
    }
    .okh-member-card.ed-card .okh-soul-quote {
      color: #bce3c4;
    }
    .okh-member-card.ed-card .okh-action-text {
      color: #92bfa0;
    }

    `;

  content = content.substring(0, oldCardCssStart) + newCardCss + content.substring(oldCardCssEnd);
  console.log('CSS updated successfully.');
} else {
  console.log('Could not find CSS range.');
}

fs.writeFileSync(localPath, content, 'utf8');
fs.writeFileSync(artPath, content, 'utf8');
console.log('Saved CSS changes.');
