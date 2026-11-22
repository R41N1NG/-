/**
 * check-deps.js — 模块依赖方向扫描
 *
 * 为什么需要这个脚本：
 *   ES module 的 import 是编译期静态解析的，运行时拦不住越级依赖。
 *   @deps 声明只是文档，不是护栏。真正的护栏是静态扫描。
 *
 * 用法：
 *   node scripts/check-deps.js
 *   退出码 0 = 通过；1 = 有违规
 *
 * 依赖规范：角色卡制作规范.md 第 2.5 节
 */

const fs = require('fs')
const path = require('path')

// ============================================================
// 层级白名单：模块 → 允许依赖的模块
// 顺序即层级，上层可依赖下层，反之禁止
// ============================================================

const LAYERS = {
  sm_log:     [],
  sm_core:    [],
  sm_schema:  ['sm_core'],
  sm_persist: ['sm_core', 'sm_schema'],
  sm_parse:   ['sm_core', 'sm_schema'],
  sm_rules:   ['sm_core', 'sm_schema'],
  sm_effect:  ['sm_core', 'sm_schema', 'sm_rules'],
  sm_ui:      ['sm_core', 'sm_schema']
}

const STATE_DIR = path.join(__dirname, '..', 'src', 'state')

// ============================================================
// 扫描
// ============================================================

/**
 * 从源码里提取所有 import 的模块名
 * 支持三种写法：
 *   import x from './sm_core.js'
 *   import { a } from './sm_core.js'
 *   import './sm_core.js'
 *
 * @param {string} code 源码
 * @returns {string[]} 模块名列表（不含扩展名）
 */
function extractImports(code) {
  const out = []
  // 匹配 import ... from '...' 以及裸 import '...'
  const re = /(?:import\s[\s\S]*?from\s*|import\s*)(['"])([^'"]+)\1/g
  let m
  while ((m = re.exec(code)) !== null) {
    const spec = m[2]
    if (!spec.startsWith('.')) continue        // 跳过第三方包
    const base = path.basename(spec, '.js')
    if (base.startsWith('sm_')) out.push(base)
    if (base === 'state_index') out.push('state_index')
  }
  return out
}

/**
 * 校验单个文件的依赖是否合法
 * @param {string} name 模块名
 * @param {string[]} deps 实际 import 的模块
 * @returns {string[]} 违规描述列表，空数组表示通过
 */
function checkFile(name, deps) {
  const errs = []
  const allowed = LAYERS[name]

  if (!allowed) {
    return [`${name}: 不在层级白名单中，请在 check-deps.js 的 LAYERS 里登记`]
  }

  for (const d of deps) {
    if (d === name) {
      errs.push(`${name}: 自引用`)
      continue
    }
    if (d === 'state_index') {
      errs.push(`${name} → state_index: 反向依赖（装配入口只能被它自己调用，不能被模块 import）`)
      continue
    }
    if (!allowed.includes(d)) {
      // 判断是反向还是越级，给出更具体的提示
      const dAllowed = LAYERS[d] || []
      if (dAllowed.includes(name)) {
        errs.push(`${name} → ${d}: 循环依赖（${d} 也依赖 ${name}）`)
      } else {
        errs.push(`${name} → ${d}: 越级依赖（${name} 只允许依赖 [${allowed.join(', ') || '无'}]）`)
      }
    }
  }
  return errs
}

// ============================================================
// 主流程
// ============================================================

function main() {
  if (!fs.existsSync(STATE_DIR)) {
    console.log(`[skip] 目录不存在：${STATE_DIR}`)
    console.log('       状态机尚未开工，无需校验。')
    return 0
  }

  const files = fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.js'))
  if (files.length === 0) {
    console.log('[skip] src/state/ 下暂无 .js 文件。')
    return 0
  }

  const allErrs = []
  for (const f of files) {
    const name = path.basename(f, '.js')
    if (!name.startsWith('sm_')) continue
    const code = fs.readFileSync(path.join(STATE_DIR, f), 'utf8')
    const deps = extractImports(code)
    const errs = checkFile(name, deps)
    if (errs.length) {
      allErrs.push(...errs)
    } else {
      console.log(`[ok]   ${name}  →  [${deps.join(', ') || '无依赖'}]`)
    }
  }

  if (allErrs.length) {
    console.log('\n[FAIL] 依赖违规：')
    for (const e of allErrs) console.log('  - ' + e)
    console.log('\n修复依据：角色卡制作规范.md 第 2.1 节原则三、第 2.5 节')
    return 1
  }

  console.log(`\n[PASS] ${files.length} 个文件依赖方向全部合法。`)
  return 0
}

process.exit(main())
