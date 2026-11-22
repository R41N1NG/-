/**
 * @module      okh_translate
 * @updated     2026-11-08 20:08
 * @status      active
 * @reason      把数字翻译成人话。AI 只能看描述，不能看数值——否则它会开始演数字
 * @deps        ['okh_boot', 'okh_schema']
 * @provides    { bandOf, dominantDrive, describe, writeCharD1, textFor }
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) { console.error('[OKH] okh_translate 加载失败'); return }

  // ============================================================
  // 一、通用文本矩阵（不针对任何角色）
  //   行 = 堕落区间；列 = 当前最强烈的驱动力
  // ============================================================

  const MATRIX = {
    '0-29': {
      duty:    '照旧把该做的事一件件做完，只是偶尔会停下来出神。',
      pride:   '嘴上一点不让，行事却比从前小心了几分。',
      need:    '把钱袋翻了又翻，还是不够，只能再想办法。',
      fear:    '总觉得背后有人在看她，回头又什么都没有。',
      shame:   '说话时会突然收声，像是怕被人多看一眼。',
      lust:    '有时会走神，回过神来自责地摇摇头。',
      curiosity:'听见新鲜事就忍不住多问两句。',
      loyalty: '会不自觉地往某个人身边靠。',
      default: '和从前没什么两样，只是话比过去少了些。'
    },
    '30-54': {
      duty:    '她开始找理由晚归，说辞一次比一次顺。',
      pride:   '还硬撑着，但已经开始避开某些人的目光。',
      need:    '数字越算越紧，她开始接一些从前不会接的活。',
      fear:    '回家后会把门反复检查两遍。',
      shame:   '被人碰到手会猛地缩回去，然后装作没事。',
      lust:    '有些念头赶不走，她不承认，但也不再反驳自己。',
      curiosity:'开始主动往以前不敢去的地方走。',
      loyalty: '对某个人说的话越来越少，怕说漏。',
      default: '细看能发现她变了，但她自己还在说没事。'
    },
    '55-79': {
      duty:    '该做的照做，只是做的时候脸上没什么表情。',
      pride:   '不再争辩了，别人说什么她都点头。',
      need:    '钱一到手就花出去，像是不想留证据。',
      fear:    '很少单独出门，出门必带东西防身。',
      shame:   '已经不太遮了，但也不看人。',
      lust:    '身体比嘴先有反应，她自己也知道。',
      curiosity:'什么都想试试，代价不太在乎了。',
      loyalty: '对过去在意的人和事，开始用"算了"两个字打发。',
      default: '她还是那个人，但壳子空了。'
    },
    '80-100': {
      duty:    '该做的事还做，像在完成某种仪式。',
      pride:   '已经不提以前的身份了。',
      need:    '不再数钱了，够用就行。',
      fear:    '什么都不怕了，这反而让人担心。',
      shame:   '不再遮掩，也不解释。',
      lust:    '这成了她仅剩的、能确认自己还活着的东西。',
      curiosity:'什么都试过了，没什么新鲜的了。',
      loyalty: '她还在守着某样东西，只是说不清是什么。',
      default: '她还在，只是已经不是原来那个人了。'
    }
  }

  /** 区间名 */
  function bandOf(corruption) {
    if (corruption >= 80) return '80-100'
    if (corruption >= 55) return '55-79'
    if (corruption >= 30) return '30-54'
    return '0-29'
  }

  /**
   * 找当前最强烈的驱动力
   * @param {object} npc
   * @returns {string}
   */
  function dominantDrive(npc) {
    const entries = Object.entries(npc.drives || {})
    if (!entries.length) return 'default'
    entries.sort((a, b) => b[1] - a[1])
    return entries[0][0]
  }

  /**
   * 取描述句
   * @param {object} npc
   * @returns {string}
   */
  function describe(npc) {
    const band = bandOf(npc.corruption)
    const drive = dominantDrive(npc)
    const row = MATRIX[band] || MATRIX['0-29']
    return row[drive] || row.default
  }

  /**
   * 取完整文本（含前置标签）
   * @param {object} npc
   * @returns {string}
   */
  function textFor(npc) {
    return `【近期状态】${describe(npc)}`
  }

  /**
   * 写入 char_d1 变量：原文 + 追加描述
   * @param {string} id
   * @param {object} npc
   * @param {function} read
   * @param {function} write
   * @returns {string} 最终写入的文本
   */
  function writeCharD1(id, npc, read, write) {
    // base_d1 存的是一个对象（{id: 文本}），不是扁平路径
    const baseMap = read('base_d1', {}) || {}
    const base = baseMap[id] || npc.baseText || ''
    const extra = textFor(npc)
    const final = base ? `${base}\n\n${extra}` : extra
    write(`char_d1_${id}`, final)
    return final
  }

  REG.modules.translate = { MATRIX, bandOf, dominantDrive, describe, textFor, writeCharD1 }

  console.log('[OKH] translate 已就绪 · 4 区间 × 9 驱动力 = 36 种通用描述')
})()
