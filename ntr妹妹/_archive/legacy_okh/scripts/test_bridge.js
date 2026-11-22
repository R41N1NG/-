/**
 * test_bridge.js — GPT 核心接入验证
 *
 * 验证三件事：
 *   1. GPT 的 9 个文件能原样加载，与我们的系统不冲突
 *   2. 桥接能把 okh 状态翻成 world，再翻回来
 *   3. GPT 的 advance 能真的推进时间、执行行动
 *
 * 运行：node scripts/test_bridge.js
 */

globalThis.window = globalThis

const fs = require('fs')
const path = require('path')

let pass = 0, fail = 0
const fails = []

function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else {
    fail++; fails.push(name)
    console.log(`  ✗ ${name}` + (detail !== undefined ? `  → ${JSON.stringify(detail)}` : ''))
  }
}

console.log('\n══════════════════════════════════════')
console.log('  GPT 核心接入验证')
console.log('══════════════════════════════════════\n')

// ---------- 1. 加载我们的系统 ----------
console.log('【一】加载原有系统')
const OUR = ['0_okh_boot.js','1_okh_core.js','2_okh_schema.js','3_okh_rules.js',
  '4_okh_agency.js','5_okh_presence.js','6_okh_translate.js','7_okh_turn.js',
  '8_okh_hud.js','9_okh_debug.js','10_okh_data.js','11_okh_event.js']
try {
  OUR.forEach(f => require('../tavern_scripts/' + f))
  check('原有 12 个模块加载成功', !!window.__OKH__)
} catch (e) {
  check('原有模块加载', false, e.message)
}

// ---------- 2. 加载 GPT 核心（原样拼接版）----------
console.log('\n【二】加载 GPT 核心')
try {
  require('../gpt_core/gpt_core_all.js')
  check('gpt_core_all 加载成功', true)
} catch (e) {
  check('gpt_core_all 加载', false, e.message)
}

check('OKHBackground 已注册', !!window.OKHBackground)
check('OKHBackgroundAdapter 已注册', !!window.OKHBackgroundAdapter)
check('模块注册表存在', !!window.OKHBackgroundModules)
check('9 个模块全部注册',
  ['utils','rules','activity','effects','events','nodes','turn'].every(k => !!window.OKHBackgroundModules[k]),
  Object.keys(window.OKHBackgroundModules || {}))
check('未污染原有注册表', !!window.__OKH__ && !window.__OKH__.modules.okh_utils)

// ---------- 3. 加载桥接 ----------
console.log('\n【三】加载桥接层')
try {
  require('../tavern_scripts/13_bridge_gpt.js')
  check('桥接加载成功', !!window.OKH_BRIDGE)
} catch (e) {
  check('桥接加载', false, e.message)
}

const B = window.OKH_BRIDGE
const M = window.__OKH__.modules

// ---------- 4. 初始化数据 ----------
console.log('\n【四】初始化')
M.data.seed(true)
check('原有数据已装载', Object.keys(M.core.read('npcs', {})).length === 5)

const world0 = B.buildWorld()
check('buildWorld 产出 5 人', Object.keys(world0.npcs).length === 5, Object.keys(world0.npcs))
check('时间已映射', world0.timeMin === M.core.read('sys.total_min'))
check('玩家位置已映射', world0.playerLocation === M.core.read('player.room_id'))
check('阶段映射为数字', typeof world0.npcs.aurora.stage === 'number')
check('驱动力进了 values', typeof world0.npcs.aurora.values.need === 'number')
check('底线已带过来', Array.isArray(world0.npcs.aurora._lines))

// ---------- 5. 配置生成 ----------
console.log('\n【五】配置生成')
const config = B.buildConfig()
check('时段从 0 开始', config.phases[0].start === 0, config.phases[0])
check('时段递增', config.phases.every((p, i) => i === 0 || p.start > config.phases[i-1].start))
check('保护期已配', config.policy.ordinaryGraceMin === 120)
check('行动已转换', config.actions.length >= 15, config.actions.length)

