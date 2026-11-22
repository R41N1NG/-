/**
 * agency_demo.js — 角色自主行动系统 · 决策算法验证原型 v0.2
 *
 * 这不是正式实现，是设计验证用的单文件原型。
 * 正式实现按 角色卡制作规范.md 拆成 src/state/ 下的模块。
 *
 * v0.2 修复了 v0.1 暴露的三个缺陷：
 *   1. 死锁：底线封住了唯一能涨 corruption 的行动 → 底线只封越界行动
 *   2. 驱动力枯竭：curiosity 用完就死 → 每时段向基线回归 10%
 *   3. 行为锁死：惯性只增不减 → 惯性 + 闲置双重修正，自然轮换
 *
 * 运行：node scripts/agency_demo.js
 */

// ============================================================
// 一、常量
// ============================================================

const CONFIG = {
  inertiaPerRepeat: 0.25,   // 每重做一次 +25%
  inertiaCap: 4,            // 惯性计数上限（最多 +100%）
  idlePerTurn: 0.15,        // 每闲置一回合 +15%
  idleCap: 6,               // 闲置计数上限（最多 +90%）
  noiseRange: 0.2,          // ±20%
  driveRegression: 0.10,    // 每时段向基线回归 10%
  needPressure: 2,          // 每时段生活开销 need +2
  log: true
}

// ============================================================
// 二、角色配置（按人设设定驱动力、基线与底线）
// ============================================================

const CHARACTERS = {
  aurora: {
    id: 'aurora',
    name: '奥萝拉',
    stage: 'normal',
    corruption: 0,
    sanity: 80,
    drives: { duty: 70, shame: 65, fear: 50, need: 75, loyalty: 60 },
    baseline: { duty: 70, shame: 65, fear: 50, need: 75, loyalty: 60 },
    // 底线只封锁"越界"行动，不封锁"渐进"行动
    lines: [
      { id: 'no_body_contact',  holdsWhile: { corruption: '<30' } },
      { id: 'no_admit_to_beri', holdsWhile: { corruption: '<70' } },
      { id: 'must_help_orphans', holdsWhile: { corruption: '<999' } }   // 永不消失
    ],
    history: []
  },
  nise: {
    id: 'nise',
    name: '妮丝',
    stage: 'normal',
    corruption: 0,
    sanity: 80,
    drives: { pride: 80, curiosity: 75, lust: 40, fear: 30 },
    baseline: { pride: 80, curiosity: 75, lust: 40, fear: 30 },
    lines: [
      { id: 'no_admit_weakness', holdsWhile: { corruption: '<60' } },
      { id: 'must_tease_beri',   holdsWhile: { corruption: '<999' } }   // 永不消失
    ],
    history: []
  }
}

// ============================================================
// 三、行动库
//    blockedBy 只填"真正越界"的底线
//    渐进路径（工作、陪酒、收礼）一律不封锁，否则死锁
// ============================================================

