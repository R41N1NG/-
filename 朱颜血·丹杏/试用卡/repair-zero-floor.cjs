'use strict';
// gpt：只修复零楼显示打包，保留上传卡的世界书、候选开场、HUD及已有身份同步逻辑。
const fs = require('node:fs');
const path = require('node:path');
const gatewayName = 'ZYX_01_网关界面渲染 (零楼启动)';
const heightMarker = 'zyx-zero-resize-fix-1';
const heightScript = `<script>
// ${heightMarker}
(() => {
  const root = document.getElementById('zyx-zero-floor');
  if (!root) return;
  let pending = 0;
  const resize = () => {
    pending = 0;
    try {
      const frame = window.frameElement;
      if (!frame) return;
      const height = Math.ceil(root.getBoundingClientRect().height + 32);
      if (height > 0 && frame.style.height !== height + 'px') frame.style.height = height + 'px';
    } catch {}
  };
  const schedule = () => { if (!pending) pending = requestAnimationFrame(resize); };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  observer?.observe(root);
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule, { once: true });
  window.addEventListener('pagehide', () => {
    observer?.disconnect();
    if (pending) cancelAnimationFrame(pending);
    window.removeEventListener('resize', schedule);
  }, { once: true });
  schedule();
})();
</script>`;
const normalize = text => text.replace(/\r\n/g, '\n').trim();
function repairCard(input) {
  const card = structuredClone(input);
  const scripts = card?.data?.extensions?.regex_scripts;
  if (!Array.isArray(scripts)) throw new Error('缺角色正则列表');
  const matches = scripts.filter(rule => rule.scriptName === gatewayName);
  if (matches.length !== 1) throw new Error('零楼规则不唯一，拒绝猜测');
  const rule = matches[0];
  let html = rule.replaceString.trim();
  const fence = /^```html\s*\n([\s\S]*?)\n```$/i.exec(html);
  if (fence) html = fence[1];
  if (html.includes('```') || !/^<!doctype html>/i.test(html) || !html.includes('id="zyx-zero-floor"')) {
    throw new Error('不是已知零楼HTML文档，拒绝改写');
  }
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const encodedBodies = new Set();
  for (const match of html.matchAll(scriptPattern)) {
    const encoded = /\bsrc="data:text\/javascript;charset=utf-8;base64,([A-Za-z0-9+/=]+)"/i.exec(match[1]);
    if (encoded) encodedBodies.add(normalize(Buffer.from(encoded[1], 'base64').toString('utf8')));
  }
  // 只删与data脚本逐字等价的inline副本，不删除其他初始化或业务脚本。
  html = html.replace(scriptPattern, (full, attrs, body) => {
    if (!/\bsrc\s*=/i.test(attrs) && encodedBodies.has(normalize(body))) return '';
    return full;
  });
  // 同一按钮只走root委托。上传版同时用onclick和委托，会把同一次点击执行两遍。
  const hasKnownDelegation = [...encodedBodies].some(body =>
    /root\.addEventListener\(\s*['"]click['"]/.test(body) &&
    body.includes('configure(button.dataset.role, root)') &&
    body.includes('window.ZYX_ZERO_ACTION(button.dataset.action, button)'));
  if (hasKnownDelegation) {
    html = html.replace(/\s+onclick="window\.ZYX_(?:SELECT_ROLE|ZERO_ACTION)&&window\.ZYX_(?:SELECT_ROLE|ZERO_ACTION)\('[^']+',this\)"/g, '');
  }
  // 这些字面标签会继续被02/03处理，破坏字符串及后续脚本；未知脚本要先人工定位。
  if (/<\/?status_bar>/.test(html)) throw new Error('零楼仍包含裸状态标签，须检查脚本而非继续嵌入');
  if (!html.includes(heightMarker)) {
    if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, heightScript + '\n</body>');
    else html += '\n' + heightScript + '\n</body>';
  }
  if (!/<\/html>/i.test(html)) html += '\n</html>';
  rule.replaceString = '```html\n' + html.trim() + '\n```';
  const suffix = ' · 零楼修复1';
  if (!card.data.name.endsWith(suffix)) card.data.name += suffix;
  const versionSuffix = '+zero-fix1';
  if (!(card.data.character_version || '').endsWith(versionSuffix)) {
    card.data.character_version = (card.data.character_version || '') + versionSuffix;
  }
  return card;
}
if (require.main === module) {
  const [, , input, output] = process.argv;
  if (!input || !output) throw new Error('用法：node repair-zero-floor.cjs 上传卡.json 输出新卡.json');
  if (path.resolve(input) === path.resolve(output)) throw new Error('禁止覆盖输入');
  fs.writeFileSync(output, JSON.stringify(repairCard(JSON.parse(fs.readFileSync(input, 'utf8'))), null, 2) + '\n', { flag: 'wx' });
  console.log('仅修复零楼，已输出：' + output);
}
module.exports = { repairCard, gatewayName, heightMarker };
