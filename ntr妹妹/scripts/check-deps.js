/**
 * check-deps.js — 扫描奥森德/src/core 与奥森德/src/app 的模块头注释、单向依赖白名单与 600 行复核阈值
 *
 * 运行：node scripts/check-deps.js
 */
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, '奥森德', 'src')
const ARCH_DOC = path.join(ROOT, '状态机_架构说明.md')

const CORE_ALLOWED = {
  okh_utils: [],
  okh_rules: ['utils'],
  okh_activity: ['utils', 'rules'],
  okh_effects: ['utils'],
  okh_events: ['utils', 'rules', 'effects'],
  okh_nodes: ['utils', 'rules', 'effects', 'events'],
  okh_turn: ['utils', 'rules', 'activity', 'effects', 'events', 'nodes'],
  okh_api: ['utils', 'rules', 'activity', 'effects', 'events', 'nodes', 'turn'],
  okh_adapter: ['utils', 'OKHBackground']
}

const APP_ALLOWED = {
  okh_bubble_side: ['OKH_APP_CONFIG', 'OKH_APP_WORLD'],
  okh_app_data: [],
  okh_app_album: ['OKH_APP_DATA'],
  okh_app_rules: ['OKH_APP_DATA'],
  okh_app_time: ['OKH_APP_DATA'],
  okh_app_migrate: ['OKH_APP_DATA'],
  okh_app_config: ['OKH_APP_DATA', 'OKH_APP_RULES', 'OKH_APP_TIME', 'OKH_APP_MIGRATE', 'OKH_APP_ALBUM'],
  okh_app_world: ['utils', 'OKH_APP_CONFIG', 'OKH_APP_ALBUM', 'OKHBackground'],
  okh_app_adapter: ['utils', 'OKH_APP_CONFIG', 'OKH_APP_DATA', 'OKH_APP_TIME', 'OKH_APP_WORLD', 'OKH_APP_WORLDBOOK', 'OKHBackgroundAdapter', 'OKHBackground'],
  okh_app_worldbook: ['OKH_APP_WORLD'],
  okh_app_parse: ['utils'],
  okh_app_hook: ['utils', 'OKH_APP_CONFIG', 'OKH_APP_WORLD', 'OKH_APP_ADAPTER', 'OKH_APP_PARSE', 'OKH_APP_WORLDBOOK', 'OKHBackground'],
  okh_app_debug: ['OKH_APP_CONFIG', 'OKH_APP_WORLD', 'OKH_APP_ADAPTER', 'OKH_APP_HOOK', 'OKHBackground'],
  okh_app_map: ['OKH_APP_CONFIG'],
  okh_app_hud: ['OKH_APP_CONFIG', 'OKH_APP_WORLD', 'OKH_APP_ADAPTER', 'OKH_APP_MAP', 'OKH_APP_ALBUM'],
  okh_app_entry: ['utils', 'OKHBackground', 'OKH_APP_CONFIG', 'OKH_APP_WORLD', 'OKH_APP_ADAPTER', 'OKH_APP_HOOK', 'OKH_APP_DEBUG', 'OKH_APP_HUD']
}

const OWN_EXPORT = {
  okh_utils: 'utils',
  okh_rules: 'rules',
  okh_activity: 'activity',
  okh_effects: 'effects',
  okh_events: 'events',
  okh_nodes: 'nodes',
  okh_turn: 'turn',
  okh_api: 'OKHBackground',
  okh_adapter: 'OKHBackgroundAdapter',
  okh_app_data: 'OKH_APP_DATA',
  okh_app_album: 'OKH_APP_ALBUM',
  okh_app_rules: 'OKH_APP_RULES',
  okh_app_time: 'OKH_APP_TIME',
  okh_app_migrate: 'OKH_APP_MIGRATE',
  okh_app_config: 'OKH_APP_CONFIG',
  okh_app_world: 'OKH_APP_WORLD',
  okh_app_adapter: 'OKH_APP_ADAPTER',
  okh_app_worldbook: 'OKH_APP_WORLDBOOK',
  okh_app_parse: 'OKH_APP_PARSE',
  okh_app_hook: 'OKH_APP_HOOK',
  okh_app_debug: 'OKH_APP_DEBUG',
  okh_app_map: 'OKH_APP_MAP',
  okh_app_hud: 'OKH_APP_HUD',
  okh_app_entry: 'OKH_APP'
}

const errors = []
const warnings = []
const archDoc = fs.existsSync(ARCH_DOC) ? fs.readFileSync(ARCH_DOC, 'utf8') : ''

function scanLayer(subDir, allowedMap, isCore) {
  const dir = path.join(SRC, subDir)
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()

  for (const name of Object.keys(allowedMap)) {
    if (!files.includes(name + '.js')) {
      errors.push(`缺少预期模块：${subDir}/${name}.js`)
    }
  }

  for (const file of files) {
    const mod = file.replace(/\.js$/, '')
    const full = path.join(dir, file)
    const content = fs.readFileSync(full, 'utf8')
    const lineCount = content.split(/\r?\n/).length

    for (const tag of ['@module', '@updated', '@status', '@reason']) {
      if (!content.includes(tag)) {
        errors.push(`${subDir}/${file} 缺少必填头注释字段 ${tag}`)
      }
    }

    if (!Object.hasOwn(allowedMap, mod)) {
      errors.push(`未在依赖白名单登记的模块：${subDir}/${file}`)
      continue
    }

    if (isCore && /\bOKH_APP\b|\bOKH_APP_\w+\b/.test(content)) {
      errors.push(`core 层越权引用 app 层标识：${subDir}/${file}`)
    }

    const refs = new Set()
    for (const m of content.matchAll(/(?:root|registry)\.(OKH_APP(?:_\w+)?|OKHBackground(?:Adapter)?|utils|rules|activity|effects|events|nodes|turn)\b/g)) {
      const sym = m[1]
      if (sym === OWN_EXPORT[mod]) continue
      if (sym === 'OKHBackgroundModules') continue
      refs.add(sym)
    }

    const allowed = new Set(allowedMap[mod])
    for (const ref of refs) {
      if (!allowed.has(ref)) {
        errors.push(`${subDir}/${file} 出现白名单外依赖：${ref}（允许：[${allowedMap[mod].join(', ')}]）`)
      }
    }

    if (lineCount > 600) {
      const documented = archDoc.includes(mod) && (archDoc.includes('600') || archDoc.includes('复核'))
      if (!documented) {
        errors.push(`${subDir}/${file} 共 ${lineCount} 行 (>600)，但 状态机_架构说明.md 未写明复核依据`)
      } else {
        warnings.push(`${subDir}/${file} 共 ${lineCount} 行 (>600)，已在架构说明备案豁免`)
      }
    }
  }
}

scanLayer('core', CORE_ALLOWED, true)
scanLayer('app', APP_ALLOWED, false)

for (const w of warnings) console.log('WARN:', w)
if (errors.length) {
  for (const e of errors) console.error('ERROR:', e)
  process.exit(1)
}
console.log('PASS: module dependencies, headers and thresholds are valid.')
