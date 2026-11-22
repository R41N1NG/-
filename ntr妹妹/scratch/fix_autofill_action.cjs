const fs = require('fs');
const path = require('path');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// 1. 替换 pickOutcomeDirect
const oldPickOutcome = `    // 核心交互：点击待决事件策略，直填回执代码
    function pickOutcomeDirect(code, label) {
      const inputEl = document.getElementById('tavern-input');
      // 严格剃刀原则：只填入规范标签，不脑补任何多余文学代打描写
      inputEl.value = \`<event_resolve id="ed_investigate_truth" outcome="\${code}" />\`;
      inputEl.focus();
      document.getElementById('dock-status-badge').textContent = \`已填入：\${label}\`;
    }`;

const newPickOutcome = `    // 跨环境通用获取酒馆/预览输入框
    function getTavernInput() {
      return document.getElementById('send_textarea') || 
             document.getElementById('tavern-input') || 
             document.querySelector('textarea#send_textarea') ||
             document.querySelector('.chat_input textarea') ||
             document.querySelector('textarea');
    }

    // 核心交互：点击待决事件策略，直填回执代码
    function pickOutcomeDirect(code, label) {
      const inputEl = getTavernInput();
      if (inputEl) {
        // 严格剃刀原则：只填入规范标签，不脑补任何多余文学代打描写
        inputEl.value = \`<event_resolve id="ed_investigate_truth" outcome="\${code}" />\`;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const badge = document.getElementById('dock-status-badge');
      if (badge) badge.textContent = \`已填入：\${label}\`;
    }`;

// 2. 替换 selectCharAction 并补齐 pickActionDirect
const oldSelectChar = `    function selectCharAction(act) {
      const inputEl = document.getElementById('tavern-input');
      // 直填玩家输入框，不越权推动后台状态机，由玩家自主确认发送
      inputEl.value = act.inputText || \`<action id="\${act.code}" />\`;
      inputEl.focus();
      document.getElementById('dock-status-badge').textContent = \`已填入：\${act.title}\`;
      closeCharModal();
    }`;

const newSelectChar = `    // 核心交互：点击角色日常/委任指令，直填规范动作标签并自动关闭模态弹窗
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
    }`;

let updated = 0;
if (html.includes(oldPickOutcome)) {
  html = html.replace(oldPickOutcome, newPickOutcome);
  updated++;
  console.log('Replaced oldPickOutcome');
} else {
  console.error('Could not find exact oldPickOutcome');
}

if (html.includes(oldSelectChar)) {
  html = html.replace(oldSelectChar, newSelectChar);
  updated++;
  console.log('Replaced oldSelectChar');
} else {
  console.error('Could not find exact oldSelectChar');
}

if (updated === 2) {
  fs.writeFileSync('预览_状态栏样式.html', html, 'utf8');
  console.log('Updated 预览_状态栏样式.html successfully');

  const artifactPath = path.join('C:', 'Users', '11944', '.gemini', 'antigravity', 'brain', '1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f', 'status_bar_preview.html');
  if (fs.existsSync(artifactPath)) {
    fs.writeFileSync(artifactPath, html, 'utf8');
    console.log('Updated artifact status_bar_preview.html successfully');
  }
} else {
  process.exit(1);
}