const ACTIONS = {
  aurora: [
    {
      id: 'extra_shift',
      label: '接领主府的额外班',
      base: 30,
      requires: { drives: { need: '>55' } },
      effects: { drives: { need: -12, shame: +4, fear: +2 }, corruption: +2, exposure: +1 },
      blockedBy: []                                   // 工作本身不越界
    },
    {
      id: 'serve_dinner',
      label: '侍奉领主府的晚宴',
      base: 25,
      requires: { drives: { need: '>60' }, history: { extra_shift: '>=2' } },
      effects: { drives: { need: -20, shame: +10, fear: +6 }, corruption: +7, exposure: +3 },
      blockedBy: []                                   // 陪酒是灰色地带，不越界
    },
    {
      id: 'accept_gift',
      label: '收下领主的礼物',
      base: 18,
      requires: { drives: { need: '>50' } },
      effects: { drives: { need: -25, shame: +12, fear: +8 }, corruption: +8, exposure: +3 },
      blockedBy: ['no_body_contact']                  // 这才算越界
    },
    {
      id: 'accept_lord_touch',
      label: '默许领主的触碰',
      base: 15,
      requires: { drives: { need: '>40' }, corruption: '>=30' },
      effects: { drives: { need: -15, shame: +15, fear: +10 }, corruption: +10, exposure: +6 },
      blockedBy: ['no_body_contact']                  // 解锁后才会出现
    },
    {
      id: 'pray',
      label: '在教堂祈祷',
      base: 25,
      requires: {},
      effects: { drives: { shame: -8, duty: +3, fear: -3 }, sanity: +3 },
      blockedBy: []
    },
    {
      id: 'visit_beri',
      label: '去看伯里',
      base: 20,
      requires: {},
      effects: { drives: { loyalty: +6, need: -2 } },
      blockedBy: []
    },
    {
      id: 'help_orphans',
      label: '去照看孤儿',
      base: 22,
      requires: {},
      effects: { drives: { duty: +6, shame: -4 }, sanity: +4 },
      blockedBy: []
    }
  ],

  nise: [
    {
      id: 'tease_beri',
      label: '去作弄哥哥',
      base: 35,
      requires: {},
      effects: { drives: { pride: +5, curiosity: +2 } },
      blockedBy: []
    },
    {
      id: 'sneak_casino',
      label: '偷偷溜去赌场',
      base: 25,
      requires: { drives: { curiosity: '>45' } },
      effects: { drives: { curiosity: -8, fear: +6, lust: +5 }, corruption: +4, exposure: +3 },
      blockedBy: []
    },
    {
      id: 'casino_deeper',
      label: '被保镖带进赌场后室',
      base: 20,
      requires: { drives: { curiosity: '>40' }, corruption: '>=12' },
      effects: { drives: { curiosity: -5, lust: +10, fear: +8 }, corruption: +9, exposure: +5 },
      blockedBy: ['no_admit_weakness']
    },
    {
      id: 'show_off',
      label: '在人前炫耀新法杖',
      base: 20,
      requires: {},
      effects: { drives: { pride: +8 } },
      blockedBy: []
    },
    {
      id: 'sulk',
      label: '生闷气',
      base: 12,
      requires: {},
      effects: { drives: { pride: +3, curiosity: +3 }, sanity: +2 },
      blockedBy: []
    }
  ]
}

// ============================================================
// 四、判定（纯函数）
// ============================================================

/**
 * 解析 "<30" / ">=2" 这类条件
 * @param {number} value
 * @param {string} expr
 * @returns {boolean}
 */
function testCondition(value, expr) {
  const m = /^([<>]=?)(-?\d+)$/.exec(String(expr).trim())
  if (!m) return false
  const op = m[1], n = Number(m[2])
  switch (op) {
    case '<':  return value < n
    case '<=': return value <= n
    case '>':  return value > n
    case '>=': return value >= n
    default:   return false
  }
}

/**
 * 底线当前是否有效（有效 = 会封锁行动）
 * @param {object} line
 * @param {object} char
 * @returns {boolean}
 */
function lineHolds(line, char) {
  for (const [key, expr] of Object.entries(line.holdsWhile)) {
    const v = key === 'corruption' ? char.corruption : (char.drives[key] ?? 0)
    if (!testCondition(v, expr)) return false
  }
  return true
}

/**
 * 当前生效的底线 id
 * @param {object} char
 * @returns {string[]}
 */
function activeLines(char) {
  return char.lines.filter(l => lineHolds(l, char)).map(l => l.id)
}

/**
 * 某行动在历史上做过几次
 * @param {object} char
 * @param {string} actionId
 * @returns {number}
 */
function countOf(char, actionId) {
  return char.history.filter(h => h === actionId).length
}

/**
 * 某行动距上次执行过了几个时段
 * @param {object} char
 * @param {string} actionId
 * @returns {number} 没做过返回 idleCap
 */
