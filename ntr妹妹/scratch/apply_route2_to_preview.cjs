const fs = require('fs');
const path = require('path');

const localPath = '预览_状态栏样式.html';
const artPath = 'C:/Users/11944/.gemini/antigravity/brain/1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f/status_bar_preview.html';

const frameSvg = fs.readFileSync('assets/ui/frame_medieval_gold_9slice.svg', 'utf8');
const cardSvg = fs.readFileSync('assets/ui/card_inlaid_slot_9slice.svg', 'utf8');
const parchmentSvg = fs.readFileSync('assets/ui/parchment_dark_seamless.svg', 'utf8');
const waxSealSvg = fs.readFileSync('assets/ui/wax_seal_3d.svg', 'utf8');

// 转为 Base64 Data URI 作为稳定兜底
const frameUri = 'data:image/svg+xml;base64,' + Buffer.from(frameSvg).toString('base64');
const cardUri = 'data:image/svg+xml;base64,' + Buffer.from(cardSvg).toString('base64');
const parchmentUri = 'data:image/svg+xml;base64,' + Buffer.from(parchmentSvg).toString('base64');
const waxSealUri = 'data:image/svg+xml;base64,' + Buffer.from(waxSealSvg).toString('base64');

let content = fs.readFileSync(localPath, 'utf8');

// 1. 替换 .okh-hud-frame 的 CSS，直接采用 9-Slice Border-Image 与真实无缝羊皮贴图
const oldFrameCssStart = content.indexOf('.okh-hud-frame {');
const oldFrameCssEnd = content.indexOf('/* 四角古典哥特金属', oldFrameCssStart);

const newFrameCss = `.okh-hud-frame {
      width: 100%;
      max-width: 820px;
      position: relative;
      box-sizing: border-box;
      /* 工业级 9-Slice 金属雕花边框 (四角永久锁死锐利不歪斜) */
      border: 24px solid transparent;
      border-image: url("${frameUri}") 28 fill / 24px stretch;
      /* 真实深色古籍羊皮纸微观纤维底纹贴图 */
      background-image: url("${parchmentUri}");
      background-repeat: repeat;
      background-size: 256px 256px;
      padding: 6px 10px 12px;
      box-shadow: 
        0 20px 50px rgba(0, 0, 0, 0.85),
        inset 0 0 35px rgba(0, 0, 0, 0.75);
    }
    `;

if (oldFrameCssStart !== -1 && oldFrameCssEnd !== -1) {
  content = content.substring(0, oldFrameCssStart) + newFrameCss + content.substring(oldFrameCssEnd);
  console.log('Replaced .okh-hud-frame CSS with 9-Slice.');
}

// 2. 移除原先容易错位的绝对定位 corner div（因为 9-slice 自带四角精铸角标，且保证绝对不歪！）
const oldCornersHtmlStart = content.indexOf('<!-- 四角古典哥特金属卷草纹封角');
const oldCornersHtmlEnd = content.indexOf('<div class="okh-crest-header">', oldCornersHtmlStart);

if (oldCornersHtmlStart !== -1 && oldCornersHtmlEnd !== -1) {
  content = content.substring(0, oldCornersHtmlStart) + content.substring(oldCornersHtmlEnd);
  console.log('Removed redundant absolute corner divs, now 100% managed by 9-slice.');
}

// 3. 升级伙伴卡片 .okh-member-card 为 9-Slice 金铜凹槽铭牌
const oldMemberCardCssStart = content.indexOf('.okh-member-card {');
const oldMemberCardCssEnd = content.indexOf('.okh-portrait-slot {', oldMemberCardCssStart);

