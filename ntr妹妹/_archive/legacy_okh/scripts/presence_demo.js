/**
 * presence_demo.js — 角色出场调度 · 四闸门验证原型
 *
 * 验证 系统_角色出场调度设计.md 第四节：
 *   闸门1 空间 / 闸门2 日程 / 闸门3 剧情 / 闸门4 戏剧(限人数+优先级)
 *   外加：缺席规则优先级最高
 *
 * 运行：node scripts/presence_demo.js
 */

// ============================================================
// 一、世界定义
// ============================================================

const PLAYER_LOCATIONS = ['inn', 'town', 'manor', 'church', 'casino']

const CHARACTERS = [
  {
    id: 'aurora', name: '奥萝拉',
    location: 'church',
    schedule: {
      morning:    ['church', 'town'],
      afternoon:  ['manor', 'town'],
      night:      ['manor'],
      deep_night: ['manor']
    },
    presence: {
      mode: 'schedule',
      requires: {},
      absent: null,
      priority: 2,
      pursuitCooldown: 0,
      cues: { church: ['女仆装', '捧圣典'], manor: ['女仆装', '裙摆有酒渍'], town: ['女仆装', '拎着菜篮'] }
    }
  },
  {
    id: 'nise', name: '妮丝',
    location: 'casino',
    schedule: {
      morning:    ['inn', 'town'],
      afternoon:  ['town', 'casino'],
      night:      ['casino', 'inn'],
      deep_night: ['inn']
    },
    presence: {
      mode: 'trigger',
      requires: { flags: { casino_unlocked: true } },
      absent: null,
      priority: 1,
      pursuitCooldown: 0,
      cues: { casino: ['门口张望', '攥着筹码'], inn: ['躺在床上', '翻钱包'], town: ['抱着新法杖'] }
    }
  },
  {
    id: 'gulan', name: '古兰',
    location: 'inn',
    schedule: {
      morning:    ['inn', 'town'],
      afternoon:  ['town'],
      night:      ['inn'],
      deep_night: ['inn']
    },
    presence: {
      mode: 'schedule',
      requires: {},
      absent: null,
      priority: 3,
      pursuitCooldown: 0,
      cues: { inn: ['正在擦剑'], town: ['抱臂站在街口'] }
    }
  },
  {
    id: 'eileen', name: '艾琳',
    location: 'manor',
    schedule: {
      morning:    ['manor'],
      afternoon:  ['manor'],
      night:      ['manor'],
      deep_night: ['manor']
    },
    presence: {
      mode: 'pursuit',
      requires: { corruption: '>=0', flags: { eileen_arrived: true } },
      absent: { flags: { eileen_captive: true }, reason: '被软禁' },   // 缺席优先
      priority: 5,
      pursuitCooldown: 0,
      cues: { manor: ['制服整齐', '神色不安'] }
    }
  },
  {
    id: 'cecilia', name: '塞西莉亚',
    location: 'church',
    schedule: {
      morning:    ['church'],
      afternoon:  ['church', 'town'],
      night:      ['church'],
      deep_night: ['church']
    },
    presence: {
      mode: 'schedule',
      requires: {},
      absent: null,
      priority: 1,
      pursuitCooldown: 0,
      cues: { church: ['修女袍', '捧着圣典'], town: ['修女袍', '提着药篮'] }
    }
  }
]

const WORLD_FLAGS = {
  casino_unlocked: true,
  eileen_arrived: true,
  eileen_captive: true      // 艾琳已被软禁 → 绝不出场
}

const MAX_ON_STAGE = 3

// ============================================================
// 二、判定工具
// ============================================================

/**
 * 条件表达式
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
 * 闸门2：日程白名单
 * @param {object} char
 * @param {string} phase
 * @returns {boolean}
 */
function scheduleAllows(char, phase) {
  const allowed = char.schedule[phase]
  if (!allowed) return true
  return allowed.includes(char.location)
}

