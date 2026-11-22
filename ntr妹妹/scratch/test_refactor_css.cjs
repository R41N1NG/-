const fs = require('fs');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// 1. 补全卡片专属 CSS 规则（插入在 .okh-crest-svg 或合适位置之前）
const cardCssRules = `
    /* ============================================================
       伙伴卡片网格与拟物手札排版系统 (Refactoring UI 严谨重构)
       ============================================================ */
    .okh-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 10px;
    }

    .okh-member-card {
      position: relative;
      display: flex;
      align-items: stretch;
      gap: 10px;
      padding: 9px 11px;
      background: rgba(26, 21, 17, 0.92);
      border: 1px solid rgba(160, 132, 86, 0.35);
      border-radius: 4px;
      box-shadow: inset 0 1px 0 rgba(255, 230, 180, 0.08), 0 3px 10px rgba(0, 0, 0, 0.5);
      transition: all 0.22s ease;
      overflow: hidden;
      min-width: 0;
    }
    .okh-member-card:hover {
      border-color: rgba(215, 178, 115, 0.7);
      background: rgba(33, 26, 21, 0.95);
      box-shadow: inset 0 1px 0 rgba(255, 230, 180, 0.16), 0 4px 14px rgba(0, 0, 0, 0.65);
    }

    /* 左侧立绘徽记槽 */
    .okh-portrait-slot {
      width: 58px;
      min-width: 58px;
      height: 74px;
      border: 1px solid rgba(195, 162, 108, 0.4);
      border-radius: 3px;
      background: #14100d;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: border-color 0.2s, transform 0.2s;
      flex-shrink: 0;
    }
    .okh-portrait-slot:hover {
      border-color: var(--okh-gold-light);
      transform: scale(1.02);
    }
    .okh-portrait-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .okh-sigil-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 2px;
      background: radial-gradient(circle at 50% 35%, rgba(45, 35, 26, 0.9), rgba(18, 14, 11, 0.98));
    }
    .okh-sigil-glyph {
      font-size: 20px;
      line-height: 1;
    }
    .okh-sigil-name {
      font-size: 11px;
      font-weight: bold;
      color: var(--okh-gold-main);
      letter-spacing: 0.5px;
    }
    .okh-sigil-sub {
      font-size: 9px;
      color: var(--okh-gold-dim);
      transform: scale(0.9);
    }

    /* 右侧卡片内容区 */
    .okh-card-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
    }

    .okh-body-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 6px;
    }
    .okh-name-title {
      display: flex;
      align-items: baseline;
      gap: 6px;
      white-space: nowrap;
      min-width: 0;
    }
    .okh-hero-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--okh-gold-light);
      letter-spacing: 0.5px;
    }
    .okh-hero-job {
      font-size: 11px;
      color: var(--okh-gold-dim);
    }
    .okh-hero-locale {
      font-size: 10px;
      color: var(--okh-gold-main);
      background: rgba(195, 162, 108, 0.12);
      border: 1px solid rgba(195, 162, 108, 0.25);
      padding: 1px 6px;
      border-radius: 2px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* 羁绊进度行 */
    .okh-bond-metric {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .okh-bond-labels {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
    }
    .okh-bond-title {
      color: var(--okh-gold-dim);
      font-size: 10px;
    }
    .okh-bond-tier {
      font-size: 11px;
      font-weight: 600;
      color: var(--okh-gold-main);
    }
    .okh-bond-num {
      font-size: 12px;
      font-weight: bold;
      margin-left: 3px;
      color: var(--okh-gold-light);
    }
    .okh-gauge-track {
      height: 3px;
      background: rgba(0, 0, 0, 0.65);
      border-radius: 2px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.8);
    }
    .okh-gauge-fill {
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, #7a633a, #dfc89a);
      transition: width 0.4s ease;
    }
    .okh-gauge-fill.love {
      background: linear-gradient(90deg, #993d54, #ff859d);
    }

    /* 心理心境与日常动向行 (无多余冗余标签) */
    .okh-state-slot {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding-top: 2px;
      border-top: 1px dashed rgba(160, 132, 86, 0.18);
    }
    .okh-soul-row {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--okh-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .okh-soul-icon {
      font-size: 10px;
      color: var(--okh-gold-main);
      opacity: 0.85;
      flex-shrink: 0;
    }
    .okh-soul-quote {
      font-style: italic;
      letter-spacing: 0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .okh-action-row {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: rgba(230, 220, 206, 0.78);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .okh-action-icon {
      font-size: 10px;
      opacity: 0.7;
      flex-shrink: 0;
    }
    .okh-action-text {
      letter-spacing: 0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ============================================================
       爱德全宽卡片 (横跨两列，完美终结5人不对称空洞)
       ============================================================ */
    .okh-member-card.ed-card {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 9px 14px;
      background: rgba(20, 26, 21, 0.94);
      border: 1px solid rgba(104, 173, 124, 0.38);
      box-shadow: inset 0 1px 0 rgba(160, 230, 180, 0.08), 0 3px 10px rgba(0, 0, 0, 0.5);
    }
    .okh-member-card.ed-card:hover {
      border-color: rgba(135, 215, 158, 0.65);
      background: rgba(24, 32, 26, 0.96);
    }
    .okh-ed-left {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .okh-ed-meta {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .okh-ed-divider {
      width: 1px;
      align-self: stretch;
      background: linear-gradient(180deg, transparent, rgba(104, 173, 124, 0.35), transparent);
      margin: 0 4px;
    }
    .okh-ed-right {
      flex: 1.1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      min-width: 0;
      padding-left: 6px;
    }

    /* ============================================================
       待决事件 · 中世纪公文卷轴与火漆印章精修
       ============================================================ */
    .okh-event-deck {
      margin-top: 14px;
    }
    .okh-pending-dispatch-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(28, 20, 16, 0.92);
      border: 1px solid rgba(195, 110, 80, 0.4);
      border-radius: 4px;
      box-shadow: inset 0 1px 0 rgba(255, 180, 140, 0.1), 0 3px 10px rgba(0,0,0,0.5);
    }
    .okh-dispatch-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }
    .okh-dispatch-scroll-icon {
      font-size: 20px;
      flex-shrink: 0;
    }
    .okh-dispatch-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .okh-dispatch-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .okh-dispatch-title {
      font-size: 13px;
      font-weight: bold;
      color: #df9e82;
      letter-spacing: 0.5px;
    }
    .okh-dispatch-tag {
      font-size: 10px;
      color: #dfb29a;
      background: rgba(180, 70, 50, 0.2);
      border: 1px solid rgba(180, 70, 50, 0.4);
      padding: 1px 5px;
      border-radius: 2px;
      letter-spacing: 0.5px;
    }
    .okh-dispatch-desc {
      font-size: 11px;
      color: var(--okh-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .okh-dispatch-seal-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #8a231b, #591611);
      border: 1px solid rgba(220, 100, 80, 0.5);
      color: #f7ded2;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .okh-dispatch-seal-btn:hover {
      background: linear-gradient(135deg, #a82e24, #6e1c16);
      border-color: rgba(255, 140, 120, 0.8);
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(180, 40, 30, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }
`;

console.log('Card CSS Rules prepared, length:', cardCssRules.length);
