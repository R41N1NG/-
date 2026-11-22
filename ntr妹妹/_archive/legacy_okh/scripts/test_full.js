/**
 * test_full.js — 全链路自测
 *
 * 在 Node 里模拟酒馆环境，把 11 个脚本全加载，跑 20 轮，验证：
 *   1. 所有模块能否正常加载
 *   2. 数据能否装载
 *   3. 全员能否决策（不报错）
 *   4. 行为是否有多样性（不卡在单一循环）
 *   5. 底线是否随堕落度逐步解锁
 *   6. 阶段是否推进
 *   7. 在场是否不超上限
 *   8. char_d1 是否被正确写入
 *
 * 运行：node scripts/test_full.js
 */

globalThis.window = globalThis

const FILES = [
  '0_okh_boot.js',
  '1_okh_core.js',
  '2_okh_schema.js',
  '3_okh_rules.js',
  '4_okh_agency.js',
  '5_okh_presence.js',
  '6_okh_translate.js',
  '7_okh_turn.js',
  '8_okh_hud.js',
  '9_okh_debug.js',
  '10_okh_data.js',
  '11_okh_event.js'
]

let pass = 0, fail = 0
const failures = []

function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else {
    fail++; failures.push(name)
    console.log(`  ✗ ${name}` + (detail !== undefined ? `  → ${JSON.stringify(detail)}` : ''))
  }
}

console.log('\n══════════════════════════════════════════════════')
console.log('  全链路自测')
console.log('══════════════════════════════════════════════════\n')

// ---------- 1. 加载 ----------
console.log('【一】模块加载')
for (const f of FILES) {
  try {
    require('../tavern_scripts/' + f)
  } catch (e) {
    console.log(`  ✗ ${f} 加载失败：${e.message}`)
    fail++
  }
}
const R = window.__OKH__
check('注册表存在', !!R)
const MODS = ['core', 'schema', 'rules', 'agency', 'presence', 'translate', 'turn', 'hud', 'debug', 'data', 'event']
for (const m of MODS) check(`模块 ${m} 已注册`, !!R.modules[m])

const { core, schema, rules, agency, presence, translate, turn, debug, data } = R.modules

// ---------- 2. 数据装载 ----------
console.log('\n【二】数据装载')
const seeded = data.seed(true)
check('seed 成功', seeded.seeded === true)
check('角色数量为 5', seeded.count === 5, seeded.count)
check('行动库非空', seeded.actions >= 15, seeded.actions)

const npcs = core.read('npcs', {})
check('npcs 可读取', Object.keys(npcs).length === 5)
check('world.flags 已初始化', typeof core.read('world.flags', null) === 'object')
check('sys.total_min 为 360', core.read('sys.total_min') === 360)
check('sys.phase 为 morning', core.read('sys.phase') === 'morning')

// 通用性检查：逻辑代码里不应出现任何角色名
console.log('\n【三】通用性检查')
const logicFiles = FILES.filter(f => !f.includes('data'))
const fs = require('fs')
const path = require('path')
const NAMES = ['aurora', 'nise', 'eileen', 'cecilia', 'gulan', '奥萝拉', '妮丝', '艾琳', '塞西莉亚', '古兰']
let hardCoded = []
for (const f of logicFiles) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'tavern_scripts', f), 'utf8')
  // 去掉注释后再查
  const stripped = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  for (const n of NAMES) {
    if (stripped.includes(n)) hardCoded.push(`${f} 含 "${n}"`)
  }
}
check('逻辑代码不含任何角色名', hardCoded.length === 0, hardCoded)

// ---------- 4. 决策 ----------
console.log('\n【四】决策')
const actions = core.read('actionLibrary', {})
let allDecided = true
for (const npc of Object.values(npcs)) {
  const res = agency.decide(npc, actions, { phase: 'morning', flags: {} })
  if (res.scored.length === 0) allDecided = false
}
check('每个角色都有候选行动', allDecided)

const sample = npcs['aurora']
const sampleRes = agency.decide(sample, actions, { phase: 'morning', flags: {} })
check('打分明细含必要字段', !!sampleRes.scored[0]?.detail?.base)
check('加权随机能选出结果', !!sampleRes.action)

// ---------- 5. 跑 60 轮（固定种子，保证可复现） ----------
console.log('\n【五】跑 60 轮推演')
const ROUNDS = 60

// 固定种子：不然每次跑结果不同，测不出稳定结论
let rng = 20261108
const rnd = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296 }