/**
 * 闸门3：剧情条件
 * @param {object} char
 * @param {object} flags
 * @returns {{pass:boolean, reason?:string}}
 */
function storyAllows(char, flags) {
  const req = char.presence.requires || {}
  for (const [k, v] of Object.entries(req.flags || {})) {
    if (flags[k] !== v) return { pass: false, reason: `flag ${k} 未满足` }
  }
  return { pass: true }
}

/**
 * 缺席规则：优先级最高
 * @param {object} char
 * @param {object} flags
 * @returns {string|null} 缺席原因，null 表示不缺席
 */
function absenceReason(char, flags) {
  const ab = char.presence.absent
  if (!ab) return null
  for (const [k, v] of Object.entries(ab.flags || {})) {
    if (flags[k] === v) return ab.reason || '缺席'
  }
  return null
}

// ============================================================
// 三、出场判定主流程
// ============================================================

/**
 * 计算某一时刻的在场名单
 * @param {object[]} chars
 * @param {object} ctx { location, phase, flags, phaseIndex }
 * @returns {object} { present, absent, offStage, rejected }
 */
function resolvePresence(chars, ctx) {
  const present = []
  const absent = []
  const rejected = []
  const candidates = []

  for (const char of chars) {
    // 缺席规则优先
    const abReason = absenceReason(char, ctx.flags)
    if (abReason) {
      absent.push({ id: char.id, name: char.name, reason: abReason })
      continue
    }

    // 闸门1：空间
    if (char.location !== ctx.location) {
      rejected.push({ id: char.id, name: char.name, gate: 1, reason: `在 ${char.location}，不在此处` })
      continue
    }

    // 闸门2：日程
    if (!scheduleAllows(char, ctx.phase)) {
      rejected.push({ id: char.id, name: char.name, gate: 2, reason: `${ctx.phase} 不该在 ${char.location}` })
      continue
    }

    // 闸门3：剧情
    const story = storyAllows(char, ctx.flags)
    if (!story.pass) {
      rejected.push({ id: char.id, name: char.name, gate: 3, reason: story.reason })
      continue
    }

    candidates.push(char)
  }

  // 闸门4：戏剧——按 priority 降序，同 priority 按久未出场优先
  candidates.sort((a, b) => {
    if (b.presence.priority !== a.presence.priority) {
      return b.presence.priority - a.presence.priority
    }
    const aSeen = a.presence.lastSeenAt ?? -999
    const bSeen = b.presence.lastSeenAt ?? -999
    return aSeen - bSeen
  })

  const onStage = candidates.slice(0, MAX_ON_STAGE)
  const offStage = candidates.slice(MAX_ON_STAGE)

  for (const c of onStage) {
    const cueList = (c.presence.cues && c.presence.cues[c.location]) || []
    present.push({
      id: c.id,
      name: c.name,
      distance: c.presence.mode === 'pursuit' ? 'near' : 'mid',
      cues: cueList
    })
    c.presence.lastSeenAt = ctx.phaseIndex
  }

  return {
    present,
    absent,
    offStage: offStage.map(c => ({ id: c.id, name: c.name, reason: '同场人数已满' })),
    rejected
  }
}

// ============================================================
// 四、渲染台账
// ============================================================

/**
 * 生成 <presence> 台账文本
 * @param {object} res 出场结果
 * @param {object} actives 其余角色（用于缺席列表）
 * @returns {string}
 */
function renderPresence(res, actives) {
  const lines = []
  if (res.present.length) {
    lines.push('在场：' + res.present.map(p => {
      const cues = p.cues.length ? '（' + p.cues.join('·') + '）' : ''
      return `${p.name}${cues}｜距离：${p.distance === 'near' ? '近' : '中'}`
    }).join('｜'))
  } else {
    lines.push('在场：无')
  }

  const away = actives.filter(c => !res.present.find(p => p.id === c.id))
  if (away.length) {
    lines.push('缺席：' + away.map(c => `${c.name}（${where(c)}）`).join('、'))
  }
  return lines.join('\n')
}

