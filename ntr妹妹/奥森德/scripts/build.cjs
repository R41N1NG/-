/**
 * build.cjs — 从奥森德/src 的核心与解耦应用模块生成运行合订本与自动启动版
 *
 * 修改任何模块源码后，运行本脚本重新生成：
 *   1) 奥森德/dist/okh_complete.js（纯运行库）
 *   2) 奥森德/dist/okh_complete_autostart.js（附带 autostart.js，可单文件导入酒馆助手）
 *
 * 运行：node 奥森德/scripts/build.cjs
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { loadBubbleAvatars } = require('./build_bubble.cjs')

const ROOT = path.resolve(__dirname, '..', '..')          // 项目根
const SRC = path.join(ROOT, '奥森德', 'src')
const OUT_DIR = process.env.OKH_BUILD_DIR ? path.resolve(process.env.OKH_BUILD_DIR) : path.join(ROOT, '奥森德', 'dist')
const OUT = path.join(OUT_DIR, 'okh_complete.js')
const OUT_AUTO = path.join(OUT_DIR, 'okh_complete_autostart.js')
const AUTOSTART_FILE = path.join(__dirname, 'autostart.js')

const CORE = [
  'okh_utils',
  'okh_rules',
  'okh_activity',
  'okh_effects',
  'okh_events',
  'okh_nodes',
  'okh_turn',
  'okh_api',
  'okh_adapter'
]

const APP = [
  'okh_bubble_side',
  'okh_app_data',
  'okh_app_rules',
  'okh_app_time',
  'okh_app_migrate',
  'okh_app_album',
  'okh_app_config',
  'okh_app_world',
  'okh_app_adapter',
  'okh_app_parse',
  'okh_app_hook',
  'okh_app_debug',
  'okh_app_map',
  'okh_app_hud',
  'okh_app_entry'
]

const EXPECTED = [...CORE, ...APP]
const HEADER = '// GENERATED: 修改 core/、app/ 后重新运行构建，不直接编辑合订本。'

const UI_ASSET_MAP = [
  ['__OKH_UI_JOURNAL_BG__', 'assets/ui/journal_bg_1.webp', 'image/webp'],
  ['__OKH_UI_DARK_PARCHMENT__', 'assets/ui/dark_parchment_bg.webp', 'image/webp'],
  ['__OKH_UI_FOOTER_ACCENT__', 'assets/ui/footer_accent.png', 'image/png'],
  ['__OKH_UI_WAX_SEAL__', 'assets/ui/wax_seal_3d.svg', 'image/svg+xml']
]

const MAP_ASSET_MAP = [
  ['__OKH_MAP_REGION__', '全域图/regional-art.webp'],
  ['__OKH_MAP_TOWN__', '镇内图/town-art.webp'],
  ['__OKH_MAP_GROUND__', '室内图/断剑与麦酒旅店/ground-scene.webp'],
  ['__OKH_MAP_UPPER__', '室内图/断剑与麦酒旅店/upper-scene.webp'],
  ['__OKH_MAP_JOURNAL__', '手札素材/journal-page.webp'],
  ['__OKH_MAP_INK_FONT__', '字体/map-ink.woff', 'font/woff']
]

function inlineUiAssets(text) {
  let result = text
  for (const [token, relPath, mime] of UI_ASSET_MAP) {
    const full = path.join(ROOT, relPath)
    if (!fs.existsSync(full)) {
      // 上传源码不含旧 UI 纹理：沿用 HUD 相对资源回退，不阻止地图运行库构建。
      console.warn('未提供可选 HUD 素材，保留相对路径：' + relPath)
      result = result.split(token).join(relPath)
      continue
    }
    const b64 = fs.readFileSync(full).toString('base64')
    result = result.split(token).join(`data:${mime};base64,${b64}`)
  }
  return result
}

function inlineMapAssets(text) {
  let result = text
  for (const [token, relPath, mime = 'image/webp'] of MAP_ASSET_MAP) {
    const full = path.join(ROOT, '奥森德', '地图预览', relPath)
    if (!fs.existsSync(full)) throw new Error('缺少地图素材：' + full)
    result = result.split(token).join('data:' + mime + ';base64,' + fs.readFileSync(full).toString('base64'))
  }
  return result
}

function read(dir, name) {
  const f = path.join(SRC, dir, name + '.js')
  if (!fs.existsSync(f)) throw new Error('缺少模块：' + f)
  const raw = fs.readFileSync(f, 'utf8')
  if (name === 'okh_bubble_side') {
    const { images } = loadBubbleAvatars(path.join(ROOT, '奥森德'))
    return raw.replace('/* __OKH_BUBBLE_AVATARS__ */ {}', () => JSON.stringify(images))
  }
  if (name === 'okh_app_album') return raw.replace("'__OKH_ALBUM_CATALOG__'", () => JSON.stringify(JSON.stringify(require('./build_album.cjs').buildCatalog(path.join(ROOT, '奥森德')))))
  return name === 'okh_app_hud' ? inlineUiAssets(raw) : name === 'okh_app_map' ? inlineMapAssets(raw) : raw
}