const histories = {}
for (let i = 0; i < ROUNDS; i++) {
  // 交替推进时段
  core.write('sys.total_min', core.read('sys.total_min', 0) + 240)
  core.write('sys.phase', turn.derivePhase(core.read('sys.total_min', 0)))
  turn.runTurn({ force: true, rnd })
}

const after = core.read('npcs', {})
for (const [id, n] of Object.entries(after)) {
  histories[id] = n.history || []
}

check(`${ROUNDS} 轮后角色仍在`, Object.keys(after).length === 5)

// 行为多样性：每人至少 3 种不同行为
let diverse = true
const diversityReport = {}
for (const [id, h] of Object.entries(histories)) {
  const uniq = new Set(h).size
  diversityReport[after[id].name] = `${uniq} 种 / ${h.length} 次`
  if (uniq < 3) diverse = false
}
check('每个角色行为 ≥3 种（无单一循环）', diverse, diversityReport)

// 至少一人堕落度上升
const anyCorrupt = Object.values(after).some(n => n.corruption > 0)
check('至少有角色堕落度上升', anyCorrupt,
  Object.values(after).map(n => `${n.name}:${n.corruption}`))

// 阶段推进
const anyStageUp = Object.values(after).some(n => n.stage !== 'normal')
check('至少一人阶段推进', anyStageUp,
  Object.values(after).map(n => `${n.name}:${n.stage}`))

// ---------- 6. 底线 ----------
console.log('\n【六】底线机制')
const aurora = after['aurora']
const lineIds = rules.activeLineIds(aurora)
check('底线列表可读', Array.isArray(lineIds))
check('永久底线仍在', lineIds.includes('keep_orphans'),
  { corruption: aurora.corruption, lines: lineIds })

// 构造一个必然被封锁的场景
const testNpc = schema.makeNpc('test', {
  drives: { need: 80, shame: 10 },
  corruption: 0,
  location: 'manor',
  actions: ['serve'],
  lines: [{ id: 'block', type: 'no_physical_contact', holdsWhile: { corruption: '<30' } }]
})
const blockedTest = rules.availableActions(testNpc, actions, { phase: 'night', flags: {} })
check('底线能封锁行动', blockedTest.ok.length === 0 && blockedTest.blocked.length === 1,
  { ok: blockedTest.ok.length, blocked: blockedTest.blocked.length })

// 解锁后应能执行
testNpc.corruption = 40
const unblockedTest = rules.availableActions(testNpc, actions, { phase: 'night', flags: {} })
check('堕落达标后底线解除', unblockedTest.ok.length === 1)

// ---------- 7. 在场 ----------
console.log('\n【七】在场判定')
const pres = debug.present()
check('在场人数不超过上限', pres.present.length <= presence.CONFIG.maxOnStage,
  pres.present.length)

// 构造 5 个同房间的人
const crowd = []
for (let i = 0; i < 5; i++) {
  crowd.push(schema.makeNpc('crowd' + i, { name: 'C' + i, location: 'manor', priority: i }))
}
const crowdRes = presence.resolve(crowd, { roomId: 'manor', phase: 'night', flags: {} })
check('5 人同场只上 3 人', crowdRes.present.length === 3, crowdRes.present.length)
check('被挤出的人有记录', crowdRes.offStage.length === 2)

// 缺席规则
const absentNpc = schema.makeNpc('miss', {
  name: 'M', location: 'manor',
  absent: { flags: { gone: true }, reason: '被软禁' }
})
const absRes = presence.resolve([absentNpc], { roomId: 'manor', phase: 'night', flags: { gone: true } })
check('缺席规则优先级最高', absRes.present.length === 0 && absRes.absent.length === 1)

// ---------- 8. 翻译 ----------
console.log('\n【八】数值转文本')
const d1 = core.read('char_d1_aurora', '')
check('char_d1 已写入', d1.length > 0)
check('char_d1 含原文', d1.includes((core.read('base_d1', {})['aurora'] || '').slice(0, 10)), d1.slice(0, 40))
check('char_d1 含状态描述', d1.includes('【近期状态】'))

// 四个区间都要有文本
const bands = [0, 40, 65, 90].map(c => {
  const fake = schema.makeNpc('x', { corruption: c, drives: { duty: 70 } })
  return translate.describe(fake)
})
check('四个区间都返回非空文本', bands.every(t => t && t.length > 5), bands)
check('不同区间文本不同', new Set(bands).size >= 3)