/**
 * 位置的中文名
 * @param {object} char
 * @returns {string}
 */
function where(char) {
  const map = { inn: '旅店', town: '镇上', manor: '领主府', church: '教堂', casino: '赌场' }
  return map[char.location] || char.location
}

// ============================================================
// 五、演示
// ============================================================

function runDemo() {
  console.log('='.repeat(72))
  console.log('角色出场调度 · 四闸门验证')
  console.log('='.repeat(72))

  const scenarios = [
    { name: '场景A：玩家在教堂 · 清晨', location: 'church', phase: 'morning' },
    { name: '场景B：玩家在教堂 · 深夜', location: 'church', phase: 'deep_night' },
    { name: '场景C：玩家在领主府 · 夜晚（艾琳被软禁）', location: 'manor', phase: 'night' },
    { name: '场景D：玩家在赌场 · 午后', location: 'casino', phase: 'afternoon' },
    { name: '场景E：玩家在旅店 · 深夜', location: 'inn', phase: 'deep_night' }
  ]

  scenarios.forEach((s, idx) => {
    console.log(`\n── ${s.name} ──`)
    const res = resolvePresence(CHARACTERS, {
      location: s.location,
      phase: s.phase,
      flags: WORLD_FLAGS,
      phaseIndex: idx
    })

    console.log(renderPresence(res, CHARACTERS))

    if (res.rejected.length) {
      console.log('  [被挡住的]')
      for (const r of res.rejected) {
        console.log(`    闸门${r.gate} · ${r.name}：${r.reason}`)
      }
    }
    if (res.offStage.length) {
      console.log(`  [挤出画面] ${res.offStage.map(o => o.name + '(' + o.reason + ')').join('、')}`)
    }
  })

  console.log('\n' + '='.repeat(72))
  console.log('闸门有效性检查')
  console.log('='.repeat(72))

  const checks = []

  // 检查1：远程角色不会凭空跟进
  const c1 = resolvePresence(CHARACTERS, { location: 'church', phase: 'morning', flags: WORLD_FLAGS, phaseIndex: 0 })
  checks.push({
    name: '闸门1 · 空间：不在场的角色不出现',
    pass: !c1.present.some(p => p.id === 'nise' || p.id === 'gulan')
  })

  // 检查2：深夜教堂不该有奥萝拉（日程是 manor）
  const c2 = resolvePresence(CHARACTERS, { location: 'church', phase: 'deep_night', flags: WORLD_FLAGS, phaseIndex: 1 })
  checks.push({
    name: '闸门2 · 日程：深夜奥萝拉不在教堂',
    pass: !c2.present.some(p => p.id === 'aurora')
  })

  // 检查3：缺席规则高于一切（艾琳被软禁）
  const c3 = resolvePresence(CHARACTERS, { location: 'manor', phase: 'night', flags: WORLD_FLAGS, phaseIndex: 2 })
  checks.push({
    name: '缺席规则：被软禁的艾琳绝不出场',
    pass: !c3.present.some(p => p.id === 'eileen') && c3.absent.some(a => a.id === 'eileen')
  })

  // 检查4：同场人数不超上限
  const c4 = resolvePresence(CHARACTERS, { location: 'church', phase: 'morning', flags: WORLD_FLAGS, phaseIndex: 3 })
  checks.push({
    name: `闸门4 · 戏剧：同场不超过 ${MAX_ON_STAGE} 人`,
    pass: c4.present.length <= MAX_ON_STAGE
  })

  let allPass = true
  for (const c of checks) {
    console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`)
    if (!c.pass) allPass = false
  }
  console.log(`\n${allPass ? '全部通过' : '存在未通过项'}`)
}

runDemo()