// Hashes and generated JSON are identical across Windows and Linux checkouts.
const EOL = '\n'
const SEP = EOL + ';' + EOL

const coreText = CORE.map(n => read('core', n).replace(/\r?\n/g, EOL)).join(SEP)
const appText  = APP.map(n => read('app', n).replace(/\r?\n/g, EOL)).join(SEP)
const output = HEADER + EOL + coreText + SEP + appText
if (/__OKH_UI_[A-Z_]+__/.test(output)) throw new Error('存在未内联的 HUD 素材占位符')
if (/__OKH_MAP_[A-Z_]+__/.test(output)) throw new Error('存在未内联的地图素材占位符')
if (output.includes('__OKH_BUBBLE_AVATARS__')) throw new Error('存在未内联的对白头像占位符')

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, output, 'utf8')

// ---------- 自检 ----------
const back = fs.readFileSync(OUT, 'utf8')
if (back !== output) throw new Error('写入回读不一致')

const parts = back.slice((HEADER + EOL).length).split(/(?=\/\*\*\r?\n \* @module )/)
const names = parts.map(p => (p.match(/@module\s+(\S+)/) || [])[1]).filter(Boolean)

if (names.length !== EXPECTED.length) throw new Error('模块数不对：' + names.length + ' !== ' + EXPECTED.length)
if (names.join(',') !== EXPECTED.join(',')) throw new Error('模块顺序不对')

const sha = crypto.createHash('sha256').update(output, 'utf8').digest('hex').toUpperCase()
console.log('已生成：' + OUT)
console.log('模块：' + names.length + ' 个（core ' + CORE.length + ' / app ' + APP.length + '）')
console.log('换行：' + (EOL === '\r\n' ? 'CRLF' : 'LF') + ' · 大小：' + Buffer.byteLength(output, 'utf8') + ' 字节 · SHA-256：' + sha)

if (fs.existsSync(AUTOSTART_FILE)) {
  const autostart = fs.readFileSync(AUTOSTART_FILE, 'utf8').replace(/\r?\n/g, EOL)
  const autoOutput = output + SEP + autostart
  fs.writeFileSync(OUT_AUTO, autoOutput, 'utf8')
  if (fs.readFileSync(OUT_AUTO, 'utf8') !== autoOutput) throw new Error('autostart 版写入回读不一致')
  const autoSha = crypto.createHash('sha256').update(autoOutput, 'utf8').digest('hex').toUpperCase()
  console.log('已生成：' + OUT_AUTO)
  console.log('自动启动版大小：' + Buffer.byteLength(autoOutput, 'utf8') + ' 字节 · SHA-256：' + autoSha)
  require('./build_card.cjs').buildCard({ runtimePath: OUT_AUTO })
  require('./build_card_preview.cjs')
  require('./build_album_preview.cjs')
  require('./build_hud_preview.cjs')
}
