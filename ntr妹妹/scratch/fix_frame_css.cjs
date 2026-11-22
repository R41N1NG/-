const fs = require('fs');

const localPath = '预览_状态栏样式.html';
const artPath = 'C:/Users/11944/.gemini/antigravity/brain/1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f/status_bar_preview.html';

const frameSvg = fs.readFileSync('assets/ui/frame_medieval_gold_9slice.svg', 'utf8');
const parchmentSvg = fs.readFileSync('assets/ui/parchment_dark_seamless.svg', 'utf8');

const frameUri = 'data:image/svg+xml;base64,' + Buffer.from(frameSvg).toString('base64');
const parchmentUri = 'data:image/svg+xml;base64,' + Buffer.from(parchmentSvg).toString('base64');

let content = fs.readFileSync(localPath, 'utf8');

const targetStr = `.okh-hud-frame {
      position: relative;
      max-width: 720px;
      margin: 0 auto;
      background: var(--okh-bg-shell);
      border: 1px solid var(--okh-border-gold);
      border-radius: 6px;
      padding: 18px 22px 16px;
      box-shadow: 
        0 10px 35px rgba(0, 0, 0, 0.8),
        inset 0 0 25px rgba(0, 0, 0, 0.6),
        inset 0 1px 0 rgba(235, 205, 145, 0.25);
    }`;

const replacementStr = `.okh-hud-frame {
      position: relative;
      max-width: 760px;
      margin: 0 auto;
      box-sizing: border-box;
      /* 工业级 9-Slice 金属雕花边框 (四角绝对锁定，永无偏差歪斜) */
      border: 24px solid transparent;
      border-image: url("${frameUri}") 28 fill / 24px stretch;
      /* 真实深色古籍羊皮纸微观纤维底纹贴图 */
      background-image: url("${parchmentUri}");
      background-repeat: repeat;
      background-size: 256px 256px;
      padding: 8px 12px 14px;
      box-shadow: 
        0 20px 50px rgba(0, 0, 0, 0.85),
        inset 0 0 35px rgba(0, 0, 0, 0.75);
    }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log('Successfully replaced .okh-hud-frame CSS with 9-Slice.');
} else {
  console.log('targetStr not found exactly, replacing via regex...');
  content = content.replace(/\.okh-hud-frame\s*\{[\s\S]*?inset 0 1px 0 rgba\(235, 205, 145, 0\.25\);\s*\}/, replacementStr);
  console.log('Regex replace executed.');
}

fs.writeFileSync(localPath, content, 'utf8');
fs.writeFileSync(artPath, content, 'utf8');
console.log('Frame 9-Slice applied to both files.');
