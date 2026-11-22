/**
 * @module      okh_boot
 * @updated     2026-11-08 19:50
 * @status      active
 * @reason      建立全局注册表，让后面加载的脚本能找到彼此（浏览器环境没有 import）
 * @deps        []
 * @provides    { __OKH__ }
 *
 * 用法：在酒馆助手里新建脚本，排第一个，内容整段粘贴。
 */

(function () {
  'use strict'

  // 已经有了就不重复建，避免热重载时把模块全清掉
  if (window.__OKH__) {
    console.log('[OKH] 注册表已存在，跳过初始化')
    return
  }

  window.__OKH__ = {
    version: '0.1.0',
    modules: {},
    /** 钩子表：让上层订阅下层事件，避免下层反向依赖上层 */
    hooks: { afterTurn: [] },
    ready: false,
    loadedAt: new Date().toISOString()
  }

  console.log('[OKH] 注册表已建立 · v' + window.__OKH__.version)
})()
