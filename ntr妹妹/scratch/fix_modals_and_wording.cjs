const fs = require('fs');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// ============================================================
// 1. 彻底补全所有模态弹窗的全局居中遮罩样式（绝不漏到左下角！）
// ============================================================
const modalOverlayStyles = `
    /* ============================================================
       全局模态弹窗系统 (Fixed 居中遮罩，默认隐藏，严禁平铺到页面流)
       ============================================================ */
    .okh-modal-overlay,
    .okh-map-overlay {
      display: none !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 99999 !important;
      background: rgba(10, 8, 6, 0.82) !important;
      backdrop-filter: blur(5px) !important;
      -webkit-backdrop-filter: blur(5px) !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      box-sizing: border-box !important;
    }

    /* 激活弹出：居中展示 */
    .okh-modal-overlay.active,
    .okh-map-overlay.active {
      display: flex !important;
    }

    /* 模态框通用关闭按钮 (右上角圆钮) */
    .okh-modal-close {
      position: absolute;
      top: 14px;
      right: 16px;
      background: transparent;
      border: 1px solid rgba(195, 162, 108, 0.35);
      color: var(--okh-gold-dim);
      font-size: 14px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      line-height: 1;
      padding: 0;
      outline: none;
      z-index: 10;
    }
    .okh-modal-close:hover {
      color: var(--okh-gold-light);
      border-color: var(--okh-gold-light);
      background: rgba(195, 162, 108, 0.15);
      transform: rotate(90deg);
    }

    /* 地图弹窗容器 */
    .okh-map-box {
      position: relative;
      width: 100%;
      max-width: 620px;
      background: radial-gradient(ellipse at 50% 20%, rgba(42, 32, 25, 0.98) 0%, rgba(20, 15, 12, 0.99) 100%);
      border: 1px solid rgba(195, 162, 108, 0.45);
      border-radius: 6px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(195, 162, 108, 0.25);
      padding: 24px;
      color: var(--okh-text-main);
    }
    .okh-map-header {
      text-align: center;
      margin-bottom: 16px;
      border-bottom: 1px dashed rgba(195, 162, 108, 0.25);
      padding-bottom: 10px;
    }
    .okh-map-title {
      font-size: 14px;
      font-weight: bold;
      color: var(--okh-gold-light);
      letter-spacing: 1px;
    }
    .okh-map-sub {
      font-size: 11px;
      color: var(--okh-gold-dim);
      margin-top: 4px;
    }
    .okh-map-canvas-slot {
      min-height: 240px;
      background: #110d0b;
      border: 1px solid rgba(160, 132, 86, 0.3);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.8);
    }
    .okh-map-fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      gap: 8px;
    }
    .okh-map-compass {
      font-size: 32px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    }
    .okh-map-fallback-title {
      font-size: 13px;
      font-weight: bold;
      color: var(--okh-gold-main);
    }
    .okh-map-fallback-desc {
      font-size: 11px;
      color: var(--okh-text-muted);
      line-height: 1.6;
    }
`;

// 插入到 CSS 中（在 .okh-modal-box 之前）
const modalBoxPos = html.indexOf('.okh-modal-box {');
if (modalBoxPos !== -1) {
  html = html.substring(0, modalBoxPos) + modalOverlayStyles + '\n\n    ' + html.substring(modalBoxPos);
  console.log('Inserted modalOverlayStyles before .okh-modal-box');
} else {
  console.log('Error: .okh-modal-box not found in CSS');
}

// ============================================================
// 2. 彻底清除“堆砌辞藻的多余描述”（稚子请托、遗孤幼子等）
// ============================================================
// 彻底去除“稚子请托”
html = html.replace(/银月珠宝铺（稚子请托 · 探知真相）/g, '银月珠宝铺 · 探查真相');
html = html.replace(/稚子请托 · 探知真相（今日）/g, '银月珠宝铺 · 探查真相（今日）');
html = html.replace(/待决事件 · 市井请托/g, '待决委托 · 银月珠宝铺');

// 去除地图模态框的开发唠叨
html = html.replace(/❖ 奥克赫斯疆域 · 区域空间地图 ❖/g, '奥克赫斯城镇与周边全域地图');
html = html.replace(/路径预留：<code>assets\/maps\/world_map\.png<\/code>（图包占位等待具体图片）/g, '区域空间态势与周边要道');
html = html.replace(/奥克赫斯全域疆界 · 测绘画卷/g, '全域空间测绘画卷');
html = html.replace(/✦ 战役地图插槽：已预留 <code>assets\/maps\/world_map\.png<\/code><br>\s*✦ 罗盘刻度就绪 · 待图包图片载入后在此全幅平铺展现/g, '暂未载入外部地图图像（放置于 <code>assets/maps/world_map.png</code> 后自动平铺展现）');

// 去除爱德副标题的做作堆砌词
html = html.replace(/银月珠宝铺落难遗孤 · 随行后勤伙伴与市井耳目/g, '随行后勤伙伴 · 银月珠宝铺学徒');
html = html.replace(/银月珠宝铺遗孤幼子 · 随行后勤伙伴与市井耳目/g, '随行后勤伙伴 · 银月珠宝铺学徒');

fs.writeFileSync('预览_状态栏样式.html', html, 'utf8');
console.log('Saved 预览_状态栏样式.html successfully');
