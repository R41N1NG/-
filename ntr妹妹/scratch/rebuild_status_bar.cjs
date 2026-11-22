const fs = require('fs');
const path = require('path');

// 读取当前 HTML
const origHtml = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// 提取原有的 CHAR_ROSTER 和 CALENDAR_HISTORY 数据块
function extractBetween(str, startToken, endToken) {
  const s = str.indexOf(startToken);
  if (s === -1) return '';
  const e = str.indexOf(endToken, s);
  if (e === -1) return '';
  return str.substring(s, e);
}

// 提取 CHAR_ROSTER 定义
const rosterStart = origHtml.indexOf('const CHAR_ROSTER = {');
const calendarStart = origHtml.indexOf('const CALENDAR_HISTORY = {');
const charRosterCode = origHtml.substring(rosterStart, calendarStart);

// 提取 CALENDAR_HISTORY 到 openCalendarModal 之间
const calHistoryCode = origHtml.substring(calendarStart, origHtml.indexOf('function openCalendarModal()'));

console.log('Extracted CHAR_ROSTER length:', charRosterCode.length);
console.log('Extracted CALENDAR_HISTORY length:', calHistoryCode.length);

// 提取蜡封 SVG base64
const sealMatch = origHtml.match(/src="(data:image\/svg\+xml;base64,[^"]+)"/);
const waxSealSrc = sealMatch ? sealMatch[1] : '';
console.log('Wax seal src found:', waxSealSrc.length > 0);

