'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const WORLDBOOK_DIR = path.resolve(ROOT, '..', '世界书条目');

const WORLDBOOK_FILES = [
  '01_静态总纲与法则层.md',
  '02_场景空间层.md',
  '03_小队全员档案.md',
  '04_外部特派与修会角色.md',
  '05_潜伏幕后角色.md',
  '06_反派与地方势力角色.md',
  '07_城镇支线与特殊角色.md'
];

/**
 * 提取并构建符合 SillyTavern Spec V2 规范的 34 项纯净标准世界书条目
 * @returns {Array<Object>}
 */
function extractWorldbookEntries() {
  const entries = [];
  let id = 0;

  for (const file of WORLDBOOK_FILES) {
    const filePath = path.join(WORLDBOOK_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`世界书源文件不存在: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    const regex = /<!-- ENTRY (\{[\s\S]*?\}) -->\s*```(?:text|xml)?\r?\n([\s\S]*?)\r?\n```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const meta = JSON.parse(match[1]);
      const body = match[2].trim();
      const isAtDepth = meta.position === 'at_depth';
      const order = Number(meta.order) || 100;
      const depth = isAtDepth ? (Number(meta.depth) || 4) : 4;

      const entry = {
        id: id,
        keys: Array.isArray(meta.keys) ? meta.keys : [],
        secondary_keys: [],
        comment: meta.comment || `条目_${id}`,
        content: body,
        constant: Boolean(meta.constant),
        selective: false,
        insertion_order: order,
        enabled: true,
        position: meta.position || 'at_depth',
        case_sensitive: false,
        name: meta.comment || `条目_${id}`,
        priority: order,
        extensions: {
          position: isAtDepth ? 4 : 0,
          depth: depth,
          role: 0,
          exclude_recursion: true
        }
      };

      entries.push(entry);
      id++;
    }
  }

  if (entries.length !== 34) {
    throw new Error(`世界书条目数量异常：预期 34 项，实际提取到 ${entries.length} 项`);
  }

  return entries;
}

module.exports = {
  extractWorldbookEntries,
  WORLDBOOK_FILES,
  WORLDBOOK_DIR
};