const sample = config.actions.find(a => a.id === 'work_shift')
check('requires.drives 已转成 when.metrics', !!sample?.when?.metrics?.need, sample?.when)
check('effects.drives 已转成 effects.add', sample?.effects?.add?.need === -12, sample?.effects)
check('blockedBy 已保留给 allowed 钩子', Array.isArray(sample?._blockedBy))

// ---------- 6. GPT init ----------
console.log('\n【六】GPT 初始化')
let world
try {
  const clean = { ...world0 }
  delete clean.bg
  world = window.OKHBackground.init(clean, config)
  check('init 成功', !!world.bg, world.bg)
  check('bg 版本为 2', world.bg.version === 2)
  check('bg 数据结构完整',
    !!world.bg.receipts && !!world.bg.fired && Array.isArray(world.bg.queue))
} catch (e) {
  check('init 成功', false, e.message)
  process.exit(1)
}

// ---------- 7. advance ----------
console.log('\n【七】推演')
const before = world.timeMin
let result
try {
  result = window.OKHBackground.advance(world, {
    id: 'test-msg-1',
    revision: 'r1',
    toMin: before + 240,
    interactingIds: [],
    front: null
  }, config)
  check('advance 成功', !result.duplicate, result.duplicate)
  check('时间推进了', result.state.timeMin > before, { before, after: result.state.timeMin })
} catch (e) {
  check('advance 成功', false, e.message)
}

// ---------- 8. 回写 ----------
console.log('\n【八】回写 okh')
if (result) {
  const npcBefore = JSON.parse(JSON.stringify(M.core.read('npcs', {})))
  B.commitWorld(result.state)
  const npcAfter = M.core.read('npcs', {})

  check('时间已回写', M.core.read('sys.total_min') === result.state.timeMin,
    { okh: M.core.read('sys.total_min'), gpt: result.state.timeMin })
  check('位置已回写',
    npcAfter.aurora.location === result.state.npcs.aurora.location,
    { okh: npcAfter.aurora.location, gpt: result.state.npcs.aurora.location })
  check('bg 已存档', !!M.core.read('gpt.bg', null))

  const changed = Object.keys(npcAfter).some(id =>
    npcAfter[id].corruption !== npcBefore[id].corruption ||
    npcAfter[id].location !== npcBefore[id].location ||
    JSON.stringify(npcAfter[id].drives) !== JSON.stringify(npcBefore[id].drives)
  )
  check('至少一人的状态有变化', changed)
}

// ---------- 9. 幂等 ----------
console.log('\n【九】幂等与重复提交')
if (result) {
  const again = window.OKHBackground.advance(result.state, {
    id: 'test-msg-1',
    revision: 'r1',
    toMin: before + 240,
    interactingIds: [],
    front: null
  }, config)
  check('同一消息重复提交被识别为 duplicate', again.duplicate === true)
}

// ---------- 10. 模式切换 ----------
console.log('\n【十】模式切换')
check('初始为 legacy 模式', B.mode === 'legacy', B.mode)
B.switchTo('gpt')
check('切到 gpt 模式', B.mode === 'gpt', B.mode)
B.switchTo('legacy')
check('切回 legacy 模式', B.mode === 'legacy', B.mode)

// ---------- 11. 待演绎队列 ----------
console.log('\n【十一】待演绎队列')
if (result) {
  const batch = window.OKHBackground.prepare(result.state, 8)
  check('prepare 返回结构完整',
    Array.isArray(batch.ids) && typeof batch.text === 'string')
}

// ---------- 结果 ----------
console.log('\n══════════════════════════════════════')
console.log(`  结果：${pass} 通过 / ${fail} 失败`)
console.log('══════════════════════════════════════')

if (fail === 0) {
  console.log('\n接入成功。GPT 核心与本项目可以共存，桥接能双向翻译。')
} else {
  console.log('\n失败项：')
  fails.forEach(f => console.log('  - ' + f))
  process.exitCode = 1
}
console.log('')
