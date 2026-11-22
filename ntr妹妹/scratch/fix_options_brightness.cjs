const fs = require('fs');
const path = require('path');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

const oldOptionCss = `    .okh-option-pill {
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
    }`;

const newOptionCss = `    .okh-option-pill {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: linear-gradient(180deg, rgba(48, 35, 26, 0.9) 0%, rgba(30, 22, 16, 0.94) 100%);
      border: 1px solid rgba(212, 176, 111, 0.45);
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      color: #fdf3e2;
      transition: all 0.22s ease;
      box-shadow: inset 0 1px 0 rgba(255, 235, 190, 0.12), 0 2px 6px rgba(0,0,0,0.45);
      outline: none;
    }
    .okh-option-pill:hover {
      background: linear-gradient(180deg, rgba(68, 50, 37, 0.98) 0%, rgba(42, 31, 22, 0.98) 100%);
      border-color: #fcebc7;
      box-shadow: 0 0 14px rgba(223, 200, 154, 0.35), inset 0 1px 0 rgba(255,255,255,0.25);
      transform: translateX(3px);
    }
    .okh-opt-title {
      font-size: 12.5px;
      font-weight: 600;
      color: #fff6e5;
      letter-spacing: 0.3px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
    }
    .okh-opt-code {
      font-size: 11px;
      font-weight: 700;
      color: #1a1209;
      background: linear-gradient(180deg, #f7e6c4 0%, #caa463 100%);
      border: 1px solid #fffaea;
      padding: 3px 8px;
      border-radius: 3px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.5);
      flex-shrink: 0;
      letter-spacing: 0.5px;
    }
    .okh-option-pill:hover .okh-opt-code {
      background: linear-gradient(180deg, #ffffff 0%, #e6c484 100%);
      box-shadow: 0 0 8px rgba(255, 235, 175, 0.6);
    }`;

const oldActCss = `    .okh-act-pill {
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
    }`;

const newActCss = `    .okh-actions-header {
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
      box-shadow: 0 0 14px rgba(223, 200, 154, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
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
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }
    .okh-act-desc {
      font-size: 11.5px;
      color: #e2d2be;
      line-height: 1.5;
      font-weight: 400;
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
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.5);
      white-space: nowrap;
      letter-spacing: 0.5px;
      transition: all 0.15s ease;
    }
    .okh-act-pill:hover .okh-act-badge {
      background: linear-gradient(180deg, #ffffff 0%, #e6c484 100%);
      box-shadow: 0 0 10px rgba(255, 235, 175, 0.7);
      color: #0d0804;
    }`;

let updated = 0;
if (html.includes(oldOptionCss)) {
  html = html.replace(oldOptionCss, newOptionCss);
  updated++;
  console.log('Replaced oldOptionCss successfully.');
} else {
  console.error('Could not find exact oldOptionCss');
}

if (html.includes(oldActCss)) {
  html = html.replace(oldActCss, newActCss);
  updated++;
  console.log('Replaced oldActCss successfully.');
} else {
  console.error('Could not find exact oldActCss');
}

if (updated === 2) {
  fs.writeFileSync('预览_状态栏样式.html', html, 'utf8');
  console.log('Successfully written to 预览_状态栏样式.html');

  const artifactPath = path.join('C:', 'Users', '11944', '.gemini', 'antigravity', 'brain', '1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f', 'status_bar_preview.html');
  if (fs.existsSync(artifactPath)) {
    fs.writeFileSync(artifactPath, html, 'utf8');
    console.log('Successfully updated status_bar_preview.html in brain artifacts');
  }
} else {
  process.exit(1);
}
