'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const WORLDBOOK_DIR = path.resolve(ROOT, '..', '世界书条目');
const PREINJECTED_DIR = path.join(ROOT, 'src', 'preinjected-worldbook');

const WORLDBOOK_FILES = [
  '01_静态总纲与法则层.md',
  '02_场景空间层.md',
  '03_小队全员档案.md',
  '04_外部特派与修会角色.md',
  '05_潜伏幕后角色.md',
  '06_反派与地方势力角色.md',
  '07_城镇支线与特殊角色.md'
];

function readEntrySources(markdown) {
  const blocks = /<!-- ENTRY (\{[\s\S]*?\}) -->\s*```(?:text|xml)?\n([\s\S]*?)\n```/g;
  return Array.from(markdown.replace(/\r\n/g, '\n').matchAll(blocks), ([, meta, body]) => ({
    meta: JSON.parse(meta),
    content: body.trim()
  }));
}

/** Build deferred entries in Tavern Helper's WorldbookEntry format. */
function extractPreinjectedPacks() {
  const ids = new Set();
  return fs.readdirSync(PREINJECTED_DIR).filter(file => file.endsWith('.md')).sort().map(file => {
    const source = fs.readFileSync(path.join(PREINJECTED_DIR, file), 'utf8');
    const declaration = source.match(/<!-- PREINJECT (\{[^\r\n]*\}) -->/);
    const pack = declaration && JSON.parse(declaration[1]);
    const validId = value => typeof value === 'string' && /^[a-z][a-z0-9_]*$/.test(value);
    if (!validId(pack?.id) || ids.has(pack.id) || !validId(pack.requiredFlag) ||
        !Array.isArray(pack.afterEvents) || !pack.afterEvents.length || !pack.afterEvents.every(validId)) {
      throw Error('预注入世界书解锁配置非法：' + file);
    }
    ids.add(pack.id);
    const names = new Set();
    const entries = readEntrySources(source).map(({ meta, content }) => {
      if (!meta.comment || names.has(meta.comment) || !content || meta.constant !== true ||
          !Array.isArray(meta.keys) || !meta.keys.every(key => typeof key === 'string') ||
          meta.position !== 'at_depth' || !Number.isSafeInteger(meta.depth) || meta.depth < 0 ||
          !Number.isSafeInteger(meta.order)) {
        throw Error('预注入世界书条目配置非法：' + file + ' / ' + meta.comment);
      }
      names.add(meta.comment);
      return {
        name: meta.comment,
        enabled: true,
        strategy: { type: 'constant', keys: meta.keys },
        position: { type: 'at_depth', role: 'system', depth: meta.depth, order: meta.order },
        content,
        probability: 100,
        recursion: { prevent_incoming: true, prevent_outgoing: true },
        extra: { okh_preinjected_id: pack.id + ':' + meta.comment }
      };
    });
    if (!entries.length) throw Error('预注入世界书没有条目：' + file);
    return { ...pack, entries };
  });
}

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
    for (const { meta, content } of readEntrySources(fs.readFileSync(filePath, 'utf8'))) {
      const isAtDepth = meta.position === 'at_depth';
      const order = Number(meta.order) || 100;
      const depth = isAtDepth ? (Number(meta.depth) || 4) : 4;

      const entry = {
        id: id,
        keys: Array.isArray(meta.keys) ? meta.keys : [],
        secondary_keys: [],
        comment: meta.comment || `条目_${id}`,
        content,
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
  extractPreinjectedPacks,
  WORLDBOOK_FILES,
  WORLDBOOK_DIR
};
