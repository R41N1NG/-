/**
 * @module      okh_core
 * @updated     2026-11-08 19:50
 * @status      active
 * @reason      统一变量读写入口。所有模块只能通过它碰变量池，不许直接调 getvar/setvar
 * @deps        ['okh_boot']
 * @provides    { read, write, has, remove, keys, mode, dump }
 *
 * 用法：在酒馆助手里新建脚本，排在 okh_boot 之后，内容整段粘贴。
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) {
    console.error('[OKH] okh_core 加载失败：注册表不存在，请先加载 okh_boot')
    return
  }

  const PREFIX = 'okh'

  // ============================================================
  // 存储适配层
  //   酒馆里用 getvar/setvar，Node 测试时退回内存 Map
  //   这样同一份代码两边都能跑，测试不用另写一套
  // ============================================================

  const store = (function () {
    if (typeof getvar === 'function' && typeof setvar === 'function') {
      return {
        mode: 'tavern',
        get: k => {
          try { return getvar(k) } catch (e) { return undefined }
        },
        set: (k, v) => {
          try { setvar(k, v) } catch (e) { /* 静默失败，由调用方回读校验 */ }
        },
        has: k => {
          try { return getvar(k) !== undefined } catch (e) { return false }
        },
        del: k => {
          try { if (typeof deletevar === 'function') deletevar(k) } catch (e) {}
        }
      }
    }
    const mem = new Map()
    return {
      mode: 'memory',
      get: k => mem.get(k),
      set: (k, v) => { mem.set(k, v) },
      has: k => mem.has(k),
      del: k => { mem.delete(k) }
    }
  })()

  // ============================================================
  // 对外接口
  // ============================================================

  /**
   * 读变量
   * @param {string} path 不带前缀的路径，如 'sys.total_min'
   * @param {any} fallback 读不到时的默认值
   * @returns {any}
   */
  function read(path, fallback = null) {
    const v = store.get(`${PREFIX}.${path}`)
    return (v === undefined || v === null) ? fallback : v
  }

  /**
   * 写变量
   * @param {string} path 不带前缀的路径
   * @param {any} value
   * @returns {boolean} 写入后回读是否一致
   */
  function write(path, value) {
    const key = `${PREFIX}.${path}`
    store.set(key, value)

    // 回读校验：酒馆的 setvar 偶有静默失败，写完立刻验一次
    const back = store.get(key)
    const ok = JSON.stringify(back) === JSON.stringify(value)
    if (!ok) console.warn('[OKH] 写入校验失败：', path)
    return ok
  }

  /**
   * 是否存在
   * @param {string} path
   * @returns {boolean}
   */
  function has(path) {
    return store.has(`${PREFIX}.${path}`)
  }

  /**
   * 删除
   * @param {string} path
   */
  function remove(path) {
    store.del(`${PREFIX}.${path}`)
  }

  /**
   * 列出某前缀下的所有路径
   * @param {string} [pathPrefix] 可选，如 'npcs.'
   * @returns {string[]}
   */
  function keys(pathPrefix = '') {
    if (typeof getVariables !== 'function') return []
    try {
      const all = getVariables() || {}
      const full = `${PREFIX}.${pathPrefix}`
      return Object.keys(all).filter(k => k.startsWith(full))
    } catch (e) {
      return []
    }
  }

  /**
   * 打印全部变量（调试用）
   * @returns {object}
   */
  function dump() {
    const out = {}
    for (const k of keys()) out[k] = store.get(k)
    console.table(out)
    return out
  }

  // ============================================================
  // 注册
  // ============================================================

  REG.modules.core = { read, write, has, remove, keys, dump, mode: store.mode }
  REG.ready = true

  console.log(`[OKH] core 已就绪 · 存储模式：${store.mode}`)
})()
