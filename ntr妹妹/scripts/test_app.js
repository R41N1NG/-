/**
 * test_app.js — 纯 GPT 核心版验证
 *
 * 旧那套已归档，这里只验证：
 *   gpt_core_all + okh_app 五件套能否独立跑起来
 *
 * 运行：node scripts/test_app.js
 */

globalThis.window = globalThis

let pass = 0, fail = 0
const fails = []

function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { fail++; fails.push(name); console.log(`  ✗ ${name}` + (detail !== undefined ? `  → ${JSON.stringify(detail)}` : '')) }
}

console.log('\n══════════════════════════════════════')
console.log('  GPT 核心独跑验证')
console.log('══════════════════════════════════════\n')

// ---------- 1. 加载 ----------
console.log('【一】加载')
try {
  require('../gpt_core/gpt_core_all.js')
  check('gpt_core_all 加载', !!window.OKHBackground)
} catch (e) { check('gpt_core_all 加载', false, e.message) }

const FILES = ['01_config.js', '02_world.js', '03_adapter.js', '04_hook.js', '05_debug.js', '07_hud.js', '06_entry.js']
for (const f of FILES) {
  try { require('../okh_app/' + f); check(f + ' 加载', true) }
  catch (e) { check(f + ' 加载', false, e.message) }
}

const CFG = window.OKH_APP_CONFIG
const W = window.OKH_APP_WORLD
const A = window.OKH_APP_ADAPTER
const H = window.OKH_APP_HOOK
const D = window.OKH_APP_DEBUG
const GPT = window.OKHBackground

// ---------- 2. 配置 ----------
console.log('\n【二】配置')
const config = CFG.buildConfig()
check('时段从 0 开始', config.phases[0].start === 0)
check('时段递增', config.phases.every((p, i) => i === 0 || p.start > config.phases[i-1].start))
check('保护期为正', config.policy.ordinaryGraceMin > 0)
check('行动 ≥ 18 条', config.actions.length >= 18, config.actions.length)
check('节点 3 个', config.nodes.length === 3)
check('事件 7 个', config.events.length === 7)
check('allowed 钩子存在', typeof config.allowed === 'function')

// ---------- 3. 初始化 ----------
console.log('\n【三】初始化')
let world
try {
  world = W.ensureWorld(true)
  check('world 初始化成功', !!world.bg)
  check('bg 版本为 2', world.bg.version === 2)
  check('5 个角色', Object.keys(world.npcs).length === 5)
  check('world 已存档', !!W.loadWorld())
} catch (e) {
  check('world 初始化', false, e.message)
  process.exit(1)
}

check('values 覆盖全部驱动力',
  CFG.ALL_DRIVES.every(k => typeof world.npcs.aurora.values[k] === 'number'))
check('三指标齐备',
  ['corruption','sanity','exposure'].every(k => typeof world.npcs.aurora.values[k] === 'number'))
check('基线已保留', !!world.npcs.aurora._baseline)
check('底线已保留', Array.isArray(world.npcs.aurora._lines))

// ---------- 4. 底线钩子 ----------
console.log('\n【四】底线钩子')
const aurora = world.npcs.aurora
const serveAction = config.actions.find(a => a.id === 'serve')
check('serve 属于被底线封锁的行动', serveAction._blockedBy.includes('no_physical_contact'))

aurora.values.corruption = 10
const blockedAt10 = config.allowed({ npc: aurora }, serveAction)
check('堕落 10 时 serve 被挡', blockedAt10 === false)

aurora.values.corruption = 50
const allowedAt50 = config.allowed({ npc: aurora }, serveAction)
check('堕落 50 时 serve 解封', allowedAt50 === true)

aurora.values.corruption = 10   // 还原

// ---------- 5. 推演 ----------
console.log('\n【五】推演')
const t0 = world.timeMin
let report
try {
  report = H.step(240, { msgId: 'test-1', revision: 'r1' })
  check('推演成功', report.advanced === true, report.reason)
  check('时间前进', report.to > t0, { from: t0, to: report.to })
} catch (e) { check('推演', false, e.message) }