// 现在构建全新的 HTML
const newHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>奥克赫斯 · 西幻跑团手札状态栏（TRPG黑金古籍手札·双模精整版）</title>
  <style>
    /* ============================================================
       一、核心设计变量与色彩体系 (黑金西幻手札规范)
       原则：外框细线、黑金内敛、层级清晰、去除生硬描边与厚重方框
       ============================================================ */
    :root {
      --okh-bg-outer: #0a0907;
      --okh-bg-shell: #120f0c;
      --okh-bg-card: rgba(26, 21, 16, 0.75);
      --okh-bg-card-hover: rgba(38, 30, 23, 0.9);
      
      --okh-border-subtle: rgba(195, 162, 108, 0.2);
      --okh-border-gold: rgba(195, 162, 108, 0.35);
      --okh-border-bright: rgba(235, 205, 145, 0.7);
      
      --okh-gold-light: #f5eedf;
      --okh-gold-main: #dfc89a;
      --okh-gold-dim: #9e8d75;
      --okh-gold-dark: #63543b;
      
      --okh-text-main: #e8ded2;
      --okh-text-muted: #a49684;
      
      --okh-wax-seal: #8a231b;
      --okh-accent-crimson: #a63a3a;
      --okh-accent-green: #5a8a68;
      --okh-accent-pink: #c76f82;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--okh-bg-outer);
      color: var(--okh-text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
      font-size: 13px;
      line-height: 1.5;
      padding: 20px 12px 60px;
      user-select: none;
      -webkit-font-smoothing: antialiased;
    }

    /* 顶部演示控制栏 */
    .okh-demo-toolbar {
      max-width: 760px;
      margin: 0 auto 12px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(22, 18, 14, 0.9);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 4px;
      font-size: 11px;
      color: var(--okh-gold-dim);
    }
    .okh-demo-btns {
      display: flex;
      gap: 6px;
    }
    .okh-demo-btn {
      background: rgba(195, 162, 108, 0.12);
      border: 1px solid var(--okh-border-subtle);
      color: var(--okh-gold-main);
      padding: 3px 9px;
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      transition: all 0.2s;
    }
    .okh-demo-btn:hover {
      background: rgba(195, 162, 108, 0.25);
      border-color: var(--okh-gold-main);
      color: var(--okh-gold-light);
    }

    /* ============================================================
       二、手札主框架 (西幻手札：一层极细金边，靠间距与明暗分层)
       ============================================================ */
    .okh-hud-frame {
      position: relative;
      max-width: 760px;
      margin: 0 auto;
      background: 
        radial-gradient(ellipse at 50% 0%, rgba(32, 25, 19, 0.98) 0%, rgba(18, 14, 11, 0.99) 75%, rgba(12, 10, 8, 1) 100%);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 4px;
      box-shadow: 0 16px 45px rgba(0, 0, 0, 0.85);
      padding: 12px 18px 20px;
      transition: all 0.25s ease;
    }

    /* 顶部装饰：大幅压缩为 14px 精美细金星印，不抢视觉 */
    .okh-crest-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 2px 0 8px;
    }
    .okh-crest-line {
      flex: 1;
      max-width: 140px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(195, 162, 108, 0.3), transparent);
    }
    .okh-crest-diamond {
      font-family: "Cinzel", "Songti SC", "SimSun", serif;
      font-size: 10px;
      color: var(--okh-gold-dim);
      letter-spacing: 2px;
      opacity: 0.85;
    }

    /* 顶层状态栏（高聚合整合：时间、地点、金币、地图） */
    .okh-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--okh-border-subtle);
    }
    .okh-top-left {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .okh-top-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* 时间与历程胶囊按钮 */
    .okh-pill-time {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(30, 24, 18, 0.8);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 3px;
      padding: 4px 10px;
      color: var(--okh-gold-light);
      cursor: pointer;
      font-family: inherit;
      font-size: 11.5px;
      transition: all 0.2s;
    }
    .okh-pill-time:hover {
      background: rgba(45, 35, 27, 0.95);
      border-color: var(--okh-border-gold);
    }
    .okh-time-day {
      font-weight: 500;
    }
    .okh-time-wk {
      color: var(--okh-gold-dim);
      font-size: 11px;
    }
    .okh-pill-tag {
      font-size: 10px;
      color: #dfc89a;
      background: rgba(195, 162, 108, 0.15);
      border: 1px solid rgba(195, 162, 108, 0.3);
      padding: 1px 5px;
      border-radius: 2px;
      margin-left: 2px;
    }

    /* 地理位置 */
    .okh-pill-loc {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
      color: var(--okh-text-muted);
      padding: 4px 6px;
    }

    /* 金币与财富 */
    .okh-pill-gold {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(30, 24, 18, 0.8);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 3px;
      padding: 4px 9px;
      font-size: 11.5px;
      color: #f7e6c4;
      font-weight: 600;
    }
    
    /* 地图入口按钮 */
    .okh-pill-map {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(30, 24, 18, 0.8);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 3px;
      padding: 4px 10px;
      color: var(--okh-gold-main);
      cursor: pointer;
      font-family: inherit;
      font-size: 11.5px;
      transition: all 0.2s;
    }
    .okh-pill-map:hover {
      background: rgba(45, 35, 27, 0.95);
      border-color: var(--okh-border-gold);
      color: var(--okh-gold-light);
    }

    /* 单色手札符号公共类 */
    .okh-icon-gold {
      color: var(--okh-gold-main);
      font-size: 11px;
      opacity: 0.9;
    }

    /* 顶层次级行：模式切换栏与同行提示 */
    .okh-sub-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px dashed rgba(195, 162, 108, 0.15);
      margin-bottom: 12px;
    }
    
    /* 双模式切换选项卡：旅途手札 vs 公会名册 */
    .okh-view-toggle {
      display: inline-flex;
      background: rgba(18, 14, 11, 0.9);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 3px;
      padding: 2px;
      gap: 2px;
    }
    .okh-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: transparent;
      border: none;
      color: var(--okh-gold-dim);
      padding: 4px 12px;
      border-radius: 2px;
      font-family: inherit;
      font-size: 11.5px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .okh-toggle-btn:hover {
      color: var(--okh-gold-light);
    }
    .okh-toggle-btn.active {
      background: rgba(195, 162, 108, 0.2);
      color: #fff6e5;
      font-weight: 600;
      box-shadow: inset 0 1px 0 rgba(255, 235, 190, 0.15);
    }
    .okh-toggle-mark {
      font-size: 9px;
      color: var(--okh-gold-main);
    }
    .okh-rec-tag {
      font-size: 9.5px;
      color: #dfc89a;
      background: rgba(195, 162, 108, 0.25);
      padding: 1px 4px;
      border-radius: 2px;
      margin-left: 2px;
    }

    /* 视野同行提示 */
    .okh-presence-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--okh-text-muted);
    }
    .okh-presence-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--okh-accent-green);
      box-shadow: 0 0 5px rgba(90, 138, 104, 0.6);
    }

    /* ============================================================
       三、核心委托公文卡片 (旅途手札第一主角，突出当前委托)
       ============================================================ */
    .okh-quest-card {
      background: var(--okh-bg-card);
      border: 1px solid var(--okh-border-gold);
      border-radius: 4px;
      padding: 14px 18px 16px;
      margin-bottom: 14px;
      position: relative;
      box-shadow: inset 0 1px 0 rgba(255, 235, 190, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .okh-quest-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 10px;
    }
    .okh-quest-prefix {
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 1px;
      color: var(--okh-gold-dim);
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .okh-quest-name {
      font-family: "Cinzel", "Songti SC", "SimSun", serif;
      font-size: 15px;
      font-weight: 700;
      color: #fff6e5;
      letter-spacing: 0.5px;
    }
    
    /* 唯一高权重图章：暗红公会蜡封 */
    .okh-quest-seal-slot {
      flex-shrink: 0;
      margin-top: -4px;
    }
    .okh-wax-seal-img {
      width: 42px;
      height: 42px;
      cursor: pointer;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.85));
      transition: transform 0.2s;
    }
    .okh-wax-seal-img:hover {
      transform: scale(1.06);
    }

    /* 剧情叙述：无生硬描边、无重阴影、字体干净易读 */
    .okh-quest-story {
      font-size: 12.5px;
      line-height: 1.65;
      color: #dfd4c5;
      background: rgba(18, 14, 11, 0.5);
      border-left: 2px solid rgba(195, 162, 108, 0.4);
      padding: 10px 14px;
      border-radius: 2px;
      margin-bottom: 12px;
    }

    /* 决断选项按钮列表 */
    .okh-quest-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .okh-opt-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 9px 14px;
      background: linear-gradient(180deg, rgba(45, 34, 25, 0.9) 0%, rgba(28, 20, 15, 0.94) 100%);
      border: 1px solid var(--okh-border-gold);
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
      color: #fdf3e2;
      transition: all 0.2s ease;
      box-shadow: inset 0 1px 0 rgba(255, 235, 190, 0.1), 0 2px 5px rgba(0,0,0,0.4);
      text-align: left;
    }
    .okh-opt-btn:hover {
      background: linear-gradient(180deg, rgba(62, 46, 34, 0.98) 0%, rgba(40, 29, 21, 0.98) 100%);
      border-color: #fcebc7;
      box-shadow: 0 0 12px rgba(223, 200, 154, 0.35);
      transform: translateX(2px);
    }
    .okh-opt-text {
      font-size: 12.5px;
      font-weight: 500;
      color: #fff6e5;
    }
    .okh-opt-badge {
      font-size: 11px;
      font-weight: 700;
      color: #1a1209;
      background: linear-gradient(180deg, #f7e6c4 0%, #caa463 100%);
      border: 1px solid #fffaea;
      padding: 2px 7px;
      border-radius: 3px;
      flex-shrink: 0;
      letter-spacing: 0.5px;
    }

    /* ============================================================
       四、同行小队名册 (名册式排列，终结 2x2+1 失衡方块)
       ============================================================ */
    .okh-roster-section {
      background: rgba(20, 16, 12, 0.65);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 4px;
      padding: 12px 14px 14px;
    }
    .okh-roster-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      margin-bottom: 8px;
      border-bottom: 1px solid var(--okh-border-subtle);
    }
    .okh-roster-title {
      display: flex;
      align-items: center;
      gap: 7px;
      font-family: "Cinzel", "Songti SC", "SimSun", serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--okh-gold-light);
    }
    .okh-roster-count {
      font-family: sans-serif;
      font-size: 10.5px;
      font-weight: normal;
      color: var(--okh-gold-dim);
    }
    .okh-roster-hint {
      font-size: 10.5px;
      color: var(--okh-text-muted);
    }

    /* 5 人紧凑名册列表 */
    .okh-roster-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .okh-roster-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: rgba(28, 22, 17, 0.7);
      border: 1px solid rgba(195, 162, 108, 0.18);
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .okh-roster-row:hover {
      background: rgba(45, 35, 27, 0.95);
      border-color: var(--okh-border-gold);
      transform: translateX(2px);
    }
    .okh-r-left {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 140px;
    }
    .okh-r-sigil {
      font-size: 13px;
      color: var(--okh-gold-main);
      width: 18px;
      text-align: center;
    }
    .okh-r-name {
      font-family: "Cinzel", "Songti SC", "SimSun", serif;
      font-size: 13px;
      font-weight: 700;
      color: #fff4e0;
    }
    .okh-r-job {
      font-size: 11px;
      color: var(--okh-gold-dim);
    }
    
    .okh-r-mid {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }
    .okh-r-loc-tag {
      font-size: 10.5px;
      color: #dfc89a;
      background: rgba(195, 162, 108, 0.12);
      border: 1px solid rgba(195, 162, 108, 0.25);
      padding: 1px 6px;
      border-radius: 2px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .okh-r-state-brief {
      font-size: 11px;
      color: var(--okh-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .okh-r-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .okh-r-bond {
      font-size: 11px;
      color: var(--okh-gold-main);
      font-weight: 600;
    }
    .okh-r-arrow {
      font-size: 13px;
      color: var(--okh-gold-dim);
      transition: transform 0.2s;
    }
    .okh-roster-row:hover .okh-r-arrow {
      color: #fff4e0;
      transform: translateX(2px);
    }

    /* ============================================================
       五、公会名册视图 (切换后突出小队卡片)
       ============================================================ */
    .okh-roster-view {
      display: none; /* 默认隐藏，切换时激活 */
    }
    .okh-cards-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 14px;
    }
    .okh-guild-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: var(--okh-bg-card);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .okh-guild-card:hover {
      background: var(--okh-bg-card-hover);
      border-color: var(--okh-border-gold);
    }
    .okh-g-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .okh-g-badge-sigil {
      width: 32px;
      height: 32px;
      border-radius: 3px;
      background: rgba(36, 28, 22, 0.9);
      border: 1px solid var(--okh-border-gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: var(--okh-gold-main);
    }
    .okh-g-info-title {
      font-family: "Cinzel", "Songti SC", "SimSun", serif;
      font-size: 13.5px;
      font-weight: 700;
      color: #fff4e0;
    }
    .okh-g-info-sub {
      font-size: 11px;
      color: var(--okh-text-muted);
    }
    .okh-g-mid {
      flex: 1;
      padding: 0 10px;
    }
    .okh-g-quote {
      font-size: 11px;
      font-style: italic;
      color: var(--okh-gold-dim);
    }
    .okh-g-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }
    .okh-gauge-mini {
      width: 70px;
      height: 2.5px;
      background: rgba(0,0,0,0.6);
      border-radius: 2px;
      overflow: hidden;
    }
    .okh-gauge-mini-fill {
      height: 100%;
      background: linear-gradient(90deg, #7a633a, #dfc89a);
    }

    /* ============================================================
       六、酒馆玩家输入栏模拟区
       ============================================================ */
    .okh-tavern-chat-dock {
      max-width: 760px;
      margin: 14px auto 0;
      background: rgba(18, 14, 11, 0.95);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 4px;
      padding: 10px 14px;
    }
    .okh-dock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--okh-gold-dim);
      margin-bottom: 6px;
    }
    .okh-dock-badge {
      font-size: 10.5px;
      color: var(--okh-gold-main);
      background: rgba(195, 162, 108, 0.12);
      border: 1px solid var(--okh-border-subtle);
      padding: 2px 7px;
      border-radius: 2px;
    }
    .okh-input-wrap {
      display: flex;
      gap: 8px;
    }
    .okh-tavern-textarea {
      flex: 1;
      height: 48px;
      background: rgba(10, 8, 6, 0.85);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 3px;
      padding: 8px 10px;
      color: #fff;
      font-family: inherit;
      font-size: 12px;
      outline: none;
      resize: none;
    }
    .okh-tavern-textarea:focus {
      border-color: var(--okh-border-gold);
    }
    .okh-tavern-send-btn {
      width: 72px;
      background: linear-gradient(180deg, #dfc89a 0%, #b89862 100%);
      border: 1px solid #f3e5c8;
      border-radius: 3px;
      color: #1a1209;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .okh-tavern-send-btn:hover {
      background: linear-gradient(180deg, #fff 0%, #e6c484 100%);
    }

    /* ============================================================
       七、模态弹窗系统 (立绘大图详情、日历历程、地图)
       ============================================================ */
    .okh-modal-overlay, .okh-map-overlay {
      display: none !important;
      position: fixed !important;
      inset: 0 !important;
      z-index: 99999 !important;
      background: rgba(10, 8, 6, 0.82) !important;
      backdrop-filter: blur(5px) !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 16px;
    }
    .okh-modal-overlay.active, .okh-map-overlay.active {
      display: flex !important;
    }
    .okh-modal-box {
      position: relative;
      width: 100%;
      max-width: 600px;
      max-height: 88vh;
      background: radial-gradient(ellipse at 50% 0%, rgba(35, 27, 21, 0.99) 0%, rgba(16, 13, 10, 0.99) 100%);
      border: 1px solid var(--okh-border-gold);
      border-radius: 6px;
      padding: 20px 22px 18px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .okh-modal-close {
      position: absolute;
      top: 12px;
      right: 14px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 3px;
      width: 26px;
      height: 26px;
      color: var(--okh-gold-main);
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .okh-modal-close:hover {
      background: rgba(180, 50, 40, 0.8);
      color: #fff;
    }
    .okh-modal-title {
      font-family: "Cinzel", "Songti SC", "SimSun", serif;
      font-size: 16px;
      font-weight: 700;
      color: #fff4e0;
      margin-bottom: 2px;
    }
    .okh-modal-sub {
      font-size: 11px;
      color: var(--okh-gold-dim);
    }
    .okh-info-sec-title {
      font-size: 12px;
      font-weight: 700;
      color: #f7e6c4;
      margin: 12px 0 6px;
      border-bottom: 1px dashed rgba(195, 162, 108, 0.2);
      padding-bottom: 3px;
    }
    .okh-info-census-text {
      font-size: 12px;
      line-height: 1.6;
      color: #dfd4c5;
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

    /* 详情弹窗委任指令卡片 */
    .okh-actions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 14px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px dashed rgba(160, 132, 86, 0.25);
    }
    .okh-actions-badge {
      font-size: 10.5px;
      font-weight: 600;
      color: #dfc89a;
      background: rgba(28, 22, 16, 0.85);
      border: 1px solid rgba(195, 162, 108, 0.4);
      padding: 2px 7px;
      border-radius: 3px;
    }
    .okh-act-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 6px;
    }
    .okh-act-pill {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      text-align: left;
      background: linear-gradient(180deg, rgba(48, 36, 26, 0.92) 0%, rgba(30, 22, 16, 0.96) 100%);
      border: 1px solid rgba(212, 176, 111, 0.45);
      border-radius: 4px;
      padding: 12px 14px;
      transition: all 0.2s ease;
      cursor: pointer;
      outline: none;
      box-shadow: inset 0 1px 0 rgba(255, 235, 190, 0.12), 0 2px 6px rgba(0, 0, 0, 0.5);
    }
    .okh-act-pill:hover {
      background: linear-gradient(180deg, rgba(68, 50, 37, 0.98) 0%, rgba(45, 33, 24, 0.98) 100%);
      border-color: #f7e6c4;
      box-shadow: 0 0 14px rgba(223, 200, 154, 0.35);
      transform: translateY(-1px);
    }
    .okh-act-pill-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }
    .okh-act-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #fff6e5;
      letter-spacing: 0.5px;
    }
    .okh-act-desc {
      font-size: 11.5px;
      color: #e2d2be;
      line-height: 1.5;
    }
    .okh-act-pill-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      gap: 6px;
      flex-shrink: 0;
      margin-left: 16px;
    }
    .okh-act-cost {
      font-size: 11px;
      color: #e5cca0;
      font-weight: 500;
      white-space: nowrap;
    }
    .okh-act-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      color: #1a1209;
      background: linear-gradient(180deg, #fcebc7 0%, #d4b06f 100%);
      border: 1px solid #fff5dc;
      border-radius: 3px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
      white-space: nowrap;
      letter-spacing: 0.5px;
    }
    .okh-act-pill:hover .okh-act-badge {
      background: linear-gradient(180deg, #ffffff 0%, #e6c484 100%);
      color: #0d0804;
    }

    /* 日历与地图模态框 */
    .okh-calendar-box, .okh-map-box {
      position: relative;
      width: 100%;
      max-width: 680px;
      max-height: 88vh;
      background: radial-gradient(ellipse at 50% 0%, rgba(35, 27, 21, 0.99) 0%, rgba(16, 13, 10, 0.99) 100%);
      border: 1px solid var(--okh-border-gold);
      border-radius: 6px;
      padding: 20px 22px 18px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .okh-calendar-header, .okh-map-header {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px dashed rgba(195, 162, 108, 0.3);
    }
    .okh-calendar-title, .okh-map-title {
      font-family: "Cinzel", "Songti SC", "SimSun", serif;
      font-size: 16px;
      font-weight: 700;
      color: #fff4e0;
    }
    .okh-calendar-sub, .okh-map-sub {
      font-size: 11px;
      color: var(--okh-gold-dim);
    }
    .okh-cal-days-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }
    .okh-day-cell {
      background: rgba(28, 22, 17, 0.85);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 3px;
      padding: 6px 2px;
      cursor: pointer;
      color: var(--okh-gold-dim);
      font-family: inherit;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      transition: all 0.2s;
    }
    .okh-day-cell:hover {
      background: rgba(45, 35, 27, 0.95);
      border-color: var(--okh-border-gold);
    }
    .okh-day-cell.active {
      background: rgba(195, 162, 108, 0.25);
      border-color: #f7e6c4;
      color: #fff6e5;
      font-weight: bold;
    }
    .okh-day-cell.today-cell {
      box-shadow: 0 0 6px rgba(223, 200, 154, 0.4);
    }
    .okh-cal-detail-box {
      background: rgba(16, 12, 9, 0.85);
      border: 1px solid var(--okh-border-subtle);
      border-radius: 4px;
      padding: 12px 14px;
    }
    .okh-cal-detail-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #fff4e0;
      margin-bottom: 4px;
    }
    .okh-cal-detail-meta {
      font-size: 11px;
      color: var(--okh-gold-dim);
      margin-bottom: 10px;
    }
    .okh-cal-tasks-list, .okh-cal-events-list {
      list-style: none;
      font-size: 12px;
      color: #ded3c5;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .okh-cal-summary-box {
      font-size: 11.5px;
      color: var(--okh-gold-main);
      background: rgba(195, 162, 108, 0.08);
      padding: 8px 10px;
      border-radius: 3px;
    }

    /* 地图弹窗内容 */
    .okh-map-body {
      background: #0f0c0a;
      border: 1px dashed var(--okh-border-subtle);
      border-radius: 4px;
      padding: 24px;
      text-align: center;
      color: var(--okh-gold-dim);
    }
    .okh-map-body img {
      max-width: 100%;
      height: auto;
      border-radius: 3px;
      display: none;
    }
  </style>
</head>
<body>

  <!-- 顶部演示控制栏 -->
  <div class="okh-demo-toolbar">
    <span>💡 西幻跑团手札：黑金古籍装帧 · 双模视图切换 · 名册层级收整 · 选项直填输入栏</span>
    <div class="okh-demo-btns">
      <button class="okh-demo-btn" onclick="toggleConditions()">切换事件门槛（当前：已满足）</button>
      <button class="okh-demo-btn" onclick="toggleImages()">切换图包状态（当前：符文占位）</button>
      <button class="okh-demo-btn" onclick="toggleMapImage()">切换地图图片（当前：占位状态）</button>
    </div>
  </div>

  <!-- 主手札框架 (外框细线，靠间距与分隔线区分) -->
  <div class="okh-hud-frame">
    
    <!-- 顶部微型星纹装饰 (压缩高度至 14px) -->
    <div class="okh-crest-header">
      <div class="okh-crest-line"></div>
      <div class="okh-crest-diamond">◈ OAKHAVEN ◈</div>
      <div class="okh-crest-line"></div>
    </div>

    <!-- 顶层高聚合状态栏 (时间、地点、金币、地图) -->
    <div class="okh-top-bar">
      <div class="okh-top-left">
        <!-- 时间与历程 -->
        <button class="okh-pill-time" onclick="openCalendarModal()" title="点击展开探险历程与战役编年日历">
          <span class="okh-icon-gold">⏱</span>
          <span class="okh-time-day">第 16 天 · 上午 10:00</span>
          <span class="okh-time-wk">(周二)</span>
          <span class="okh-pill-tag">历程</span>
        </button>
        <!-- 坐标 -->
        <div class="okh-pill-loc">
          <span class="okh-icon-gold">⚲</span>
          <span>中央集市大道</span>
        </div>
      </div>

      <div class="okh-top-right">
        <!-- 财富 -->
        <div class="okh-pill-gold">
          <span class="okh-icon-gold">¤</span>
          <span class="okh-gold-num">390 金</span>
        </div>
        <!-- 地图 -->
        <button class="okh-pill-map" onclick="openMapModal()" title="点击展开全域地图">
          <span class="okh-icon-gold">▤</span>
          <span>地图</span>
        </button>
      </div>
    </div>

    <!-- 次级行：双模式切换胶囊与同行在场提示 -->
    <div class="okh-sub-bar">
      <div class="okh-view-toggle">
        <button class="okh-toggle-btn active" id="btn-mode-journal" onclick="switchViewMode('journal')">
          <span class="okh-toggle-mark">◈</span> 旅途手札 <span class="okh-rec-tag">推荐</span>
        </button>
        <button class="okh-toggle-btn" id="btn-mode-roster" onclick="switchViewMode('roster')">
          <span class="okh-toggle-mark">◈</span> 公会名册
        </button>
      </div>
      <div class="okh-presence-hint">
        <span class="okh-presence-dot"></span>
        <span>同行在场：爱德 (随行指引)、伊丝娜 (市街探哨)</span>
      </div>
    </div>

    <!-- ============================================================
         模式一：旅途手札视图 (突出当前委托，阅读负担最小，手机体验最佳)
         ============================================================ -->
    <div class="okh-journal-view" id="view-journal">
      
      <!-- 核心主角：当前待决委托卡片 -->
      <div class="okh-quest-card" id="pending-section">
        <div class="okh-quest-head">
          <div class="okh-quest-title-wrap">
            <div class="okh-quest-prefix">待决委托 · 公会敕令</div>
            <div class="okh-quest-name">银月珠宝铺 · 探查真相</div>
          </div>
          <!-- 唯一高权重图章：暗红公会蜡封 -->
          <div class="okh-quest-seal-slot">
            <img src="${waxSealSrc}" class="okh-wax-seal-img" title="公会待决敕令火漆印章" alt="待决印章">
          </div>
        </div>

        <!-- 剧情叙述 (清晰常规正文字体，无粗描边重阴影，隐藏内部代码字段) -->
        <div class="okh-quest-story">
          街角茶棚的长凳旁，爱德双手紧紧绞着衣角，低着头停下了脚步。男孩眼圈泛红，仰起清瘦的小脸，声音带着难掩的急切与恳求：“{{user}}哥哥，这几天我一闭上眼就是姐姐在橱窗后面的样子……姐姐从小最护着我，铺子也是爹娘留下的，就算舅舅抢了账本，姐姐也绝不可能甘心留下来替他算账。我想求求大家帮帮我，进店去见见姐姐，从姐姐口中得知真相！”
        </div>

        <!-- 决断选项按钮 -->
        <div class="okh-quest-options">
          <button class="okh-opt-btn" onclick="pickOutcomeDirect('probe_direct_mention', '直接提及爱德下落，开门见山探问隐情')">
            <span class="okh-opt-text">直接提及爱德下落，开门见山探问隐情</span>
            <span class="okh-opt-badge">[开门见山]</span>
          </button>
          <button class="okh-opt-btn" onclick="pickOutcomeDirect('probe_inquire_debt', '借由选购宝石切入，探问铺面债务与席德掌权内幕')">
            <span class="okh-opt-text">借由选购宝石切入，探问铺面债务与席德掌权内幕</span>
            <span class="okh-opt-badge">[借商探实]</span>
          </button>
        </div>
      </div>

      <!-- 伴随区：同行小队名册 (名册式排列，终结 2x2+1 失衡方块) -->
      <div class="okh-roster-section">
        <div class="okh-roster-head">
          <div class="okh-roster-title">
            <span class="okh-icon-gold">☵</span>
            <span>同行小队名册</span>
            <span class="okh-roster-count">5 位在册</span>
          </div>
          <span class="okh-roster-hint">点击条目查看伙伴详案与委任指令</span>
        </div>

        <div class="okh-roster-list">
          <!-- 1. 古兰 -->
          <div class="okh-roster-row" onclick="openCharModal('gulan')" title="点击查看古兰详情与委任">
            <div class="okh-r-left">
              <span class="okh-r-sigil">⚔</span>
              <span class="okh-r-name">古兰</span>
              <span class="okh-r-job">半龙人领队</span>
            </div>
            <div class="okh-r-mid">
              <span class="okh-r-loc-tag">练武场</span>
              <span class="okh-r-state-brief">执剑自省 · 挥剑打理随身重剑</span>
            </div>
            <div class="okh-r-right">
              <div class="okh-r-bond">亲密 88</div>
              <span class="okh-r-arrow">›</span>
            </div>
          </div>

          <!-- 2. 伊丝娜 -->
          <div class="okh-roster-row" onclick="openCharModal('isna')" title="点击查看伊丝娜详情与委任">
            <div class="okh-r-left">
              <span class="okh-r-sigil">🗡</span>
              <span class="okh-r-name">伊丝娜</span>
              <span class="okh-r-job">猫耳斥候</span>
            </div>
            <div class="okh-r-mid">
              <span class="okh-r-loc-tag">镇上</span>
              <span class="okh-r-state-brief">市井警醒 · 商业街拐角打听私活行情</span>
            </div>
            <div class="okh-r-right">
              <div class="okh-r-bond">友好 72</div>
              <span class="okh-r-arrow">›</span>
            </div>
          </div>

          <!-- 3. 妮丝 -->
          <div class="okh-roster-row" onclick="openCharModal('nise')" title="点击查看妮丝详情与委任">
            <div class="okh-r-left">
              <span class="okh-r-sigil">✧</span>
              <span class="okh-r-name">妮丝</span>
              <span class="okh-r-job">见习法师</span>
            </div>
            <div class="okh-r-mid">
              <span class="okh-r-loc-tag">旅店客房</span>
              <span class="okh-r-state-brief">新奇见闻 · 整理新奇矿石与笔记</span>
            </div>
            <div class="okh-r-right">
              <div class="okh-r-bond" style="color:var(--okh-accent-pink);">爱恋 92</div>
              <span class="okh-r-arrow">›</span>
            </div>
          </div>

          <!-- 4. 奥萝拉 -->
          <div class="okh-roster-row" onclick="openCharModal('aurora')" title="点击查看奥萝拉详情与委任">
            <div class="okh-r-left">
              <span class="okh-r-sigil">†</span>
              <span class="okh-r-name">奥萝拉</span>
              <span class="okh-r-job">见习牧师</span>
            </div>
            <div class="okh-r-mid">
              <span class="okh-r-loc-tag">领主山庄</span>
              <span class="okh-r-state-brief">温婉虔诚 · 执仆役女仆差事</span>
            </div>
            <div class="okh-r-right">
              <div class="okh-r-bond">友好 65</div>
              <span class="okh-r-arrow">›</span>
            </div>
          </div>

          <!-- 5. 爱德 (整齐纳入名册，彻底解决单占半行缺陷) -->
          <div class="okh-roster-row" onclick="openCharModal('ed')" title="点击查看爱德详情与日常委任">
            <div class="okh-r-left">
              <span class="okh-r-sigil">🪶</span>
              <span class="okh-r-name">爱德</span>
              <span class="okh-r-job">随行后勤</span>
            </div>
            <div class="okh-r-mid">
              <span class="okh-r-loc-tag" style="color:#85d298; border-color:rgba(90,138,104,0.4);">同行在场</span>
              <span class="okh-r-state-brief">银月珠宝铺支线 · 探知借据伪造真相中</span>
            </div>
            <div class="okh-r-right">
              <div class="okh-r-bond" style="color:#85d298;">效能 100</div>
              <span class="okh-r-arrow">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================
         模式二：公会名册视图 (突出队友卡片，适合全面审视队伍)
         ============================================================ -->
    <div class="okh-roster-view" id="view-roster">
      <div class="okh-cards-grid">
        <!-- 古兰 -->
        <div class="okh-guild-card" onclick="openCharModal('gulan')">
          <div class="okh-g-left">
            <div class="okh-g-badge-sigil">⚔</div>
            <div>
              <div class="okh-g-info-title">古兰</div>
              <div class="okh-g-info-sub">半龙人领队 · 练武场</div>
            </div>
          </div>
          <div class="okh-g-mid">
            <div class="okh-g-quote">“威严端庄 · 执剑自省”</div>
          </div>
          <div class="okh-g-right">
            <div style="font-size:11px; font-weight:600; color:var(--okh-gold-main);">亲密 88</div>
            <div class="okh-gauge-mini"><div class="okh-gauge-mini-fill" style="width:88%;"></div></div>
          </div>
        </div>

        <!-- 伊丝娜 -->
        <div class="okh-guild-card" onclick="openCharModal('isna')">
          <div class="okh-g-left">
            <div class="okh-g-badge-sigil">🗡</div>
            <div>
              <div class="okh-g-info-title">伊丝娜</div>
              <div class="okh-g-info-sub">猫耳斥候 · 商业街拐角</div>
            </div>
          </div>
          <div class="okh-g-mid">
            <div class="okh-g-quote">“市井警醒 · 灵动敏锐”</div>
          </div>
          <div class="okh-g-right">
            <div style="font-size:11px; font-weight:600; color:var(--okh-gold-main);">友好 72</div>
            <div class="okh-gauge-mini"><div class="okh-gauge-mini-fill" style="width:72%;"></div></div>
          </div>
        </div>

        <!-- 妮丝 -->
        <div class="okh-guild-card" onclick="openCharModal('nise')">
          <div class="okh-g-left">
            <div class="okh-g-badge-sigil">✧</div>
            <div>
              <div class="okh-g-info-title">妮丝</div>
              <div class="okh-g-info-sub">见习法师 · 旅店客房</div>
            </div>
          </div>
          <div class="okh-g-mid">
            <div class="okh-g-quote">“骄傲依恋 · 见闻新奇”</div>
          </div>
          <div class="okh-g-right">
            <div style="font-size:11px; font-weight:600; color:var(--okh-accent-pink);">爱恋 92</div>
            <div class="okh-gauge-mini"><div class="okh-gauge-mini-fill" style="width:92%; background:linear-gradient(90deg, #993d54, #ff859d);"></div></div>
          </div>
        </div>

        <!-- 奥萝拉 -->
        <div class="okh-guild-card" onclick="openCharModal('aurora')">
          <div class="okh-g-left">
            <div class="okh-g-badge-sigil">†</div>
            <div>
              <div class="okh-g-info-title">奥萝拉</div>
              <div class="okh-g-info-sub">见习牧师 · 领主山庄</div>
            </div>
          </div>
          <div class="okh-g-mid">
            <div class="okh-g-quote">“温婉隐忍 · 虔诚负重”</div>
          </div>
          <div class="okh-g-right">
            <div style="font-size:11px; font-weight:600; color:var(--okh-gold-main);">友好 65</div>
            <div class="okh-gauge-mini"><div class="okh-gauge-mini-fill" style="width:65%;"></div></div>
          </div>
        </div>

        <!-- 爱德 -->
        <div class="okh-guild-card" onclick="openCharModal('ed')">
          <div class="okh-g-left">
            <div class="okh-g-badge-sigil" style="color:#85d298; border-color:rgba(90,138,104,0.4);">🪶</div>
            <div>
              <div class="okh-g-info-title">爱德</div>
              <div class="okh-g-info-sub">随行后勤 · 同行在场</div>
            </div>
          </div>
          <div class="okh-g-mid">
            <div class="okh-g-quote">“救回姐姐爱丽丝 · 不给队伍添负担”</div>
          </div>
          <div class="okh-g-right">
            <div style="font-size:11px; font-weight:600; color:#85d298;">效能 100</div>
            <div class="okh-gauge-mini"><div class="okh-gauge-mini-fill" style="width:100%; background:linear-gradient(90deg, #4d825c, #85d298);"></div></div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- 酒馆玩家输入栏模拟区 -->
  <div class="okh-tavern-chat-dock">
    <div class="okh-dock-header">
      <span>💬 <strong>酒馆玩家输入栏</strong>（点击上方待决选项直填输入框）</span>
      <span class="okh-dock-badge" id="dock-status-badge">等待选择指令</span>
    </div>
    <div class="okh-input-wrap">
      <textarea id="tavern-input" class="okh-tavern-textarea" placeholder="在此输入给角色的回复，或点击上方选项直接填入指令..."></textarea>
      <button class="okh-tavern-send-btn" onclick="sendPlayerAction()">发送<br>指令</button>
    </div>
  </div>

  <!-- 模态框：伙伴详细档案与委任指令 -->
  <div id="char-modal" class="okh-modal-overlay" onclick="handleOverlayClick(event)">
    <div class="okh-modal-box">
      <button class="okh-modal-close" onclick="closeCharModal()" title="关闭弹窗 (ESC)">✕</button>

      <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed rgba(195,162,108,0.25);">
        <div class="okh-modal-title" id="m-char-fullname">爱德 · 高夫 (Ed Goff)</div>
        <div class="okh-modal-sub" id="m-char-sub">随行后勤伙伴 · 银月珠宝铺学徒</div>
      </div>

      <div style="font-size:11px; color:var(--okh-gold-dim); margin-bottom:8px;" id="m-portrait-badge">位阶：I · 见习凡俗阶（普通人类幼童）</div>

      <div class="okh-info-sec-title">📜 伙伴履历与身世</div>
      <div class="okh-info-census-text" id="m-info-census">
        8岁，身形单薄清瘦，穿着改短的粗麻旧布衣，腰扎麻绳。父母遇魔物遇难后被小队救起，表舅席德借伪造借据霸占珠宝铺并将年幼的爱德逐出街头。爱德折返旅店投奔小队，以勤勉懂事报恩。
      </div>

      <div class="okh-info-sec-title">⚖️ 状态指标与当前驻留</div>
      <div id="m-info-metrics"></div>

      <div class="okh-actions-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>📜 可执行日常交互与委任指令</span>
          <span style="font-size: 10px; color: var(--okh-gold-dim); font-weight: normal;">(点击直填输入栏，由您发送推进)</span>
        </div>
        <span class="okh-actions-badge" id="m-act-count-badge">5 项行动就绪</span>
      </div>

      <div class="okh-act-grid" id="m-actions-list"></div>
    </div>
  </div>

  <!-- 模态框：战役历程日历 -->
  <div id="calendar-modal" class="okh-modal-overlay" onclick="handleCalendarOverlayClick(event)">
    <div class="okh-calendar-box">
      <button class="okh-modal-close" onclick="closeCalendarModal()" title="关闭日历 (ESC)">✕</button>

      <div class="okh-calendar-header">
        <div class="okh-calendar-title">◈ 奥克赫斯征程 · 战役历法与行动手札 ◈</div>
        <div class="okh-calendar-sub">当前：第 16 天 · 上午（周二）10:00 · 点击左侧日期查阅当日任务接取与历史事件</div>
      </div>

      <div class="okh-cal-days-grid" id="cal-days-grid"></div>
      <div class="okh-cal-detail-box" id="cal-detail-box"></div>
    </div>
  </div>

  <!-- 模态框：地图 -->
  <div id="map-modal" class="okh-map-overlay" onclick="handleMapOverlayClick(event)">
    <div class="okh-map-box">
      <button class="okh-modal-close" onclick="closeMapModal()" title="关闭地图 (ESC)">✕</button>

      <div class="okh-map-header">
        <div class="okh-map-title">◈ 奥克赫斯城镇与周边全域地图 ◈</div>
        <div class="okh-map-sub">区域空间态势与周边要道</div>
      </div>

      <div class="okh-map-body" id="map-body-content">
        <div id="map-placeholder-text">
          <p style="margin-bottom:8px;">❖ 奥克赫斯疆域 · 区域空间地图 ❖</p>
          <p style="font-size:11px; color:var(--okh-text-muted);">路径预留：assets/maps/world_map.png（图包占位等待具体图片）</p>
          <p style="font-size:10.5px; color:var(--okh-gold-dim); margin-top:8px;">◈ 奥克赫斯全域疆界 · 测绘画卷 ◈ 战役地图插槽：已预留 assets/maps/world_map.png</p>
          <p style="font-size:10px; color:var(--okh-gold-dim); margin-top:4px;">✦ 罗盘刻度就绪 · 待图包图片载入后在此全幅平铺展现</p>
        </div>
        <img id="map-img-element" src="assets/maps/world_map.png" alt="奥克赫斯城镇全域地图" onerror="handleMapImgError(this)">
      </div>
    </div>
  </div>

  <script>
    let currentViewMode = 'journal'; // 默认旅途手札模式
    let imagesLoaded = false;
    let mapImageLoaded = false;
    let conditionsMet = true;

    // 视图切换函数
    function switchViewMode(mode) {
      currentViewMode = mode;
      const viewJournal = document.getElementById('view-journal');
      const viewRoster = document.getElementById('view-roster');
      const btnJournal = document.getElementById('btn-mode-journal');
      const btnRoster = document.getElementById('btn-mode-roster');

      if (mode === 'journal') {
        viewJournal.style.display = 'block';
        viewRoster.style.display = 'none';
        btnJournal.classList.add('active');
        btnRoster.classList.remove('active');
      } else {
        viewJournal.style.display = 'none';
        viewRoster.style.display = 'block';
        btnJournal.classList.remove('active');
        btnRoster.classList.add('active');
      }
    }

    // 演示工具
    function toggleConditions() {
      conditionsMet = !conditionsMet;
      const btn = event.target;
      const pendingSec = document.getElementById('pending-section');
      if (conditionsMet) {
        btn.textContent = '切换事件门槛（当前：已满足）';
        if (pendingSec) pendingSec.style.display = 'block';
      } else {
        btn.textContent = '切换事件门槛（当前：未满足 · 隐藏）';
        if (pendingSec) pendingSec.style.display = 'none';
      }
    }

    function toggleImages() {
      imagesLoaded = !imagesLoaded;
      event.target.textContent = imagesLoaded ? '切换图包状态（当前：真机图片）' : '切换图包状态（当前：符文占位）';
    }

    function toggleMapImage() {
      mapImageLoaded = !mapImageLoaded;
      event.target.textContent = mapImageLoaded ? '切换地图图片（当前：真实地图载入）' : '切换地图图片（当前：占位状态）';
      const mapImg = document.getElementById('map-img-element');
      const mapPlaceholder = document.getElementById('map-placeholder-text');
      if (mapImageLoaded) {
        mapImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%231a1512"/><path d="M50 80 Q 200 40 350 100 T 550 80" stroke="%23dfc89a" stroke-width="2" fill="none" opacity="0.6"/><circle cx="200" cy="180" r="16" fill="%2368ad7c" opacity="0.4"/><text x="200" y="185" font-family="Cinzel,serif" font-size="12" fill="%23f5eedf" text-anchor="middle">中央集市大道</text><circle cx="420" cy="120" r="14" fill="%23466e99" opacity="0.4"/><text x="420" y="125" font-family="Cinzel,serif" font-size="11" fill="%23f5eedf" text-anchor="middle">领主山庄</text><circle cx="120" cy="240" r="12" fill="%23e05e5e" opacity="0.4"/><text x="120" y="245" font-family="Cinzel,serif" font-size="10" fill="%23f5eedf" text-anchor="middle">露天练武场</text></svg>';
        mapImg.style.display = 'block';
        mapPlaceholder.style.display = 'none';
      } else {
        mapImg.style.display = 'none';
        mapPlaceholder.style.display = 'block';
      }
    }

    function handleMapImgError(img) {
      img.style.display = 'none';
      document.getElementById('map-placeholder-text').style.display = 'block';
    }

    // 跨环境通用获取酒馆/预览输入框
    function getTavernInput() {
      return document.getElementById('send_textarea') || 
             document.getElementById('tavern-input') || 
             document.querySelector('textarea#send_textarea') ||
             document.querySelector('.chat_input textarea') ||
             document.querySelector('textarea');
    }

    // 核心交互：点击待决事件策略，直填规范回执代码
    function pickOutcomeDirect(code, label) {
      const inputEl = getTavernInput();
      if (inputEl) {
        inputEl.value = \`<event_resolve id="ed_investigate_truth" outcome="\${code}" />\`;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const badge = document.getElementById('dock-status-badge');
      if (badge) badge.textContent = \`已填入：\${label}\`;
    }

    // 核心交互：点击角色日常/委任指令，直填规范动作标签并自动关闭模态弹窗
    function pickActionDirect(inputText, title) {
      const inputEl = getTavernInput();
      if (inputEl) {
        inputEl.value = inputText;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const badge = document.getElementById('dock-status-badge');
      if (badge) badge.textContent = \`已填入：\${title}\`;
      closeCharModal();
    }

    function selectCharAction(act) {
      if (!act) return;
      const text = act.inputText || \`<action id="\${act.code || act.id}" />\`;
      pickActionDirect(text, act.title || '委任行动');
    }

    function sendPlayerAction() {
      const inputEl = getTavernInput();
      if (!inputEl || !inputEl.value.trim()) return;
      alert('【已模拟向状态机发送】：\\n' + inputEl.value);
      inputEl.value = '';
      const badge = document.getElementById('dock-status-badge');
      if (badge) badge.textContent = '等待选择指令';
    }

    function openMapModal() {
      document.getElementById('map-modal').classList.add('active');
    }
    function closeMapModal() {
      document.getElementById('map-modal').classList.remove('active');
    }
    function handleMapOverlayClick(event) {
      if (event.target.id === 'map-modal') closeMapModal();
    }

    ${charRosterCode}

    ${calHistoryCode}

    function openCalendarModal() {
      renderCalendarDays();
      selectCalendarDay(16);
      document.getElementById('calendar-modal').classList.add('active');
    }

    function closeCalendarModal() {
      const modal = document.getElementById('calendar-modal');
      if (modal) modal.classList.remove('active');
    }

    function handleCalendarOverlayClick(event) {
      if (event.target.id === 'calendar-modal') closeCalendarModal();
    }

    function renderCalendarDays() {
      const grid = document.getElementById('cal-days-grid');
      if (!grid) return;
      grid.innerHTML = '';

      for (let d = 1; d <= 16; d++) {
        const h = CALENDAR_HISTORY[d];
        const btn = document.createElement('button');
        btn.className = 'okh-day-cell' + (d === 16 ? ' active today-cell' : '');
        btn.onclick = () => selectCalendarDay(d);
        btn.innerHTML = \`
          <span>第\${d}天</span>
          <span style="font-size:9.5px; opacity:0.8;">\${h ? h.weekday : ''}</span>
        \`;
        grid.appendChild(btn);
      }
    }

    function selectCalendarDay(dayNum) {
      const h = CALENDAR_HISTORY[dayNum];
      if (!h) return;

      const cells = document.querySelectorAll('.okh-day-cell');
      cells.forEach((cell, idx) => {
        if (idx + 1 === dayNum) cell.classList.add('active');
        else cell.classList.remove('active');
      });

      const detail = document.getElementById('cal-detail-box');
      if (!detail) return;

      let tasksHTML = '';
      if (h.tasks && h.tasks.length > 0) {
        tasksHTML = h.tasks.map(t => \`
          <li style="margin-bottom:4px;">
            <span style="color:\${t.type === 'pending' ? 'var(--okh-gold-main)' : 'var(--okh-accent-green)'}">[\${t.status}]</span>
            <strong>\${t.name}</strong>
            <span style="color:var(--okh-gold-dim); font-size:11px;">(报酬: \${t.reward})</span>
          </li>
        \`).join('');
      } else {
        tasksHTML = '<li style="color:var(--okh-gold-dim);">无特定任务接取记录</li>';
      }

      let eventsHTML = '';
      if (h.events && h.events.length > 0) {
        eventsHTML = h.events.map(e => \`<li style="margin-bottom:3px;">◈ \${e}</li>\`).join('');
      } else {
        eventsHTML = '<li style="color:var(--okh-gold-dim);">日常驻留与休整</li>';
      }

      detail.innerHTML = \`
        <div class="okh-cal-detail-title">第 \${dayNum} 天 · \${h.title}</div>
        <div class="okh-cal-detail-meta">历法：\${h.weekday} · \${h.phase}</div>
        <div style="font-weight:700; font-size:12px; color:#f7e6c4; margin-bottom:4px;">📜 当日任务接取与结算：</div>
        <ul class="okh-cal-tasks-list">\${tasksHTML}</ul>
        <div style="font-weight:700; font-size:12px; color:#f7e6c4; margin-bottom:4px;">◈ 关键历史事件志：</div>
        <ul class="okh-cal-events-list">\${eventsHTML}</ul>
        <div class="okh-cal-summary-box">
          <strong>✦ 历程小结：</strong>\${h.summary}
        </div>
      \`;
    }

    function openCharModal(charId) {
      const char = CHAR_ROSTER[charId];
      if (!char) return;

      document.getElementById('m-char-fullname').textContent = char.fullname;
      document.getElementById('m-char-sub').textContent = char.subtitle;
      document.getElementById('m-portrait-badge').textContent = char.badge;

      document.getElementById('m-info-census').textContent = char.census;

      const metricsBox = document.getElementById('m-info-metrics');
      metricsBox.innerHTML = '';
      char.metrics.forEach(m => {
        const row = document.createElement('div');
        row.className = 'okh-info-metric-row';
        row.innerHTML = '<span class="okh-metric-label">' + m.label + '：</span><span class="okh-info-metric-val">' + m.val + '</span>';
        metricsBox.appendChild(row);
      });

      const actList = document.getElementById('m-actions-list');
      actList.innerHTML = '';
      document.getElementById('m-act-count-badge').textContent = char.actions.length + ' 项行动就绪';

      char.actions.forEach(act => {
        const btn = document.createElement('button');
        btn.className = 'okh-act-pill';
        btn.onclick = () => pickActionDirect(act.inputText, act.title);
        btn.innerHTML =
          '<div class="okh-act-pill-left">' +
            '<div class="okh-act-title">✦ ' + act.title + '</div>' +
            '<div class="okh-act-desc">' + act.desc + '</div>' +
          '</div>' +
          '<div class="okh-act-pill-right">' +
            '<span class="okh-act-cost">' + act.cost + '</span>' +
            '<span class="okh-act-badge">点击委任</span>' +
          '</div>';
        actList.appendChild(btn);
      });

      document.getElementById('char-modal').classList.add('active');
    }

    function closeCharModal() {
      const modal = document.getElementById('char-modal');
      if (modal) modal.classList.remove('active');
    }

    function handleOverlayClick(event) {
      if (event.target.id === 'char-modal') closeCharModal();
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeCalendarModal();
        closeCharModal();
        closeMapModal();
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('预览_状态栏样式.html', newHtml, 'utf8');
console.log('Successfully written new 预览_状态栏样式.html');

const artifactPath = path.join('C:', 'Users', '11944', '.gemini', 'antigravity', 'brain', '1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f', 'status_bar_preview.html');
if (fs.existsSync(artifactPath)) {
  fs.writeFileSync(artifactPath, newHtml, 'utf8');
  console.log('Successfully updated status_bar_preview.html in brain artifacts');
}
