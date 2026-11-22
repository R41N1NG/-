/**
 * @module      okh_hud
 * @updated     2026-11-08 20:11
 * @status      active
 * @reason      渲染在场信息。只填已有容器，不改页面布局；找不到容器时降级为控制台输出
 * @deps        ['okh_boot']
 * @provides    { render, CONTAINER_SELECTOR }
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) { console.error('[OKH] okh_hud 加载失败'); return }

  /** 宿主容器选择器：主人在状态栏 HTML 里放一个空 div 挂这个属性即可 */
  const CONTAINER_SELECTOR = '[data-okh-hud]'

  /**
   * 找容器
   * @returns {Element|null}
   */
  function findContainer() {
    if (typeof document === 'undefined') return null
    return document.querySelector(CONTAINER_SELECTOR)
  }

  /**
   * 生成在场文本
   * @param {object} report
   * @returns {string}
   */
  function presentText(report) {
    const list = report?.present || []
    if (!list.length) return '无'
    return list.map(p => p.cue ? `${p.name}（${p.cue}）` : p.name).join('｜')
  }

  /**
   * 渲染监听面板（可选）
   * 只有页面上存在 [data-okh-watch] 容器时才写，否则什么都不做
   * @param {object} watch
   */
  function renderWatch(watch) {
    if (typeof document === 'undefined') return
    const el = document.querySelector('[data-okh-watch]')
    if (!el) return

    if (!watch || !watch.list) { el.textContent = ''; return }

    const lines = watch.list.filter(x => x.alive).map(x => {
      const stage = { normal: '正常', anomaly: '异常', sinking: '沉沦', subjugated: '臣服' }[x.stage] || x.stage
      const mark = x.present ? '● 在场' : '○ 不在'
      return `${x.name}｜${x.locationName}｜${stage}｜堕落 ${x.corruption}｜${mark}`
    })
    el.textContent = lines.join('\n')
    el.setAttribute('data-okh-watch-turn', String(watch.turn ?? 0))
  }

  /**
   * 渲染
   * @param {object} report runTurn 的返回值
   */
  function render(report) {
    const text = presentText(report)
    const el = findContainer()

    if (el) {
      el.textContent = text
      el.setAttribute('data-okh-turn', String(report?.turn ?? 0))
      el.setAttribute('data-okh-phase', report?.phase ?? '')
    }

    // 监听面板（独立容器，没有就跳过）
    if (report?.watch) renderWatch(report.watch)

    // 降级：没有在场容器就在控制台打一行
    if (!el && typeof console !== 'undefined') {
      console.log(`[OKH] 第${report?.turn ?? '-'}回合 · ${report?.phase ?? '-'} · 在场：${text}`)
    }
  }

  REG.modules.hud = { render, presentText, CONTAINER_SELECTOR }

  // 订阅推演完成事件（由 turn 触发，hud 不反向调用 turn）
  if (REG.hooks) {
    REG.hooks.afterTurn = (REG.hooks.afterTurn || []).concat(render)
  }

  console.log('[OKH] hud 已就绪 · 容器选择器 ' + CONTAINER_SELECTOR)
})()