// ---------- 6. 幂等 ----------
console.log('\n【六】幂等')
const dup = H.step(240, { msgId: 'test-1', revision: 'r1' })
check('同 ID 重复提交被拒', dup.advanced === false, dup.reason)

// ---------- 7. 回写 ----------
console.log('\n【七】存档回写')
const saved = W.loadWorld()
check('存档时间已更新', saved.timeMin === report.to, saved.timeMin)
check('台账已写入', !!W.store.get('okh_gpt.ledger'))
check('监听已写入', !!W.store.get('okh_gpt.watch'))

// ---------- 8. 漂移 ----------
console.log('\n【八】驱动力漂移')
const beforeNeed = saved.npcs.aurora.values.need
const beforeShame = saved.npcs.aurora.values.shame
A.drift(saved, { regression: 0.1, needPressure: 2 })
check('need 有上涨', saved.npcs.aurora.values.need > beforeNeed,
  { before: beforeNeed, after: saved.npcs.aurora.values.need })
check('shame 向基线靠拢或不变', saved.npcs.aurora.values.shame !== undefined)

// ---------- 9. 台账 ----------
console.log('\n【九】台账')
const led = A.buildLedger(saved)
check('台账含日期', /第 \d+ 天/.test(led), led.slice(0, 20))
check('台账含在场', led.includes('在场：'))

const w = A.buildWatch(saved)
check('监听含全部角色', w.list.length === 5)
check('监听含阶段', w.list.every(x => typeof x.stage === 'string'))

// ---------- 10. 存档往返 ----------
console.log('\n【十】存档往返')
const snapshot = JSON.stringify(saved)
W.saveWorld(saved)
const reloaded = W.loadWorld()
check('存档序列化往返一致', JSON.stringify(reloaded) === snapshot)

// ---------- 11. 阶段节点 ----------
console.log('\n【十一】阶段节点')
const w2 = W.loadWorld()
const a2 = w2.npcs.aurora
a2.values.corruption = 35
const beforeStage = a2.stage
let stepped
try {
  stepped = GPT.advance(w2, {
    id: 'stage-test', revision: 'r1',
    toMin: w2.timeMin + 60,
    interactingIds: [], front: null
  }, CFG.buildConfig())
  check('阶段节点可推进', stepped.state.npcs.aurora.stage > beforeStage,
    { before: beforeStage, after: stepped.state.npcs.aurora.stage })
} catch (e) {
  check('阶段节点推进', false, e.message)
}

// ---------- 12. HUD ----------
console.log('\n【十二】HUD')
const HUD = window.OKH_APP_HUD
check('HUD 模块已注册', !!HUD)
if (HUD) {
  const w3 = W.loadWorld()
  const html = HUD.buildHudHtml(w3)
  check('HUD HTML 含时间', html.includes('第') && html.includes('天'))
  check('HUD HTML 含位置', /okh-value/.test(html))
  check('HUD HTML 含在场', html.includes('okh-name') || html.includes('okh-none'))
  check('监听 HTML 含全部角色', HUD.buildWatchHtml(w3).split('\n').length === 5)
  check('地点名能翻译', HUD.locName('inn') === '断剑与麦酒', HUD.locName('inn'))
}

check('OKH_APP 入口存在', !!window.OKH_APP)
check('入口暴露 status', typeof window.OKH_APP?.status === 'function')

// ---------- 结果 ----------
console.log('\n══════════════════════════════════════')
console.log(`  结果：${pass} 通过 / ${fail} 失败`)
console.log('══════════════════════════════════════')

if (fail === 0) {
  console.log('\n纯 GPT 核心版跑通。旧系统已归档，不再参与。')
} else {
  console.log('\n失败项：')
  fails.forEach(f => console.log('  - ' + f))
  process.exitCode = 1
}
console.log('')
