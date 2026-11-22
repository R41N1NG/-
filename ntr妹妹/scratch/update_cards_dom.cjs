const fs = require('fs');

const localPath = '预览_状态栏样式.html';
const artPath = 'C:/Users/11944/.gemini/antigravity/brain/1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f/status_bar_preview.html';

let content = fs.readFileSync(localPath, 'utf8');

const gridStart = content.indexOf('<div class="okh-cards-grid">');
const gridEnd = content.indexOf('</div>\n    </details>', gridStart);

console.log('gridStart:', gridStart, 'gridEnd:', gridEnd);

const newGridHtml = `<div class="okh-cards-grid">
        <!-- 1. 古兰 -->
        <div class="okh-member-card">
          <div class="okh-portrait-slot" onclick="openCharModal('gulan')" title="点击查看古兰大图与交互选项">
            <img class="okh-portrait-img" id="img-gulan" src="assets/portraits/gulan.png" alt="古兰" onerror="handleImgError(this)" style="display:none;">
            <div class="okh-sigil-fallback" id="sigil-gulan">
              <span class="okh-sigil-glyph">⚔️</span>
              <span style="font-size:11px; font-weight:bold; color:var(--okh-gold-main);">古兰</span>
              <span class="okh-sigil-sub">龙角 · 重剑</span>
            </div>
          </div>
          <div class="okh-card-body">
            <div class="okh-body-head">
              <div class="okh-name-title">
                <span class="okh-hero-name">古兰</span>
                <span class="okh-hero-job">半龙人领队</span>
              </div>
              <span class="okh-hero-locale">练武场</span>
            </div>
            <div class="okh-bond-metric">
              <div class="okh-bond-labels">
                <span class="okh-bond-title">羁绊好感</span>
                <span class="okh-bond-tier">亲密<span class="okh-bond-num">88</span></span>
              </div>
              <div class="okh-gauge-track"><div class="okh-gauge-fill" style="width: 88%;"></div></div>
            </div>
            <div class="okh-state-slot">
              <div class="okh-soul-row">
                <span class="okh-soul-icon">🕯</span>
                <span class="okh-soul-quote">“威严端庄 · 执剑自省”</span>
              </div>
              <div class="okh-action-row">
                <span class="okh-action-icon">📍</span>
                <span class="okh-action-text">露天练武场 · 挥剑打理随身重剑</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 伊丝娜 -->
        <div class="okh-member-card">
          <div class="okh-portrait-slot" onclick="openCharModal('isna')" title="点击查看伊丝娜大图与交互选项">
            <img class="okh-portrait-img" id="img-isna" src="assets/portraits/isna.png" alt="伊丝娜" onerror="handleImgError(this)" style="display:none;">
            <div class="okh-sigil-fallback" id="sigil-isna">
              <span class="okh-sigil-glyph">🐾</span>
              <span style="font-size:11px; font-weight:bold; color:var(--okh-gold-main);">伊丝娜</span>
              <span class="okh-sigil-sub">猫耳 · 短刃</span>
            </div>
          </div>
          <div class="okh-card-body">
            <div class="okh-body-head">
              <div class="okh-name-title">
                <span class="okh-hero-name">伊丝娜</span>
                <span class="okh-hero-job">猫耳斥候</span>
              </div>
              <span class="okh-hero-locale">镇上</span>
            </div>
            <div class="okh-bond-metric">
              <div class="okh-bond-labels">
                <span class="okh-bond-title">羁绊好感</span>
                <span class="okh-bond-tier">友好<span class="okh-bond-num">72</span></span>
              </div>
              <div class="okh-gauge-track"><div class="okh-gauge-fill" style="width: 72%;"></div></div>
            </div>
            <div class="okh-state-slot">
              <div class="okh-soul-row">
                <span class="okh-soul-icon">🕯</span>
                <span class="okh-soul-quote">“市井警醒 · 灵动敏锐”</span>
              </div>
              <div class="okh-action-row">
                <span class="okh-action-icon">📍</span>
                <span class="okh-action-text">商业街拐角 · 打听私活行情</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 妮丝 -->
        <div class="okh-member-card">
          <div class="okh-portrait-slot" onclick="openCharModal('nise')" title="点击查看妮丝大图与交互选项">
            <img class="okh-portrait-img" id="img-nise" src="assets/portraits/nise.png" alt="妮丝" onerror="handleImgError(this)" style="display:none;">
            <div class="okh-sigil-fallback" id="sigil-nise">
              <span class="okh-sigil-glyph">🔮</span>
              <span style="font-size:11px; font-weight:bold; color:var(--okh-gold-main);">妮丝</span>
              <span class="okh-sigil-sub">法杖 · 见闻</span>
            </div>
          </div>
          <div class="okh-card-body">
            <div class="okh-body-head">
              <div class="okh-name-title">
                <span class="okh-hero-name">妮丝</span>
                <span class="okh-hero-job">见习法师</span>
              </div>
              <span class="okh-hero-locale">旅店客房</span>
            </div>
            <div class="okh-bond-metric">
              <div class="okh-bond-labels">
                <span class="okh-bond-title">羁绊好感</span>
                <span class="okh-bond-tier" style="color:#ff9e9e;">爱恋<span class="okh-bond-num" style="color:#ffb8b8;">92</span></span>
              </div>
              <div class="okh-gauge-track"><div class="okh-gauge-fill love" style="width: 92%;"></div></div>
            </div>
            <div class="okh-state-slot">
              <div class="okh-soul-row">
                <span class="okh-soul-icon">🕯</span>
                <span class="okh-soul-quote">“骄傲依恋 · 见闻新奇”</span>
              </div>
              <div class="okh-action-row">
                <span class="okh-action-icon">📍</span>
                <span class="okh-action-text">旅店二楼 · 整理新奇矿石与笔记</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. 奥萝拉 -->
        <div class="okh-member-card">
          <div class="okh-portrait-slot" onclick="openCharModal('aurora')" title="点击查看奥萝拉大图与交互选项">
            <img class="okh-portrait-img" id="img-aurora" src="assets/portraits/aurora.png" alt="奥萝拉" onerror="handleImgError(this)" style="display:none;">
            <div class="okh-sigil-fallback" id="sigil-aurora">
              <span class="okh-sigil-glyph">✝️</span>
              <span style="font-size:11px; font-weight:bold; color:var(--okh-gold-main);">奥萝拉</span>
              <span class="okh-sigil-sub">圣徽 · 牧职</span>
            </div>
          </div>
          <div class="okh-card-body">
            <div class="okh-body-head">
              <div class="okh-name-title">
                <span class="okh-hero-name">奥萝拉</span>
                <span class="okh-hero-job">见习牧师</span>
              </div>
              <span class="okh-hero-locale">领主山庄</span>
            </div>
            <div class="okh-bond-metric">
              <div class="okh-bond-labels">
                <span class="okh-bond-title">羁绊好感</span>
                <span class="okh-bond-tier">友好<span class="okh-bond-num">65</span></span>
              </div>
              <div class="okh-gauge-track"><div class="okh-gauge-fill" style="width: 65%;"></div></div>
            </div>
            <div class="okh-state-slot">
              <div class="okh-soul-row">
                <span class="okh-soul-icon">🕯</span>
                <span class="okh-soul-quote">“温婉隐忍 · 虔诚负重”</span>
              </div>
              <div class="okh-action-row">
                <span class="okh-action-icon">📍</span>
                <span class="okh-action-text">领主山庄 · 执仆役女仆差事</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. 爱德（专属墨玉伙伴卡） -->
        <div class="okh-member-card ed-card">
          <div class="okh-portrait-slot" style="border-color: rgba(104, 173, 124, 0.45);" onclick="openCharModal('ed')" title="点击查看爱德大图与日常可重复委任">
            <img class="okh-portrait-img" id="img-ed" src="assets/portraits/ed.png" alt="爱德" onerror="handleImgError(this)" style="display:none;">
            <div class="okh-sigil-fallback" id="sigil-ed" style="background: radial-gradient(circle at 50% 35%, rgba(28, 48, 34, 0.95), rgba(12, 20, 15, 0.98));">
              <span class="okh-sigil-glyph" style="color: #87d79e;">🪶</span>
              <span style="font-size:11px; font-weight:bold; color:#bce3c4;">爱德</span>
              <span class="okh-sigil-sub" style="color:#7bb386;">飞羽 · 遗孤</span>
            </div>
          </div>
          <div class="okh-card-body">
            <div class="okh-body-head">
              <div class="okh-name-title">
                <span class="okh-hero-name">爱德</span>
                <span class="okh-hero-job" style="color:#85b88e;">随行后勤伙伴</span>
              </div>
              <span class="okh-hero-locale" style="color:#87d79e; background:rgba(104, 173, 124, 0.15); border-color:rgba(104,173,124,0.3);">同行在场</span>
            </div>
            <div class="okh-bond-metric">
              <div class="okh-bond-labels">
                <span class="okh-bond-title" style="color:#85b88e;">市井后勤效能</span>
                <span class="okh-bond-tier" style="color:#bce3c4;">公会急件 · 旅店免租</span>
              </div>
              <div class="okh-gauge-track"><div class="okh-gauge-fill" style="width: 100%; background: linear-gradient(90deg, #4d825c, #87d79e);"></div></div>
            </div>
            <div class="okh-state-slot">
              <div class="okh-soul-row">
                <span class="okh-soul-icon">🕯</span>
                <span class="okh-soul-quote">“纯善知恩 · 倔强护亲”</span>
              </div>
              <div class="okh-action-row">
                <span class="okh-action-icon">📍</span>
                <span class="okh-action-text">中央集市 · 随队探查珠宝铺真相</span>
              </div>
            </div>
          </div>
        </div>`;

content = content.substring(0, gridStart) + newGridHtml + content.substring(gridEnd);

fs.writeFileSync(localPath, content, 'utf8');
fs.writeFileSync(artPath, content, 'utf8');
console.log('Cards DOM updated successfully.');
