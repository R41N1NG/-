/**
 * dep_audit.js — 解耦审计
 *
 * 检查三件事：
 *   1. 逻辑代码里有没有出现角色名（通用性）
 *   2. 逻辑代码里有没有裸写地点字面量（应该走 schema.LOCATIONS）
 *   3. 每个模块声明的依赖是否符合层级（单向、不反向、不越级）
 *
 * 运行：node scripts/dep_audit.js
 */

const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'tavern_scripts')

/** 逻辑层文件（数据文件排除在外） */
const LOGIC_FILES = [
  '0_okh_boot.js', '1_okh_core.js', '2_okh_schema.js', '3_okh_rules.js',
  '4_okh_agency.js', '5_okh_presence.js', '6_okh_translate.js',
  '7_okh_turn.js', '8_okh_hud.js', '9_okh_debug.js', '11_okh_event.js'
]

/** 层级：数字越小越底层。上层可依赖下层，反之禁止 */
const LAYER = {
  boot: 0, core: 1, schema: 2, data: 2,
  rules: 3,
  agency: 4, presence: 4, translate: 4, event: 4,
  turn: 5, hud: 6, debug: 6
}

/** 已知角色名与 id（从数据文件里反查更准，这里做兜底） */
const KNOWN_CHARACTERS = [
  'aurora', 'nise', 'eileen', 'cecilia', 'gulan',
  '奥萝拉', '妮丝', '艾琳', '塞西莉亚', '古兰'
]

/** 已知地点 key */
const KNOWN_LOCATIONS = ['town', 'inn', 'church', 'manor', 'casino']

/**
 * 去掉注释，避免注释里的示例被误判
 * @param {string} code
 * @returns {string}
 */
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

/**
 * 从代码里提取依赖：dep('xxx') 和 REG.modules.xxx
 * @param {string} code
 * @returns {string[]}
 */
function extractDeps(code) {
  // 先剔除"注册自己"的赋值语句（REG.modules.xxx = {...}），那不是依赖
  const noAssign = code.replace(/REG\.modules\.(\w+)\s*=[^=]/g, 'REG.modules.__self__=')
  const deps = new Set()
  const re1 = /dep\(\s*['"](\w+)['"]\s*\)/g
  const re2 = /REG\.modules\.(\w+)/g
  let m
  while ((m = re1.exec(noAssign)) !== null) deps.add(m[1])
  while ((m = re2.exec(noAssign)) !== null) {
    if (m[1] !== '__self__') deps.add(m[1])
  }
  return [...deps]
}

function main() {
  const issues = []
  const stats = []

  console.log('\n══════════════════════════════════════')
  console.log('  解耦审计')
  console.log('══════════════════════════════════════\n')

  for (const file of LOGIC_FILES) {
    const full = path.join(DIR, file)
    if (!fs.existsSync(full)) {
      issues.push(`[缺失] ${file} 不存在`)
      continue
    }

    const raw = fs.readFileSync(full, 'utf8')
    const code = stripComments(raw)
    const lines = raw.split('\n').length

    const modName = file.replace(/^\d+_okh_/, '').replace(/\.js$/, '')

    // 1. 角色名检查
    const foundChars = KNOWN_CHARACTERS.filter(n => code.includes(n))

    // 2. 地点字面量检查（schema 自己定义 LOCATIONS，豁免）
    const foundLocs = modName === 'schema'
      ? []
      : KNOWN_LOCATIONS.filter(l => new RegExp(`['"]${l}['"]`).test(code))

    // 3. 依赖方向检查
    const deps = extractDeps(code)
    const myLayer = LAYER[modName]
    const badDeps = []

    for (const d of deps) {
      if (d === modName) { badDeps.push(`${d}（自引用）`); continue }
      const theirLayer = LAYER[d]
      if (theirLayer === undefined) { badDeps.push(`${d}（未知模块）`); continue }
      if (theirLayer >= myLayer) {
        badDeps.push(`${d}（层级 ${theirLayer} ≥ 自己 ${myLayer}，反向或同级）`)
      }
    }

    stats.push({ file, lines, deps: deps.length })

    if (foundChars.length) {
      issues.push(`[角色名] ${file} 含：${foundChars.join(', ')}`)
    }
    if (foundLocs.length) {
      issues.push(`[地点字面量] ${file} 含：${foundLocs.join(', ')}（应走 schema.LOCATIONS）`)
    }
    if (badDeps.length) {
      issues.push(`[依赖方向] ${file} → ${badDeps.join('；')}`)
    }
  }

  // ---------- 输出 ----------

  console.log('【文件规模】')
  console.log('  文件'.padEnd(22) + '行数'.padStart(6) + '  依赖数')
  for (const s of stats) {
    const flag = s.lines > 600 ? '  ⚠ 超 600 行' : ''
    console.log('  ' + s.file.padEnd(20) + String(s.lines).padStart(6) + String(s.deps).padStart(8) + flag)
  }

  const totalLines = stats.reduce((a, s) => a + s.lines, 0)
  console.log(`\n  合计 ${stats.length} 个文件 / ${totalLines} 行`)

  const over = stats.filter(s => s.lines > 600)
  if (over.length) issues.push(`[规模] ${over.map(o => o.file).join(', ')} 超过 600 行`)

  console.log('\n【层级检查】')
  console.log('  ' + Object.entries(LAYER).map(([k, v]) => `${k}(${v})`).join('  '))

  console.log('\n【数据文件豁免】')
  console.log('  10_okh_data.js 允许含角色名与地点，这是它的职责')

  console.log('\n【结果】')
  if (!issues.length) {
    console.log('  ✓ 无问题')
    console.log('    · 逻辑层无角色名')
    console.log('    · 逻辑层无地点字面量')
    console.log('    · 依赖方向全部单向')
    console.log(`    · 无文件超过 600 行（最大 ${Math.max(...stats.map(s => s.lines))} 行）`)
    process.exitCode = 0
  } else {
    for (const i of issues) console.log('  ✗ ' + i)
    process.exitCode = 1
  }
  console.log('')
}

main()
