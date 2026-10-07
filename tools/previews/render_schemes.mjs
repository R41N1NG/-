import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\11944\\.gemini\\antigravity\\brain\\f8b12835-bb32-4c01-9ea6-a49b4e7373e1';
if (!existsSync(ARTIFACT_DIR)) mkdirSync(ARTIFACT_DIR, { recursive: true });

const relicData = JSON.parse(readFileSync('src/assets_data/_relics_embed.json', 'utf8'));
const relicImg1 = relicData['zhuojiuliuyanxue'];
const relicImg2 = relicData['jiuyouxuanyinxue'];

// ==========================================
// 方案 A: 悬停浮层气泡 (Hover Floating Card)
// ==========================================
const htmlSchemeA = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0f1115;
    color: #e0d8c3;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    padding: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
  .preview-wrapper {
    width: 1000px;
    background: #14171d;
    border: 1px solid rgba(212,175,55,0.25);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    position: relative;
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(212,175,55,0.15);
    padding-bottom: 14px;
    margin-bottom: 20px;
  }
  .panel-title {
    font-size: 16px;
    font-weight: bold;
    color: #ffd700;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .panel-sub {
    font-size: 12px;
    color: #8c8273;
  }
  
  /* 状态栏模拟主体 */
  .hud-body {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }
  
  /* 左侧名器纹章栏 */
  .rail {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    position: relative;
  }
  .rail-label {
    font-size: 11px;
    color: #d4af37;
    text-align: center;
    writing-mode: vertical-lr;
    letter-spacing: 2px;
    margin-bottom: 4px;
    opacity: 0.8;
  }
  
  /* 单个纹章 */
  .relic-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    position: relative;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
  }
  .relic-btn.active {
    border: 2px solid #ffd700;
    box-shadow: 0 0 14px rgba(255,215,0,0.4);
  }
  .relic-btn.other {
    border: 2px solid #e05252;
    box-shadow: 0 0 14px rgba(224,82,82,0.4);
  }
  .relic-btn.none {
    border: 1px solid #444;
    opacity: 0.4;
  }
  .relic-icon {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
  }
  
  /* 状态栏中轴内容区 */
  .hud-main {
    flex: 1;
    background: rgba(22, 25, 32, 0.7);
    border: 1px solid rgba(212,175,55,0.15);
    border-radius: 8px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .info-row {
    display: flex;
    gap: 16px;
    font-size: 13px;
  }
  .info-tag {
    color: #a89f91;
    display: flex;
    gap: 6px;
  }
  .info-tag b { color: #d4af37; }
  .char-block {
    background: rgba(0,0,0,0.25);
    border-left: 3px solid #d4af37;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
  }
  .char-name { font-size: 14px; font-weight: bold; color: #ffd700; margin-bottom: 4px; }
  .char-desc { font-size: 12px; color: #b0a695; line-height: 1.5; }

  /* 方案 A 悬停浮层卡片 (Hover Popover) */
  .hover-popover {
    position: absolute;
    top: 50px;
    left: 75px;
    width: 360px;
    background: linear-gradient(165deg, rgba(26,29,38,0.98), rgba(16,18,24,0.99));
    border: 1px solid #d4af37;
    border-radius: 10px;
    box-shadow: 0 12px 36px rgba(0,0,0,0.85), 0 0 20px rgba(212,175,55,0.25);
    padding: 16px 18px;
    z-index: 100;
    animation: popIn 0.2s ease-out;
  }
  /* 小三角指针 */
  .hover-popover::before {
    content: '';
    position: absolute;
    top: 18px;
    left: -7px;
    width: 12px;
    height: 12px;
    background: #1a1d26;
    border-left: 1px solid #d4af37;
    border-bottom: 1px solid #d4af37;
    transform: rotate(45deg);
  }

  .pop-header {
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid rgba(212,175,55,0.2);
    padding-bottom: 10px;
    margin-bottom: 12px;
  }
  .pop-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid #ffd700;
    box-shadow: 0 0 8px rgba(255,215,0,0.3);
    background-size: cover;
  }
  .pop-titles { flex: 1; }
  .pop-name { font-size: 15px; font-weight: bold; color: #ffd700; display: flex; align-items: center; justify-content: space-between; }
  .pop-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(212,175,55,0.15);
    color: #e5c158;
    border: 1px solid rgba(212,175,55,0.3);
  }
  .pop-owner {
    font-size: 12px;
    color: #4ade80;
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  /* 阶段指示器 */
  .pop-stages {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }
  .stage-bar {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,0.1);
  }
  .stage-bar.reached {
    background: linear-gradient(90deg, #d4af37, #ffd700);
    box-shadow: 0 0 6px rgba(255,215,0,0.5);
  }

  /* 当前阶段高亮内容卡 */
  .current-stage-card {
    background: rgba(212,175,55,0.06);
    border: 1px solid rgba(212,175,55,0.3);
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 10px;
  }
  .csc-title {
    font-size: 13px;
    font-weight: bold;
    color: #ffd700;
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .csc-text {
    font-size: 12px;
    color: #d1c7b7;
    line-height: 1.5;
  }
  .csc-highlight {
    color: #f6ad55;
    font-weight: 500;
  }

  /* 未解锁阶段简列 */
  .locked-stages {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-top: 1px dashed rgba(255,255,255,0.1);
    padding-top: 8px;
  }
  .locked-item {
    font-size: 11px;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pop-footer {
    margin-top: 10px;
    font-size: 11px;
    color: #8c8273;
    text-align: right;
    font-style: italic;
  }
</style>
</head>
<body>

<div class="preview-wrapper">
  <div class="panel-header">
    <div class="panel-title">
      <span>✦ 方案 A 效果样板：轻量悬停浮层气泡（Hover Floating Card）</span>
    </div>
    <div class="panel-sub">状态栏纹章交互 · 鼠标移入即显 · 随看随走</div>
  </div>

  <div class="hud-body">
    <!-- 纹章栏 -->
    <div class="rail">
      <div class="rail-label">名器纹章</div>
      
      <!-- 第一个纹章：灼酒流炎穴 (Hover状态) -->
      <div class="relic-btn active" id="btn-zhuojiu">
        <div class="relic-icon" style="background-image: url('${relicImg1}');"></div>
      </div>
      
      <!-- 第二个纹章：九幽玄阴穴 (被他人占据) -->
      <div class="relic-btn other">
        <div class="relic-icon" style="background-image: url('${relicImg2}'); filter: invert(1) contrast(1.15);"></div>
      </div>
      
      <!-- 其他未出世纹章 -->
      <div class="relic-btn none"><div class="relic-icon" style="background: #2a2a2a;"></div></div>
      <div class="relic-btn none"><div class="relic-icon" style="background: #2a2a2a;"></div></div>
      <div class="relic-btn none"><div class="relic-icon" style="background: #2a2a2a;"></div></div>

      <!-- 悬停弹出的浮层气泡 -->
      <div class="hover-popover">
        <div class="pop-header">
          <div class="pop-avatar" style="background-image: url('${relicImg1}');"></div>
          <div class="pop-titles">
            <div class="pop-name">
              <span>灼酒流炎穴</span>
              <span class="pop-badge">阴窍 · 炎姬</span>
            </div>
            <div class="pop-owner">
              <span>● 目前归属者：赵无忧（你 · 契约认主）</span>
            </div>
          </div>
        </div>

        <!-- 4阶进度条 -->
        <div class="pop-stages">
          <div class="stage-bar reached" title="一阶段"></div>
          <div class="stage-bar" title="二阶段"></div>
          <div class="stage-bar" title="三阶段"></div>
          <div class="stage-bar" title="四阶段"></div>
        </div>

        <!-- 当前一阶段精炼卡 -->
        <div class="current-stage-card">
          <div class="csc-title">
            <span>【第一阶段 · 成形初醒】</span>
            <span style="color:#4ade80;font-size:11px;">已激活</span>
          </div>
          <div class="csc-text">
            元阴初破，花宫化为灼热炎泉。<span class="csc-highlight">体泛浓醇烈酒之异香</span>，花径滚烫如沸、泌出温热酒露；初具强效吸附绞合异能，交合时令男子真元微醺、欲罢不能。
          </div>
        </div>

        <!-- 未解锁阶段提要 -->
        <div class="locked-stages">
          <div class="locked-item">
            <span>二阶段 · 情动道纹（火凤道纹）</span>
            <span>🔒 待解锁</span>
          </div>
          <div class="locked-item">
            <span>三阶段 · 孕乳灵泉（琥珀孕炎乳）</span>
            <span>🔒 待解锁</span>
          </div>
          <div class="locked-item">
            <span>四阶段 · 极乐焚天（百世炉鼎契约）</span>
            <span>🔒 待解锁</span>
          </div>
        </div>

        <div class="pop-footer">
          ※ 移开鼠标自动隐去 · 提示词无需载入千字冗文
        </div>
      </div>
    </div>

    <!-- 状态栏中间内容 -->
    <div class="hud-main">
      <div class="info-row">
        <div class="info-tag"><b>地点</b> 幽寂谷 · 隐秘灵洞</div>
        <div class="info-tag"><b>时辰</b> 暮春 · 戌时</div>
        <div class="info-tag"><b>自身身份</b> 墨山道六弟子 · 赵无忧</div>
      </div>
      <div class="char-block">
        <div class="char-name">叶红缨（大师姐 · 焚欲赤羽）</div>
        <div class="char-desc">
          香汗淋漓，双颊酡红如醉。初尝禁果后眉眼间凌厉褪去，微咬朱唇别过头去，花径内壁犹自带着初醒陈酿酒香阵阵悸动颤栗。
        </div>
      </div>
      <div class="info-row" style="margin-top: 6px;">
        <div class="info-tag"><b>当前气场</b> 浓郁酒香 · 灵欲交织</div>
        <div class="info-tag"><b>战局状态</b> 洞外妖兽渐息 · 暂得喘息</div>
      </div>
    </div>
  </div>
</div>

</body>
</html>`;

// ==========================================
// 方案 B: 点击弹窗全景图鉴 (Click Modal Album · 名器玄鉴)
// ==========================================
const htmlSchemeB = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #090a0d;
    color: #e0d8c3;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    padding: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
  
  /* 模拟全屏遮罩与居中弹窗 */
  .modal-overlay {
    width: 1080px;
    background: radial-gradient(circle at 50% 30%, rgba(28,32,44,0.98), rgba(12,13,18,0.99));
    border: 1px solid rgba(212,175,55,0.4);
    border-radius: 14px;
    padding: 28px 32px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(212,175,55,0.2);
    position: relative;
    overflow: hidden;
  }
  
  /* 背景流光法阵暗纹 */
  .modal-overlay::before {
    content: '';
    position: absolute;
    top: -150px;
    right: -150px;
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  /* 顶部玄鉴 Header */
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(212,175,55,0.25);
    padding-bottom: 18px;
    margin-bottom: 22px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .relic-big-emblem {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 2px solid #ffd700;
    box-shadow: 0 0 16px rgba(255,215,0,0.45);
    background-size: cover;
    background-position: center;
    position: relative;
  }
  .relic-big-emblem::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1px dashed rgba(212,175,55,0.5);
  }
  .title-group h1 {
    font-size: 20px;
    color: #ffd700;
    letter-spacing: 2px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .title-sub {
    font-size: 13px;
    color: #9e917d;
    margin-top: 4px;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .owner-stamp {
    padding: 6px 14px;
    border-radius: 20px;
    background: rgba(34,197,94,0.12);
    border: 1px solid rgba(34,197,94,0.4);
    color: #4ade80;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 0 10px rgba(34,197,94,0.15);
  }
  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.15);
    color: #b0a695;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
  }

  /* 名器横向标签页切换 (支持切换 13 个名器) */
  .relic-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding-bottom: 12px;
  }
  .relic-tab {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    color: #8c8273;
    background: rgba(0,0,0,0.3);
    border: 1px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .relic-tab.active {
    color: #ffd700;
    background: rgba(212,175,55,0.15);
    border-color: rgba(212,175,55,0.4);
    font-weight: bold;
  }
  .relic-tab.other-owned {
    color: #f87171;
    border-color: rgba(248,113,113,0.3);
  }

  /* 四阶段全景画卷网格 */
  .stages-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 22px;
  }
  
  /* 单个阶段画卷卡片 */
  .stage-column {
    background: rgba(18,21,28,0.7);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: all 0.2s ease;
  }
  
  /* 阶段一：已达成高亮 */
  .stage-column.unlocked {
    background: linear-gradient(170deg, rgba(38,34,22,0.85), rgba(20,23,30,0.95));
    border: 1px solid #d4af37;
    box-shadow: 0 4px 18px rgba(212,175,55,0.15);
  }
  .stage-column.unlocked::before {
    content: '已觉醒';
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 11px;
    color: #ffd700;
    background: rgba(212,175,55,0.2);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(212,175,55,0.3);
  }

  /* 阶段二/三/四：未解锁/封印 */
  .stage-column.locked {
    opacity: 0.7;
    background: rgba(15,17,22,0.6);
    border: 1px dashed rgba(255,255,255,0.12);
  }
  .stage-column.locked .stage-lock-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 11px;
    color: #6b7280;
    background: rgba(0,0,0,0.4);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .sc-header {
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .sc-badge {
    font-size: 11px;
    color: #d4af37;
    letter-spacing: 1px;
    margin-bottom: 4px;
    display: block;
  }
  .sc-title {
    font-size: 15px;
    font-weight: bold;
    color: #fff;
  }
  .stage-column.unlocked .sc-title { color: #ffd700; }

  .sc-section-title {
    font-size: 11px;
    color: #a89f91;
    margin-top: 10px;
    margin-bottom: 4px;
    font-weight: bold;
  }
  .sc-desc {
    font-size: 12px;
    color: #c4baa7;
    line-height: 1.6;
    flex: 1;
  }
  .sc-highlight {
    color: #f6ad55;
    font-weight: bold;
  }

  /* 封印卡底部的暗金锁链提示 */
  .lock-condition-box {
    margin-top: 12px;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.06);
    font-size: 11px;
    color: #887e6f;
  }
  .lock-condition-box b { color: #d4af37; }

  /* 底部性能与提示词减负对比条 */
  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(212,175,55,0.15);
    padding-top: 14px;
    font-size: 12px;
    color: #8c8273;
  }
  .perf-stat {
    display: flex;
    gap: 16px;
  }
  .perf-stat span b { color: #4ade80; }
</style>
</head>
<body>

<div class="modal-overlay">
  <!-- 弹窗顶栏 -->
  <div class="modal-header">
    <div class="header-left">
      <div class="relic-big-emblem" style="background-image: url('${relicImg1}');"></div>
      <div class="title-group">
        <h1>
          <span>仙姝墮 · 名器玄鉴</span>
          <span style="font-size: 14px; font-weight: normal; color: #d4af37; border: 1px solid rgba(212,175,55,0.3); padding: 2px 8px; border-radius: 4px;">玄牝至宝 · 阴窍绝品</span>
        </h1>
        <div class="title-sub">载体：叶红缨（赤羽焚天） · 原著第四十六章完全成形</div>
      </div>
    </div>
    <div class="header-right">
      <div class="owner-stamp">
        <span>✦ 目前烙印归属：赵无忧（你 · 契约认主）</span>
      </div>
      <div class="close-btn">✕</div>
    </div>
  </div>

  <!-- 名器快捷切换 -->
  <div class="relic-tabs">
    <div class="relic-tab active">● 灼酒流炎穴（一阶段 · 叶红缨）</div>
    <div class="relic-tab other-owned">● 九幽玄阴穴（已被残阳老怪占据 · 柳含烟）</div>
    <div class="relic-tab">○ 流烟蝶心穴（未出世）</div>
    <div class="relic-tab">○ 冰魄剑心穴（未出世）</div>
    <div class="relic-tab">○ 更多名器…</div>
  </div>

  <!-- 1-4 阶段全景网格 -->
  <div class="stages-grid">
    <!-- 一阶段：已解锁 -->
    <div class="stage-column unlocked">
      <div class="sc-header">
        <span class="sc-badge">第一境界</span>
        <div class="sc-title">初醒 · 烈酒生香</div>
      </div>
      <div class="sc-section-title">【花宫体征】</div>
      <div class="sc-desc">
        处子元阴破除，花宫化为灼热炎泉。<span class="sc-highlight">体泛浓醇陈酿酒香</span>，花径滚烫如沸水，分泌琥珀琼浆。
      </div>
      <div class="sc-section-title">【双修妙用】</div>
      <div class="sc-desc">
        初具吸附异能，交合时令男子真元微醺神迷，越战越勇，采补与反哺兼备。
      </div>
    </div>

    <!-- 二阶段：待解锁 (情动火凤) -->
    <div class="stage-column locked">
      <span class="stage-lock-badge">🔒 锁闭</span>
      <div class="sc-header">
        <span class="sc-badge">第二境界</span>
        <div class="sc-title">情动 · 火凤道纹</div>
      </div>
      <div class="sc-section-title">【神魂交融】</div>
      <div class="sc-desc">
        灵肉深度共鸣，<span class="sc-highlight">玉背浮现赤金火凤本命道纹</span>。花宫升腾岩浆烈火，千万火舌疯狂吮吸绞杀。
      </div>
      <div class="sc-section-title">【双修妙用】</div>
      <div class="sc-desc">
        双修速度倍增，酒香带极烈催情异力，反哺持有者纯阳真火，淬炼经脉肉身。
      </div>
      <div class="lock-condition-box">
        <b>解锁机缘：</b> 需双方情根深种、情欲与真元产生极致共鸣。
      </div>
    </div>

    <!-- 三阶段：待解锁 (孕炎乳) -->
    <div class="stage-column locked">
      <span class="stage-lock-badge">🔒 锁闭</span>
      <div class="sc-header">
        <span class="sc-badge">第三境界</span>
        <div class="sc-title">孕乳 · 琥珀灵泉</div>
      </div>
      <div class="sc-section-title">【双峰蜕变】</div>
      <div class="sc-desc">
        封元镇灵环脱落，双峰丰硕暴涨。<span class="sc-highlight">乳尖激射陈酿琥珀「孕炎乳」</span>，异香扑鼻、纯阳大补。
      </div>
      <div class="sc-section-title">【双修妙用】</div>
      <div class="sc-desc">
        服下灵乳可破金丹瓶颈、寿元暴涨，肉身脱胎换骨，彻底蜕变为绝世炉鼎圣体。
      </div>
      <div class="lock-condition-box">
        <b>解锁机缘：</b> 绝崖受制或深度采补，解除九幽寒铁镇灵环压制。
      </div>
    </div>

    <!-- 四阶段：待解锁 (极乐焚天) -->
    <div class="stage-column locked">
      <span class="stage-lock-badge">🔒 锁闭</span>
      <div class="sc-header">
        <span class="sc-badge">第四境界</span>
        <div class="sc-title">极乐 · 焚天鼎炉</div>
      </div>
      <div class="sc-section-title">【终极涅槃】</div>
      <div class="sc-desc">
        身心彻底沦为极乐之奴。<span class="sc-highlight">花核喷薄漫天炽烈金焰</span>，酒气化为七彩云霞，命格彻底相融。
      </div>
      <div class="sc-section-title">【双修妙用】</div>
      <div class="sc-desc">
        百世不可逆转，持有者与名器宿主命魂相通，元阳元阴同登极乐天道。
      </div>
      <div class="lock-condition-box">
        <b>解锁机缘：</b> 《极乐引》终极大成、心智姿态彻底烙印改写。
      </div>
    </div>
  </div>

  <!-- 底部减负统计与提示 -->
  <div class="modal-footer">
    <div class="perf-stat">
      <span>世界书架构：<b>48条阶段冗条并入玄鉴</b></span>
      <span>Prompt Token 减负：<b>约省 85% 上下文空间</b></span>
      <span>文风表现：<b>彻底杜绝长篇机械设定灌水</b></span>
    </div>
    <div>✦ 点击任意阶段可查看推演日志 · 按 ESC 或点击右上角关闭</div>
  </div>
</div>

</body>
</html>`;

// 写入临时 HTML
const fileA = resolve('tools/previews/preview_scheme_a.html');
const fileB = resolve('tools/previews/preview_scheme_b.html');
writeFileSync(fileA, htmlSchemeA, 'utf8');
writeFileSync(fileB, htmlSchemeB, 'utf8');

// 截图输出路径
const outImgA = join(ARTIFACT_DIR, 'relic_scheme_a_hover.png');
const outImgB = join(ARTIFACT_DIR, 'relic_scheme_b_modal.png');

console.log('正在使用 Chrome 无头模式生成高清效果样板图...');

// 截取方案 A
spawnSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1080,720',
  `--screenshot=${outImgA}`,
  fileA
]);
console.log('✔ 方案 A 样板图已生成:', outImgA);

// 截取方案 B
spawnSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1160,780',
  `--screenshot=${outImgB}`,
  fileB
]);
console.log('✔ 方案 B 样板图已生成:', outImgB);

// 同时生成一个可供用户在 Artifact 中直接切换试玩的单页 HTML
const interactiveHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
<title>仙姝墮 · 名器阶段纹章化改造样板对比</title>
</head>
<body class="bg-slate-950 text-amber-100 p-6 font-sans">
  <div class="max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-6 border-b border-amber-500/30 pb-4">
      <div>
        <h1 class="text-2xl font-bold text-amber-400">仙姝墮 · 名器 1-4 阶段纹章融入方案对比</h1>
        <p class="text-sm text-stone-400 mt-1">从世界书 48 条大坨文本，蜕变为轻量、美观的交互式名器玄鉴</p>
      </div>
      <div class="flex gap-3">
        <button onclick="showTab('A')" id="btnA" class="px-4 py-2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30">方案 A：悬停浮层气泡</button>
        <button onclick="showTab('B')" id="btnB" class="px-4 py-2 rounded bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700">方案 B：点击画卷玄鉴 (推荐)</button>
      </div>
    </div>

    <!-- 方案 A iframe / 视图 -->
    <div id="viewA" class="rounded-xl overflow-hidden border border-amber-500/30 shadow-2xl bg-black/40">
      <iframe src="file:///${fileA.replace(/\\/g, '/')}" class="w-full h-[650px] border-none"></iframe>
    </div>

    <!-- 方案 B iframe / 视图 -->
    <div id="viewB" class="hidden rounded-xl overflow-hidden border border-amber-500/30 shadow-2xl bg-black/40">
      <iframe src="file:///${fileB.replace(/\\/g, '/')}" class="w-full h-[720px] border-none"></iframe>
    </div>
  </div>

  <script>
    function showTab(tab) {
      if (tab === 'A') {
        document.getElementById('viewA').classList.remove('hidden');
        document.getElementById('viewB').classList.add('hidden');
        document.getElementById('btnA').className = 'px-4 py-2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30';
        document.getElementById('btnB').className = 'px-4 py-2 rounded bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700';
      } else {
        document.getElementById('viewA').classList.add('hidden');
        document.getElementById('viewB').classList.remove('hidden');
        document.getElementById('btnB').className = 'px-4 py-2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30';
        document.getElementById('btnA').className = 'px-4 py-2 rounded bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700';
      }
    }
  </script>
</body>
</html>`;

const interactiveFile = join(ARTIFACT_DIR, 'relic_schemes_demo.html');
writeFileSync(interactiveFile, interactiveHtml, 'utf8');
console.log('✔ 可交互 Artifact 已生成:', interactiveFile);
