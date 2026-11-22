/**
 * @module okh_app_hud
 * @updated 2026-11-09 07:45
 * @status  demo
 * @reason  把 world 渲染成界面：在场面板（玩家可见）+ 监听面板（隐藏）
 * @deps    ['okh_app_world', 'okh_app_adapter']
 * @provides { render, startHud, stopHud, LOCATION_NAMES }
 *
 * 用法：
 *   页面上放 <div data-okh-hud></div>  → 显示时间、位置、在场
 *   页面上放 <div data-okh-watch></div> → 显示全员监听（建议设 display:none）
 */

(function (root) {
  'use strict'

  const W = root.OKH_APP_WORLD
  const A = root.OKH_APP_ADAPTER

  if (!W || !A) {
    console.error('[APP] hud 加载失败：需要 02_world 与 03_adapter')
    return
  }

  /** 地点中文名 */
  const LOCATION_NAMES = {
    town: '镇上',
    inn: '断剑与麦酒',
    church: '圣辉大教堂',
    manor: '领主山庄',
    casino: '地下赌场',
    wilds: '城外荒原'
  }

  /** 时段中文名 */
  const PHASE_NAMES = [
    { max: 360, name: '深夜' },
    { max: 600, name: '上午' },
    { max: 1020, name: '午后' },
    { max: 1440, name: '夜晚' }
  ]

  /**
   * 由分钟推时段名
   * @param {number} local
   * @returns {string}
   */
  function phaseName(local) {
    return (PHASE_NAMES.find(p => local < p.max) || PHASE_NAMES[3]).name
  }

  /**
   * 地点名
   * @param {string} key
   * @returns {string}
   */
  function locName(key) {
    return LOCATION_NAMES[key] || key
  }

  // ============================================================
  // 一、在场面板
  // ============================================================

  /**
   * 生成在场面板的 HTML
   * @param {object} world
   * @returns {string}
   */
  function buildHudHtml(world) {
    if (!world) return ''

    const day = Math.floor(world.timeMin / 1440) + 1
    const local = world.timeMin % 1440
    const hour = String(Math.floor(local / 60)).padStart(2, '0')
    const minute = String(local % 60).padStart(2, '0')

    const here = Object.values(world.npcs)
      .filter(n => n.alive !== false && n.location === world.playerLocation)

    const presentText = here.length
      ? here.map(n => {
          const busy = n.activity ? `（${n.activity.label}）` : ''
          return `<span class="okh-name">${escape(n.name)}</span><span class="okh-busy">${escape(busy)}</span>`
        }).join('　')
      : '<span class="okh-none">无人</span>'

    return `
      <div class="okh-row">
        <span class="okh-label">时间</span>
        <span class="okh-value">第 ${day} 天 · ${phaseName(local)}</span>
        <span class="okh-clock">${hour}:${minute}</span>
      </div>
      <div class="okh-row">
        <span class="okh-label">位置</span>
        <span class="okh-value">${escape(locName(world.playerLocation))}</span>
      </div>
      <div class="okh-row">
        <span class="okh-label">在场</span>
        <span class="okh-value">${presentText}</span>
      </div>
    `.trim()
  }

  // ============================================================
  // 二、监听面板
  // ============================================================

  /**
   * 生成监听面板的 HTML（等宽文本，便于对齐）
   * @param {object} world
   * @returns {string}
   */
  function buildWatchHtml(world) {
    if (!world) return ''
    const STAGE = { 0: '正常', 1: '异常', 2: '沉沦', 3: '臣服' }

    const lines = Object.values(world.npcs).map(n => {
      const mark = n.location === world.playerLocation ? '●' : '○'
      const stage = STAGE[n.stage] || n.stage
      const busy = n.activity ? `｜${n.activity.label}` : ''
      return `${mark} ${n.name}｜${locName(n.location)}｜${stage}｜堕落 ${Math.round(n.values.corruption ?? 0)}${busy}`
    })

    return lines.join('\n')
  }

  /**
   * HTML 转义
   * @param {string} s
   * @returns {string}
   */
  function escape(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  // ============================================================
  // 三、渲染
  // ============================================================

  /**
   * 渲染一次
   * @returns {boolean} 是否找到容器
   */
  function render() {
    if (typeof document === 'undefined') return false

    const world = W.loadWorld()
    if (!world) return false

    let found = false

    // 在场面板：可能有多个（每条消息一个），全部填
    const huds = document.querySelectorAll('[data-okh-hud]')
    for (const el of huds) {
      el.innerHTML = buildHudHtml(world)
      el.setAttribute('data-okh-ready', '1')
      found = true
    }

    // 监听面板
    const watches = document.querySelectorAll('[data-okh-watch]')
    for (const el of watches) {
      el.textContent = buildWatchHtml(world)
      found = true
    }

    return found
  }

  // ============================================================
  // 四、定时刷新
  // ============================================================

  let _timer = null

  /**
   * 启动定时刷新
   * @param {number} intervalMs
   */
  function startHud(intervalMs = 1000) {
    if (_timer) return
    _timer = setInterval(() => {
      try { render() } catch (e) { /* 静默，不打断页面 */ }
    }, intervalMs)
    console.log('[APP] HUD 已启动 · 每 ' + intervalMs + 'ms 刷新')
  }

  /**
   * 停止
   */
  function stopHud() {
    if (!_timer) return
    clearInterval(_timer)
    _timer = null
    console.log('[APP] HUD 已停止')
  }

  root.OKH_APP_HUD = Object.freeze({
    LOCATION_NAMES,
    phaseName,
    locName,
    buildHudHtml,
    buildWatchHtml,
    render,
    startHud,
    stopHud
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_HUD
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
