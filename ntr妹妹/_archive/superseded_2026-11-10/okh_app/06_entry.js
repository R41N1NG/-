/**
 * @module okh_app_entry
 * @updated 2026-11-09 07:10
 * @status  demo
 * @reason  统一入口。把散落的 OKH_APP_* 收成一个对象，避免使用者记五个全局名
 * @deps    ['okh_app_config', 'okh_app_world', 'okh_app_adapter', 'okh_app_hook', 'okh_app_debug']
 * @provides { OKH_APP }
 */

(function (root) {
  'use strict'

  const CFG = root.OKH_APP_CONFIG
  const W = root.OKH_APP_WORLD
  const A = root.OKH_APP_ADAPTER
  const H = root.OKH_APP_HOOK
  const D = root.OKH_APP_DEBUG
  const HUD = root.OKH_APP_HUD

  if (!CFG || !W || !A || !H || !D) {
    console.error('[APP] entry 加载失败：依赖缺失，检查 01~05 是否都加载了')
    return
  }
  if (!HUD) {
    console.warn('[APP] entry：HUD 模块未加载，界面将不可用')
  }

  /**
   * 初始化世界
   * @param {boolean} force 为 true 时清空重建
   * @returns {object}
   */
  function init(force = false) {
    return W.ensureWorld(force)
  }

  /**
   * 启动：初始化 + 挂钩子 + 开 HUD
   * @returns {object} { world, hooked, hud }
   */
  function start() {
    const world = init(false)
    const hooked = H.attach()
    if (HUD) HUD.startHud(1000)
    console.log('[APP] 已启动 · ' + (hooked ? '自动推进已开启' : '需手动调 step()'))
    return { world, hooked, hud: !!HUD }
  }

  /**
   * 停止：摘钩子 + 停 HUD，不清数据
   */
  function stop() {
    H.detach()
    if (HUD) HUD.stopHud()
    console.log('[APP] 已停止')
  }

  root.OKH_APP = Object.freeze({
    // 生命周期
    init,
    start,
    stop,

    // 推演
    step: H.step,

    // 数据
    world: W.loadWorld,
    save: W.saveWorld,
    reset: W.resetWorld,

    // 配置
    config: CFG.buildConfig,

    // 调试（挂一份，方便直接敲 OKH_APP.status()）
    status: D.status,
    watch: D.watch,
    ledger: D.ledger,
    queue: D.queue,

    // 界面
    renderHud: HUD ? HUD.render : () => false,

    // 子模块
    CFG, W, A, H, D, HUD
  })

  console.log('[OKH_APP] 已就绪 · 初始化用 OKH_APP.init()')

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
