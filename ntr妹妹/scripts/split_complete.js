/**
 * split_complete.js — 把 okh_complete.js 拆成 17 个模块源码
 *
 * 只做拆分，不改内容。拆完立即重组验证是否与原文逐字节一致。
 *
 * 运行：node scripts/split_complete.js
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'tavern_scripts', 'okh_complete.js')
const OUT = path.join(ROOT, '奥森德', 'src')

const HEADER_RE = /^\/\/ GENERATED[^\n]*\n/
const SPLIT_RE = /(?=\/\*\*\r?\n \* @module )/

// 模块归属
const CORE = ['okh_utils','okh_rules','okh_activity','okh_effects','okh_events','okh_nodes','okh_turn','okh_api','okh_adapter']
const APP  = ['okh_app_config','okh_app_world','okh_app_adapter','okh_app_parse','okh_app_hook','okh_app_debug','okh_app_hud','okh_app_entry']

const original = fs.readFileSync(SRC, 'utf8')
const headerMatch = original.match(HEADER_RE)
const header = headerMatch ? headerMatch[0] : ''
const body = header ? original.slice(header.length) : original

// 跟随原文件的换行风格，保证重组逐字节一致
const EOL = original.includes('\r\n') ? '\r\n' : '\n'
const SEP = EOL + ';' + EOL

const parts = body.split(SPLIT_RE).filter(p => p.trim())
console.log('切出模块数：' + parts.length + '（换行：' + (EOL === '\r\n' ? 'CRLF' : 'LF') + '）')

const modules = {}
for (let i = 0; i < parts.length; i++) {
  let s = parts[i]
  if (i < parts.length - 1) {
    if (s.endsWith(SEP)) s = s.slice(0, -SEP.length)
    else s = s.replace(/\r?\n;\r?\n$/, '')
  }
  // 不裁剪尾部换行：原文模块间的多余空行属于内容的一部分

  const name = (s.match(/@module\s+(\S+)/) || [])[1]
  if (!name) { console.error('第 ' + (i+1) + ' 段没有 @module'); process.exit(1) }
  if (modules[name]) { console.error('模块重名：' + name); process.exit(1) }
  modules[name] = s
}

// 写出
const coreDir = path.join(OUT, 'core')
const appDir = path.join(OUT, 'app')
fs.mkdirSync(coreDir, { recursive: true })
fs.mkdirSync(appDir, { recursive: true })

for (const name of CORE) {
  if (!modules[name]) { console.error('缺核心模块：' + name); process.exit(1) }
  fs.writeFileSync(path.join(coreDir, name + '.js'), modules[name], 'utf8')
}
for (const name of APP) {
  if (!modules[name]) { console.error('缺应用模块：' + name); process.exit(1) }
  fs.writeFileSync(path.join(appDir, name + '.js'), modules[name], 'utf8')
}

console.log('已写出：core ' + CORE.length + ' 个 / app ' + APP.length + ' 个')

// ============================================================
// 重组验证
// ============================================================

const coreText = CORE.map(n => fs.readFileSync(path.join(coreDir, n + '.js'), 'utf8')).join(SEP)
const appText = APP.map(n => fs.readFileSync(path.join(appDir, n + '.js'), 'utf8')).join(SEP)
const rebuilt = header + coreText + SEP + appText

const same = rebuilt === original
console.log('')
console.log('重组长度：' + rebuilt.length + ' / 原文：' + original.length)

if (same) {
  console.log('✓ 逐字节一致')
} else {
  console.log('✗ 不一致，定位第一处差异：')
  const n = Math.min(rebuilt.length, original.length)
  let i = 0
  while (i < n && rebuilt[i] === original[i]) i++
  console.log('  位置 ' + i)
  console.log('  重组：' + JSON.stringify(rebuilt.slice(Math.max(0,i-40), i+40)))
  console.log('  原文：' + JSON.stringify(original.slice(Math.max(0,i-40), i+40)))
  process.exit(1)
}
