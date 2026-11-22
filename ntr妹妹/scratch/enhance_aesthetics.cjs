const fs = require('fs');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// 检查 .okh-top-bar、.okh-cards-grid 等样式的表现
const aestheticTweaks = `
    /* ============================================================
       视觉美化全面强化 (Refactoring UI 顶级质感打磨)
       ============================================================ */
    /* 抽屉标题栏精致化 */
    .okh-drawer-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      background: rgba(30, 24, 19, 0.75);
      border: 1px solid rgba(160, 132, 86, 0.3);
      border-radius: 4px;
      transition: all 0.2s;
    }
    .okh-drawer-summary:hover {
      background: rgba(42, 33, 26, 0.9);
      border-color: rgba(195, 162, 108, 0.5);
    }
    .okh-drawer-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--okh-gold-light);
    }
    .okh-drawer-icon {
      font-size: 10px;
      color: var(--okh-gold-main);
      transition: transform 0.2s;
    }
    details[open] .okh-drawer-icon {
      transform: rotate(90deg);
    }

    /* 待决事件板块质感提升 */
    .okh-pending-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: linear-gradient(90deg, rgba(45, 24, 20, 0.85), rgba(26, 18, 15, 0.9));
      border: 1px solid rgba(180, 70, 50, 0.4);
      border-radius: 4px 4px 0 0;
      margin-top: 14px;
    }
    .okh-pending-main-title {
      font-size: 13px;
      font-weight: bold;
      color: #e59a85;
      letter-spacing: 0.5px;
    }
    .okh-pending-sub {
      font-size: 9.5px;
      color: rgba(220, 150, 130, 0.65);
      letter-spacing: 1px;
    }
    .okh-event-card {
      background: rgba(26, 19, 16, 0.92);
      border: 1px solid rgba(180, 70, 50, 0.35);
      border-top: none;
      border-radius: 0 0 4px 4px;
      padding: 14px;
      box-shadow: inset 0 1px 0 rgba(255, 200, 180, 0.05), 0 4px 12px rgba(0, 0, 0, 0.6);
    }
    .okh-event-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px dashed rgba(180, 70, 50, 0.25);
    }
    .okh-event-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: bold;
      color: var(--okh-gold-light);
    }
    .okh-event-id {
      font-size: 10px;
      color: var(--okh-gold-dim);
      font-family: inherit;
    }
    .okh-event-narrative {
      font-size: 12px;
      line-height: 1.7;
      color: #e6dcce;
      margin-bottom: 12px;
      text-align: justify;
      background: rgba(18, 13, 11, 0.5);
      padding: 10px 12px;
      border-radius: 3px;
      border-left: 2px solid rgba(180, 70, 50, 0.5);
    }
    .okh-option-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .okh-option-pill {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      background: rgba(38, 28, 22, 0.75);
      border: 1px solid rgba(195, 162, 108, 0.35);
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
      color: var(--okh-gold-light);
      transition: all 0.2s ease;
      text-align: left;
    }
    .okh-option-pill:hover {
      background: rgba(55, 40, 30, 0.95);
      border-color: var(--okh-border-gold-bright);
      box-shadow: 0 0 10px rgba(223, 200, 154, 0.25);
      transform: translateX(2px);
    }
    .okh-opt-title {
      font-size: 12px;
      font-weight: 500;
    }
    .okh-opt-code {
      font-size: 11px;
      color: var(--okh-gold-main);
      flex-shrink: 0;
    }
`;

const insertPos = html.indexOf('/* 模态框指标与按钮精修 */');
if (insertPos !== -1) {
  html = html.substring(0, insertPos) + aestheticTweaks + '\n' + html.substring(insertPos);
  console.log('Inserted aestheticTweaks before modal tweaks');
}

fs.writeFileSync('预览_状态栏样式.html', html, 'utf8');
console.log('Saved enhanced aesthetics to 预览_状态栏样式.html');
