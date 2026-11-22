const fs = require('fs');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// ============================================================
// 一体化平面美术专属样式（彻底告别格子胶囊，追求整体感与前后层次）
// ============================================================
const integratedStyles = `
    /* ============================================================
       奥克赫斯 · 一体化西幻古籍手札平面美术系统 (Integrated Parchment UI)
       设计哲学：整体一体，消灭方块套胶囊，前后景深，自然咬合
       ============================================================ */

    /* 主手札容器：一张悬浮于深渊之上的古典羊皮纸战役长卷 */
    .okh-hud-frame {
      position: relative;
      max-width: 780px;
      margin: 0 auto;
      box-sizing: border-box;
      /* 羊皮纸本体背景：中心微暖、边缘暗沉的暗角光晕，与微弱纤维交融 */
      background:
        radial-gradient(ellipse at 50% 15%, rgba(46, 36, 28, 0.98) 0%, rgba(22, 17, 13, 0.99) 70%, rgba(13, 10, 8, 1) 100%),
        url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44NSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuOCAgMCAwIDAgMCAwLjcyICAwIDAgMCAwIDAuNTggIDAgMCAwIDAuMDQ1IDAiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbikiLz48L3N2Zz4=");
      /* 空间前后层次：外圈深邃黑曜石阴影 + 内圈古典暗金蚀刻压痕，前后纵深极强 */
      box-shadow:
        0 15px 40px rgba(0, 0, 0, 0.85),
        0 2px 10px rgba(0, 0, 0, 0.6),
        inset 0 0 0 1px rgba(195, 162, 108, 0.35),
        inset 0 0 0 4px rgba(22, 17, 13, 0.9),
        inset 0 0 0 5px rgba(160, 132, 86, 0.22),
        inset 0 0 35px rgba(0, 0, 0, 0.7);
      border-radius: 6px;
      padding: 24px 28px 30px;
      border: none;
    }

    /* 边角与边线的一体化蔓草回纹 (与边线一体流动，彻底去除生硬贴纸感) */
    .okh-hud-frame::before {
      content: "";
      position: absolute;
      inset: 8px;
      border: 1px solid rgba(195, 162, 108, 0.25);
      border-radius: 4px;
      pointer-events: none;
      /* 四角交错回纹 */
      background:
        radial-gradient(circle at 0 0, transparent 8px, rgba(195,162,108,0.2) 8px, transparent 9px),
        radial-gradient(circle at 100% 0, transparent 8px, rgba(195,162,108,0.2) 8px, transparent 9px),
        radial-gradient(circle at 0 100%, transparent 8px, rgba(195,162,108,0.2) 8px, transparent 9px),
        radial-gradient(circle at 100% 100%, transparent 8px, rgba(195,162,108,0.2) 8px, transparent 9px);
    }

    /* 顶层页眉徽章线 (中世纪手札题头) */
    .okh-crest-header {
      text-align: center;
      margin-bottom: 14px;
      position: relative;
    }

    /* ============================================================
       一、卷首信息 (浑然一体，消灭生硬黑块与白框)
       ============================================================ */
    .okh-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 10px 14px;
      background: rgba(30, 23, 18, 0.5);
      border-bottom: 1px solid rgba(195, 162, 108, 0.25);
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
    }
    .okh-bar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* 时间星盘 (中世纪暗金微型按键，彻底消灭原生白框) */
    .okh-dial-plate {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(48, 36, 27, 0.7);
      border: 1px solid rgba(195, 162, 108, 0.4);
      color: var(--okh-gold-light);
      padding: 4px 11px;
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
      font-size: 11.5px;
      box-shadow: inset 0 1px 0 rgba(255, 230, 180, 0.15), 0 2px 6px rgba(0, 0, 0, 0.4);
      transition: all 0.22s ease;
      outline: none;
    }
    .okh-dial-plate:hover {
      background: rgba(65, 48, 35, 0.85);
      border-color: var(--okh-border-gold-bright);
      box-shadow: 0 0 12px rgba(223, 200, 154, 0.35);
      transform: translateY(-1px);
    }
    .okh-dial-astrolabe {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }
    .okh-dial-text {
      font-weight: 600;
      color: var(--okh-gold-light);
      letter-spacing: 0.3px;
    }
    .okh-dial-time {
      color: var(--okh-gold-main);
      font-weight: bold;
    }
    .okh-dial-cal-hint {
      font-size: 10px;
      color: var(--okh-gold-dim);
      background: rgba(195, 162, 108, 0.12);
      border: 1px solid rgba(195, 162, 108, 0.25);
      padding: 1px 6px;
      border-radius: 2px;
      margin-left: 2px;
      letter-spacing: 0.5px;
    }

    /* 地理位置 */
    .okh-loc-plate {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      color: var(--okh-text-main);
    }
    .okh-loc-sigil {
      font-size: 13px;
      color: var(--okh-gold-main);
    }

    /* 右侧：财富与舆图 */
    .okh-bar-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .okh-wealth-box {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
    }
    .okh-wealth-coin {
      font-size: 13px;
    }
    .okh-wealth-val {
      font-weight: bold;
      color: var(--okh-gold-light);
      letter-spacing: 0.3px;
    }

    /* 区域舆图 (古典暗金按键，彻底消灭原生白框) */
    .okh-map-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: linear-gradient(180deg, rgba(58, 44, 32, 0.9), rgba(35, 26, 18, 0.95));
      border: 1px solid rgba(195, 162, 108, 0.45);
      color: var(--okh-gold-light);
      padding: 4px 11px;
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      box-shadow: inset 0 1px 0 rgba(255, 230, 180, 0.15), 0 2px 5px rgba(0, 0, 0, 0.45);
      transition: all 0.22s ease;
      outline: none;
    }
    .okh-map-btn:hover {
      background: linear-gradient(180deg, rgba(78, 58, 42, 0.98), rgba(48, 35, 24, 1));
      border-color: var(--okh-border-gold-bright);
      box-shadow: 0 0 12px rgba(223, 200, 154, 0.35);
      transform: translateY(-1px);
    }
    .okh-map-icon {
      font-size: 12px;
    }

    /* 视野同行流 (纤细融入纸面，无独立胶囊块) */
    .okh-presence-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 14px;
      margin-bottom: 12px;
      font-size: 11px;
      border-left: 2px solid rgba(104, 173, 124, 0.5);
      background: rgba(20, 16, 13, 0.4);
      border-radius: 0 3px 3px 0;
    }
    .okh-presence-title {
      color: var(--okh-gold-dim);
      font-weight: 600;
      flex-shrink: 0;
    }
    .okh-presence-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .okh-presence-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--okh-text-main);
    }
    .okh-presence-orb {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #68ad7c;
      box-shadow: 0 0 5px #68ad7c;
    }
    .okh-presence-action {
      color: var(--okh-text-muted);
      font-size: 10px;
    }

    /* ============================================================
       二、小队羁绊手札 (彻底消灭格子胶囊，纯正一体化名册)
       ============================================================ */
    .okh-drawer-box {
      margin-top: 6px;
    }
    .okh-drawer-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      cursor: pointer;
      background: rgba(28, 22, 17, 0.45);
      border-bottom: 1px dashed rgba(160, 132, 86, 0.25);
      border-radius: 3px 3px 0 0;
      transition: all 0.2s;
    }
    .okh-drawer-summary:hover {
      background: rgba(38, 29, 22, 0.65);
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

    /* 伙伴名册网格：一体化书卷排版，彻底看不出格子的拆分 */
    .okh-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 18px;
      padding: 14px 4px 6px;
    }

    /* 单条伙伴记录：没有生硬的死黑边框！完全融入羊皮纸背景 */
    .okh-member-card {
      position: relative;
      display: flex;
      align-items: stretch;
      gap: 12px;
      padding: 10px 12px;
      /* 只有极其幽微的纸面压印微光，绝无死黑方盒子 */
      background: radial-gradient(ellipse at 50% 50%, rgba(35, 27, 21, 0.45) 0%, rgba(20, 15, 12, 0.2) 100%);
      border: 1px solid rgba(160, 132, 86, 0.18);
      border-radius: 4px;
      box-shadow: inset 0 1px 0 rgba(255, 230, 180, 0.04), 0 2px 8px rgba(0, 0, 0, 0.35);
      transition: all 0.25s ease;
      min-width: 0;
    }
    .okh-member-card:hover {
      border-color: rgba(215, 178, 115, 0.45);
      background: radial-gradient(ellipse at 50% 50%, rgba(45, 34, 26, 0.6) 0%, rgba(25, 19, 15, 0.3) 100%);
      box-shadow: inset 0 1px 0 rgba(255, 230, 180, 0.08), 0 4px 14px rgba(0, 0, 0, 0.55);
      transform: translateY(-1px);
    }

    /* 爱德作为第 5 张伙伴卡：单人尺寸，绝不霸占两人位置 */
    .okh-member-card.ed-card {
      border-color: rgba(104, 173, 124, 0.25);
      background: radial-gradient(ellipse at 50% 50%, rgba(24, 34, 27, 0.45) 0%, rgba(14, 20, 16, 0.2) 100%);
    }
    .okh-member-card.ed-card:hover {
      border-color: rgba(135, 215, 158, 0.5);
      background: radial-gradient(ellipse at 50% 50%, rgba(32, 45, 36, 0.6) 0%, rgba(18, 26, 20, 0.3) 100%);
    }

    /* 头像徽记槽：手札上的凹版压印 (Debossed Seal) */
    .okh-portrait-slot {
      width: 58px;
      min-width: 58px;
      height: 74px;
      border: 1px solid rgba(195, 162, 108, 0.35);
      border-radius: 3px;
      background: #110d0b;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.22s ease;
      flex-shrink: 0;
    }
    .okh-portrait-slot:hover {
      border-color: var(--okh-gold-light);
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.85), 0 0 10px rgba(223, 200, 154, 0.3);
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
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.8));
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

    /* 右侧卡片内容区：垂直 4 层阶梯流，层次极度分明 */
    .okh-card-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
    }

    /* 第 1 层：名字与地位 (去除死板胶囊框) */
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
      font-size: 14.5px;
      font-weight: 700;
      color: #f5e6cf;
      letter-spacing: 0.5px;
    }
    .okh-hero-job {
      font-size: 11px;
      color: #c4aa7d;
    }
    /* 地点：幽微浮现于右上，不加刺眼生硬的矩形边框！ */
    .okh-hero-locale {
      font-size: 10px;
      color: var(--okh-gold-main);
      opacity: 0.85;
      letter-spacing: 0.3px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* 第 2 层：羁绊好感度 (纤细金丝线，融入纸面) */
    .okh-bond-metric {
      display: flex;
      flex-direction: column;
      gap: 2.5px;
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
      font-size: 11.5px;
      font-weight: bold;
      margin-left: 3px;
      color: #f5e6cf;
    }
    /* 进度槽：2.5px 纤细金丝槽，深邃内嵌 */
    .okh-gauge-track {
      height: 2.5px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 2px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.9);
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

    /* 第 3、4 层：心境与动向 (自然手抄引语，去除所有生硬标签) */
    .okh-state-slot {
      display: flex;
      flex-direction: column;
      gap: 2.5px;
      padding-top: 2px;
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
      color: #dfc89a;
      opacity: 0.9;
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
      color: rgba(230, 220, 206, 0.75);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .okh-action-icon {
      font-size: 10px;
      opacity: 0.65;
      flex-shrink: 0;
    }
    .okh-action-text {
      letter-spacing: 0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ============================================================
       三、待决事件板块 · 中世纪公文蜡封长卷 (空间前后纵深极强)
       ============================================================ */
    .okh-pending-section {
      margin-top: 20px;
      position: relative;
    }
    .okh-pending-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: linear-gradient(90deg, rgba(48, 22, 18, 0.85), rgba(26, 17, 14, 0.85));
      border: 1px solid rgba(180, 70, 50, 0.45);
      border-radius: 4px 4px 0 0;
      box-shadow: inset 0 1px 0 rgba(255, 180, 160, 0.1);
    }
    .okh-pending-main-title {
      font-size: 13px;
      font-weight: bold;
      color: #e59a85;
      letter-spacing: 0.5px;
    }
    .okh-pending-sub {
      font-size: 9.5px;
      color: rgba(220, 150, 130, 0.6);
      letter-spacing: 1px;
    }

    /* 3D物理流蜡火漆印章：前景立体实体，投下深色阴影 */
    .okh-wax-seal-img {
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 8px rgba(180, 40, 30, 0.4));
      transition: transform 0.25s ease, filter 0.25s ease;
    }
    .okh-wax-seal-img:hover {
      transform: scale(1.1) rotate(-3deg);
      filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 12px rgba(220, 60, 40, 0.6));
    }

    .okh-event-card {
      background: rgba(24, 17, 14, 0.9);
      border: 1px solid rgba(180, 70, 50, 0.35);
      border-top: none;
      border-radius: 0 0 4px 4px;
      padding: 16px;
      box-shadow: inset 0 1px 0 rgba(255, 200, 180, 0.05), 0 6px 16px rgba(0, 0, 0, 0.7);
    }
    .okh-event-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px dashed rgba(180, 70, 50, 0.25);
    }
    .okh-event-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: bold;
      color: #f5e6cf;
    }
    .okh-event-id {
      font-size: 10px;
      color: var(--okh-gold-dim);
    }
    .okh-event-narrative {
      font-size: 12px;
      line-height: 1.75;
      color: #e6dcce;
      margin-bottom: 14px;
      text-align: justify;
      background: rgba(16, 11, 9, 0.6);
      padding: 12px 14px;
      border-radius: 3px;
      border-left: 2px solid rgba(180, 70, 50, 0.6);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.6);
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
      gap: 12px;
      padding: 9px 16px;
      background: rgba(38, 27, 21, 0.75);
      border: 1px solid rgba(195, 162, 108, 0.35);
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
      color: var(--okh-gold-light);
      transition: all 0.22s ease;
      box-shadow: inset 0 1px 0 rgba(255, 230, 180, 0.08), 0 2px 6px rgba(0,0,0,0.4);
      outline: none;
    }
    .okh-option-pill:hover {
      background: rgba(56, 39, 29, 0.95);
      border-color: var(--okh-border-gold-bright);
      box-shadow: 0 0 12px rgba(223, 200, 154, 0.3);
      transform: translateX(3px);
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

    /* ============================================================
       四、详情模态弹窗 · 一体化古籍卷轴档案 (彻底抹除作为底色的内心风骨)
       ============================================================ */
    .okh-modal-box {
      background:
        radial-gradient(ellipse at 50% 20%, rgba(42, 32, 25, 0.98) 0%, rgba(20, 15, 12, 0.99) 100%),
        url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44NSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuOCAgMCAwIDAgMCAwLjcyICAwIDAgMCAwIDAuNTggIDAgMCAwIDAuMDQ1IDAiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbikiLz48L3N2Zz4=");
      border: 1px solid rgba(195, 162, 108, 0.45);
      border-radius: 6px;
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.9),
        inset 0 0 0 1px rgba(195, 162, 108, 0.25),
        inset 0 0 40px rgba(0, 0, 0, 0.8);
      max-width: 660px;
      width: 92%;
      max-height: 88vh;
      overflow-y: auto;
      padding: 24px 28px;
    }
    .okh-info-sec {
      background: rgba(28, 21, 16, 0.65);
      border: 1px solid rgba(160, 132, 86, 0.22);
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 10px;
    }
    .okh-info-sec-title {
      font-size: 11.5px;
      font-weight: bold;
      color: var(--okh-gold-main);
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      border-bottom: 1px dashed rgba(160, 132, 86, 0.22);
      padding-bottom: 4px;
    }
    .okh-info-sec-content {
      font-size: 12px;
      line-height: 1.65;
      color: #e6dcce;
    }
    .okh-info-metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px solid rgba(160, 132, 86, 0.1);
      font-size: 11.5px;
    }
    .okh-info-metric-row:last-child {
      border-bottom: none;
    }
    .okh-metric-label {
      color: var(--okh-gold-dim);
    }
    .okh-info-metric-val {
      font-weight: 600;
      color: #f5e6cf;
    }
    .okh-act-pill {
      background: rgba(35, 26, 20, 0.75);
      border: 1px solid rgba(160, 132, 86, 0.35);
      border-radius: 4px;
      padding: 10px 14px;
      transition: all 0.2s ease;
      cursor: pointer;
      outline: none;
    }
    .okh-act-pill:hover {
      background: rgba(52, 38, 28, 0.95);
      border-color: var(--okh-border-gold-bright);
      box-shadow: 0 0 12px rgba(223, 200, 154, 0.25);
      transform: translateY(-1px);
    }
`;

// 把旧的 .okh-cards-grid 和 .okh-member-card 相关样式全部替换为这套一体化美术系统
const cutStart = html.indexOf('/* ============================================================');
const cutEnd = html.indexOf('.okh-calendar-box {');

if (cutStart !== -1 && cutEnd !== -1) {
  html = html.substring(0, cutStart) + integratedStyles + '\n\n    ' + html.substring(cutEnd);
  console.log('Successfully replaced old styles with integrated styles');
} else {
  console.log('Error: bounds not found for style replacement');
}

fs.writeFileSync('预览_状态栏样式.html', html, 'utf8');
console.log('Saved 预览_状态栏样式.html with integrated UI');