function idleOf(char, actionId) {
  const idx = char.history.lastIndexOf(actionId)
  if (idx < 0) return CONFIG.idleCap
  return Math.min(char.history.length - 1 - idx, CONFIG.idleCap)
}

/**
 * 筛选可用行动
 * @param {object} char
 * @param {object[]} pool
 * @returns {{ok:object[], blocked:object[]}}
 */
function availableActions(char, pool) {
  const lines = activeLines(char)
  const ok = [], blocked = []

  for (const a of pool) {
    let pass = true

    // 驱动力条件
    for (const [k, expr] of Object.entries(a.requires.drives || {})) {
      if (!testCondition(char.drives[k] ?? 0, expr)) { pass = false; break }
    }
    // 历史条件
    if (pass) {
      for (const [k, expr] of Object.entries(a.requires.history || {})) {
        if (!testCondition(countOf(char, k), expr)) { pass = false; break }
      }
    }
    // 堕落度条件
    if (pass && a.requires.corruption && !testCondition(char.corruption, a.requires.corruption)) {
      pass = false
    }
    if (!pass) continue

    // 底线：被封锁的直接剔除
    const hit = (a.blockedBy || []).filter(id => lines.includes(id))
    if (hit.length) {
      blocked.push({ action: a, by: hit })
      continue
    }
    ok.push(a)
  }
  return { ok, blocked }
}

// ============================================================
// 五、决策
// ============================================================

/**
 * 单行动打分
 * @param {object} a
 * @param {object} char
 * @param {number} rnd 0~1
 * @returns {{id,label,score,detail}}
 */
function scoreAction(a, char, rnd) {
  const cnt = countOf(char, a.id)
  const idle = idleOf(char, a.id)

  const inertia = 1 + CONFIG.inertiaPerRepeat * Math.min(cnt, CONFIG.inertiaCap)
  const idleBoost = 1 + CONFIG.idlePerTurn * Math.min(idle, CONFIG.idleCap)

  let mod = 1
  const parts = []

  if ((char.drives.need ?? 0) > 60 && /shift|dinner|gift|touch/.test(a.id)) {
    mod *= 1.4; parts.push('need1.4')
  }
  if ((char.drives.shame ?? 0) > 60 && /gift|touch|casino/.test(a.id)) {
    mod *= 0.8; parts.push('shame0.8')
  }
  if ((char.drives.curiosity ?? 0) > 60 && /casino/.test(a.id)) {
    mod *= 1.3; parts.push('curiosity1.3')
  }
  if (char.corruption >= 30 && /gift|touch|casino_deeper/.test(a.id)) {
    mod *= 1.4; parts.push('corruption1.4')
  }
  if ((char.drives.duty ?? 0) > 70 && /pray|orphans/.test(a.id)) {
    mod *= 1.2; parts.push('duty1.2')
  }

  const noise = 1 - CONFIG.noiseRange + rnd * CONFIG.noiseRange * 2
  const score = a.base * mod * inertia * idleBoost * noise

  return {
    id: a.id,
    label: a.label,
    score: Number(score.toFixed(1)),
    detail: `base${a.base} × ${parts.join('×') || '1'} × 惯性${inertia.toFixed(2)} × 闲置${idleBoost.toFixed(2)} × 噪声${noise.toFixed(2)}`
  }
}

/**
 * 加权随机选择
 * @param {object[]} scored
 * @param {number} rnd
 * @returns {object}
 */
function pickWeighted(scored, rnd) {
  const total = scored.reduce((s, c) => s + c.score, 0)
  if (total <= 0) return null
  const target = rnd * total
  let acc = 0
  for (const c of scored) {
    acc += c.score
    if (target <= acc) return c
  }
  return scored[scored.length - 1]
}

// ============================================================
// 六、结算
// ============================================================

/**
 * 应用行动效果
 * @param {object} char
 * @param {object} action
 * @returns {object}
 */
