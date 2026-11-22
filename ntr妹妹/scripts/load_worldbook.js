/**
 * load_worldbook.js — 从 世界书条目/01..06 编译 Spec V2 正式世界书条目
 *
 * @updated 2026-11-11 23:54
 * @reason  保证世界书设定文件与角色卡 JSON 单一真源，杜绝手工同步漂移与遗留宏残留
 */

'use strict'

const fs = require('fs')
const path = require('path')

const ENTRY_BLOCK_RE =
  /<!--\s*ENTRY\s+(\{[^\r\n]+\})\s*-->\r?\n```(?:xml|yaml|text)\r?\n([\s\S]*?)\r?\n```/g

/**
 * 将单个元数据块与正文转为 ST Spec V2 世界书条目
 * @param {number} id
 * @param {object} meta
 * @param {string} content
 * @returns {object}
 */
function buildEntry(id, meta, content) {
  const pos = meta.position
  if (!['before_char', 'after_char', 'at_depth'].includes(pos)) {
    throw new Error(`非法条目位置 "${pos}" (${meta.comment})`)
  }
  const stPos = pos === 'at_depth' ? 4 : (pos === 'after_char' ? 1 : 0)
  const depth = pos === 'at_depth' ? meta.depth : 4
  if (pos === 'at_depth' && (!Number.isInteger(depth) || depth < 0)) {
    throw new Error(`at_depth 条目缺少有效 depth (${meta.comment})`)
  }

  return {
    id,
    keys: meta.keys,
    secondary_keys: [],
    comment: meta.comment,
    content,
    enabled: true,
    insertion_order: meta.order,
    case_sensitive: false,
    constant: Boolean(meta.constant),
    selective: false,
    position: pos,
    use_regex: false,
    extensions: {
      position: stPos,
      depth,
      role: 0,
      exclude_recursion: true,
      prevent_recursion: true,
      delay_until_recursion: false,
      display_index: id,
      probability: 100,
      useProbability: true,
      selectiveLogic: 0,
      group: '',
      group_override: false,
      group_weight: 100,
      scan_depth: null,
      case_sensitive: false,
      match_whole_words: false,
      use_group_scoring: false,
      automation_id: '',
      vectorized: false,
      sticky: 0,
      cooldown: 0,
      delay: 0
    }
  }
}

/**
 * 解析并校验 世界书条目/01..06
 * @param {string} [loreDir]
 * @returns {object[]}
 */
function loadFormalWorldbookEntries(loreDir = path.join(__dirname, '..', '世界书条目')) {
  const files = fs.readdirSync(loreDir).filter(f => /^0[1-6]_.*\.md$/.test(f)).sort()
  if (files.length !== 6) {
    throw new Error(`预期 01..06 共 6 份世界书源文件，实际找到 ${files.length} 份`)
  }

  const rawEntries = []
  for (const file of files) {
    const raw = fs.readFileSync(path.join(loreDir, file), 'utf8')
    let match
    ENTRY_BLOCK_RE.lastIndex = 0
    while ((match = ENTRY_BLOCK_RE.exec(raw)) !== null) {
      const meta = JSON.parse(match[1])
      const content = match[2].trim()
      if (!meta.comment || !Array.isArray(meta.keys) || typeof meta.order !== 'number') {
        throw new Error(`世界书条目元数据不完整 (${file}): ${match[1]}`)
      }
      if (!content) {
        throw new Error(`世界书条目正文为空 (${file} / ${meta.comment})`)
      }
      if (/\{\{getvar::/i.test(content)) {
        throw new Error(`世界书条目残留失效宏 (${file} / ${meta.comment})`)
      }
      rawEntries.push({ meta, content })
    }
  }

  return rawEntries.map((item, index) => buildEntry(index, item.meta, item.content))
}

module.exports = { loadFormalWorldbookEntries }