// ---------- 9. 时间 ----------
console.log('\n【九】时间解析')
check('能解析 elapsed="30"', turn.parseElapsed('<time elapsed="30" end="1日08:30" />') === 30)
check('能解析无单位', turn.parseElapsed('<time elapsed="45" />') === 45)
check('无 time 标签返回 null', turn.parseElapsed('没有时间标签') === null)
check('超范围返回 null', turn.parseElapsed('<time elapsed="9999" />') === null)
check('derivePhase(360) = morning', turn.derivePhase(360) === 'morning')
check('derivePhase(660) = afternoon', turn.derivePhase(660) === 'afternoon')
check('derivePhase(1200) = night', turn.derivePhase(1200) === 'night')
check('derivePhase(60) = deep_night', turn.derivePhase(60) === 'deep_night')

// ---------- 10. 世界台账 ----------
console.log('\n【十】世界台账')
const ledger = core.read('ledger', '')
check('ledger 已生成', ledger.length > 0, ledger.slice(0, 30))
check('ledger 含日期', /第 \d+ 天/.test(ledger))
check('ledger 含在场行', ledger.includes('在场：'))
check('ledger 近况不超过 3 条', (ledger.match(/^· /gm) || []).length <= 3,
  (ledger.match(/^· /gm) || []).length)

// ---------- 11. 监听面板 ----------
console.log('\n【十一】监听面板')
const watch = core.read('watch', null)
check('watch 已生成', !!watch && !!watch.list, typeof watch)
check('监听覆盖全部角色', watch && watch.list.length === 5, watch && watch.list.length)
check('每条含位置与状态', watch && watch.list.every(x => x.alive === false || (x.locationName && typeof x.corruption === 'number')))
check('watch 不写入提示词变量', !core.read('ledger', '').includes('监听'))

// ---------- 12. 世界事件 ----------
console.log('\n【十二】世界事件')
const evt = R.modules.event
const evLib = core.read('eventLibrary', {})
const firedNow = core.read('events_fired', [])
check('事件库已装载', Object.keys(evLib).length >= 6, Object.keys(evLib).length)
check('已触发的事件有记录', Array.isArray(firedNow) && firedNow.length > 0, firedNow)

// 构造一个必然触发的事件
core.write('sys.total_min', 6 * 1440)   // 第 7 天
const npcsNow = core.read('npcs', {})
const testLib = {
  test_ev: R.modules.event.makeEvent('test_ev', {
    label: '测试事件',
    narration: '测试用',
    trigger: { dayMin: 1 },
    effects: { target: 'aurora', drives: { fear: 10 }, setFlags: { tested: true } }
  })
}
const toFire = evt.checkAll({ day: 7, phase: 'morning', flags: {} }, npcsNow, testLib, () => 0)
check('满足条件的事件能触发', toFire.length === 1, toFire.length)

const beforeFear = npcsNow.aurora.drives.fear
const rec = evt.apply(toFire[0], npcsNow, { flags: {} })
check('事件效果已生效', npcsNow.aurora.drives.fear === Math.min(100, beforeFear + 10),
  { before: beforeFear, after: npcsNow.aurora.drives.fear })
check('事件写入了世界标记', core.read('world.flags', {}).tested === true)
check('once 事件已登记', evt.firedList().includes('test_ev'))

// 再试一次，once 应拦住
const again = evt.checkAll({ day: 7, phase: 'morning', flags: {} }, npcsNow, testLib, () => 0)
check('once 事件不会重复触发', again.length === 0)

// ---------- 结果 ----------
console.log('\n══════════════════════════════════════════════════')
console.log(`  结果：${pass} 通过 / ${fail} 失败`)
console.log('══════════════════════════════════════════════════')

if (fail === 0) {
  console.log('\n全链路通过。可以进酒馆测试了。')
  console.log('装法见 scripts/install.md')
} else {
  console.log('\n失败项：')
  failures.forEach(f => console.log('  - ' + f))
  process.exitCode = 1
}

// 附：最终状态速览
console.log('\n【最终状态】')
for (const n of Object.values(after)) {
  console.log(`  ${n.name.padEnd(6)} 阶段=${n.stage.padEnd(11)} 堕落=${String(n.corruption).padStart(3)} 位置=${n.location}`)
  const tally = {}
  for (const h of n.history) tally[h] = (tally[h] || 0) + 1
  console.log(`         行为：${Object.entries(tally).map(([k, v]) => `${k}×${v}`).join(' ')}`)
}
console.log('')