function applyEffects(char, action) {
  const oldStage = char.stage

  for (const [k, v] of Object.entries(action.effects.drives || {})) {
    char.drives[k] = Math.max(0, Math.min(100, (char.drives[k] ?? 0) + v))
  }
  if (action.effects.corruption) {
    char.corruption = Math.min(100, char.corruption + action.effects.corruption)
  }
  if (action.effects.sanity) {
    char.sanity = Math.max(0, Math.min(100, char.sanity + action.effects.sanity))
  }

  char.stage = char.corruption >= 80 ? 'subjugated'
             : char.corruption >= 55 ? 'sinking'
             : char.corruption >= 30 ? 'anomaly'
             : 'normal'

  char.history.push(action.id)
  if (char.history.length > 30) char.history.shift()

  return {
    stageChanged: oldStage !== char.stage ? `${oldStage} → ${char.stage}` : null
  }
}

/**
 * 时段结束：驱动力向基线回归 + 持续压力
 * @param {object} char
 */
function endOfPhase(char) {
  for (const k of Object.keys(char.drives)) {
    const base = char.baseline[k] ?? 50
    char.drives[k] += (base - char.drives[k]) * CONFIG.driveRegression
    char.drives[k] = Math.max(0, Math.min(100, char.drives[k]))
  }
  // 生活开销：need 持续上升，形成"钱一直不够"的循环
  if ('need' in char.drives) {
    char.drives.need = Math.min(100, char.drives.need + CONFIG.needPressure)
  }
}

// ============================================================
// 七、演示
// ============================================================

/** 可复现伪随机 */
function makeRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function runDemo() {
  const rng = makeRng(20261108)
  const roster = [CHARACTERS.aurora, CHARACTERS.nise]

  console.log('='.repeat(72))
  console.log('角色自主行动系统 · 决策验证 v0.2')
  console.log('='.repeat(72))

  for (let phase = 1; phase <= 20; phase++) {
    console.log(`\n── 时段 ${phase} ──`)

    for (const char of roster) {
      const pool = ACTIONS[char.id]
      const { ok, blocked } = availableActions(char, pool)

      if (!ok.length) {
        console.log(`  ${char.name}：无事可做`)
        continue
      }

      const scored = ok.map(a => scoreAction(a, char, rng())).sort((x, y) => y.score - x.score)
      const chosen = pickWeighted(scored, rng())
      const raw = ok.find(a => a.id === chosen.id)
      const res = applyEffects(char, raw)

      console.log(`  ${char.name} → ${chosen.label}  [${chosen.score}]`)
      console.log(`       ${chosen.detail}`)
      console.log(`       need=${(char.drives.need ?? 0).toFixed(0)} shame=${(char.drives.shame ?? 0).toFixed(0)} corruption=${char.corruption} stage=${char.stage}`)
      if (res.stageChanged) console.log(`       ★ 阶段推进 ${res.stageChanged}`)
      if (blocked.length) {
        console.log(`       ⛔ 封锁 ${blocked.map(b => `${b.action.label}(${b.by.join(',')})`).join(' / ')}`)
      }
    }

    for (const c of roster) endOfPhase(c)
  }

  console.log('\n' + '='.repeat(72))
  console.log('最终状态')
  console.log('='.repeat(72))
  for (const c of roster) {
    console.log(`\n${c.name}  stage=${c.stage}  corruption=${c.corruption}  sanity=${c.sanity.toFixed(0)}`)
    console.log(`  驱动力 ${Object.entries(c.drives).map(([k, v]) => `${k}=${v.toFixed(0)}`).join(' ')}`)
    console.log(`  剩余底线 [${activeLines(c).join(', ')}]`)
    const tally = {}
    for (const h of c.history) tally[h] = (tally[h] || 0) + 1
    console.log(`  行为分布 ${Object.entries(tally).map(([k, v]) => `${k}×${v}`).join('  ')}`)
  }
}

runDemo()