const newMemberCardCss = `.okh-member-card {
      display: flex;
      gap: 12px;
      position: relative;
      overflow: hidden;
      /* 9-Slice 青铜金铸凹槽边框 */
      border: 12px solid transparent;
      border-image: url("${cardUri}") 14 fill / 12px stretch;
      /* 内嵌手札微羊皮底 */
      background-image: url("${parchmentUri}");
      background-size: 180px 180px;
      padding: 4px 6px;
      box-shadow: 
        0 6px 16px rgba(0, 0, 0, 0.65),
        inset 0 2px 8px rgba(0, 0, 0, 0.7);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .okh-member-card:hover {
      transform: translateY(-2px);
      filter: brightness(1.08);
      box-shadow: 
        0 10px 24px rgba(0, 0, 0, 0.8),
        0 0 16px rgba(215, 175, 110, 0.3);
    }
    `;

if (oldMemberCardCssStart !== -1 && oldMemberCardCssEnd !== -1) {
  content = content.substring(0, oldMemberCardCssStart) + newMemberCardCss + content.substring(oldMemberCardCssEnd);
  console.log('Replaced .okh-member-card CSS with 9-Slice slot.');
}

// 4. 升级爱德专属墨玉伙伴卡
const oldEdCardCssStart = content.indexOf('.okh-member-card.ed-card {');
const oldEdCardCssEnd = content.indexOf('/* ============================================================', oldEdCardCssStart);

const newEdCardCss = `.okh-member-card.ed-card {
      filter: hue-rotate(65deg) saturate(1.15);
    }
    .okh-member-card.ed-card:hover {
      filter: hue-rotate(65deg) saturate(1.3) brightness(1.1);
    }
    .okh-member-card.ed-card .okh-hero-name {
      color: #c8edd3;
    }
    .okh-member-card.ed-card .okh-soul-quote {
      color: #bce3c4;
    }
    .okh-member-card.ed-card .okh-action-text {
      color: #92bfa0;
    }
    `;

if (oldEdCardCssStart !== -1 && oldEdCardCssEnd !== -1) {
  content = content.substring(0, oldEdCardCssStart) + newEdCardCss + content.substring(oldEdCardCssEnd);
  console.log('Updated ed-card CSS.');
}

// 5. 替换火漆印章为真实的 3D 熔蜡切片
const oldWaxSealStart = content.indexOf('<svg class="okh-wax-seal-svg"');
if (oldWaxSealStart !== -1) {
  const oldWaxSealEnd = content.indexOf('</svg>', oldWaxSealStart) + 6;
  const newWaxSealHtml = `<img src="${waxSealUri}" alt="待决印章" class="okh-wax-seal-img" title="公会待决敕令火漆印章" style="width:40px; height:40px; flex-shrink:0; cursor:pointer; filter:drop-shadow(0 3px 6px rgba(0,0,0,0.85)); transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">`;
  content = content.substring(0, oldWaxSealStart) + newWaxSealHtml + content.substring(oldWaxSealEnd);
  console.log('Replaced wax seal with 3D photorealistic seal image.');
}

// 6. 待决事件公文手札 .okh-event-card 也采用 9-Slice 与羊皮底纸
const oldEventCardCssStart = content.indexOf('.okh-event-card {');
const oldEventCardCssEnd = content.indexOf('.okh-event-meta {', oldEventCardCssStart);

const newEventCardCss = `.okh-event-card {
      width: 100%;
      box-sizing: border-box;
      border: 12px solid transparent;
      border-image: url("${cardUri}") 14 fill / 12px stretch;
      background-image: url("${parchmentUri}");
      background-size: 200px 200px;
      padding: 8px 12px;
      box-shadow: 
        0 8px 24px rgba(0, 0, 0, 0.7),
        inset 0 0 20px rgba(0, 0, 0, 0.6);
      position: relative;
    }
    `;

if (oldEventCardCssStart !== -1 && oldEventCardCssEnd !== -1) {
  content = content.substring(0, oldEventCardCssStart) + newEventCardCss + content.substring(oldEventCardCssEnd);
  console.log('Replaced .okh-event-card CSS with 9-Slice parchment scroll.');
}

fs.writeFileSync(localPath, content, 'utf8');
fs.writeFileSync(artPath, content, 'utf8');
console.log('Route 2 9-slice suite fully applied to both preview files.');
