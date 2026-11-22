/**
 * @module okh_app_world
 * @updated 2026-11-09 06:45
 * @status  demo
 * @reason  world 的读写与首次初始化。存储适配层让同一份代码在酒馆和 Node 都能跑
 * @deps    ['okh_app_config'] + gpt_core_all（初始化时需要 OKHBackground）
 * @provides { store, loadWorld, saveWorld, ensureWorld, resetWorld, STORAGE_KEY }
 */

(function (root) {
  'use strict'

  const CFG = root.OKH_APP_CONFIG
  if (!CFG) { console.error('[APP] 需要先加载 01_config.js'); return }

  const STORAGE_KEY = 'okh_gpt.world'

  // ============================================================
  // 一、存储适配层
  //    酒馆里用 getvar/setvar，Node 里退回内存 Map
  // ============================================================

  const store = (function () {
    if (typeof getvar === 'function' && typeof setvar === 'function') {
      return {
        mode: 'tavern',
        get: k => { try { return getvar(k) } catch (e) { return undefined } },
        set: (k, v) => { try { setvar(k, v) } catch (e) {} },
        del: k => { try { if (typeof deletevar === 'function') deletevar(k) } catch (e) {} }
      }
    }
    const mem = new Map()
    return {
      mode: 'memory',
      get: k => mem.get(k),
      set: (k, v) => { mem.set(k, v) },
      del: k => { mem.delete(k) }
    }
  })()

  // ============================================================
  // 二、读写
  // ============================================================

  /**
   * 读 world
   * @returns {object|null}
   */
  function loadWorld() {
    const raw = store.get(STORAGE_KEY)
    if (raw === undefined || raw === null) return null
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) } catch (e) { return null }
    }
    return raw
  }

  /**
   * 写 world
   * @param {object} world
   * @returns {boolean} 回读校验结果
   */
  function saveWorld(world) {
    const text = JSON.stringify(world)
    store.set(STORAGE_KEY, text)

    const back = store.get(STORAGE_KEY)
    const ok = back === text
    if (!ok) console.warn('[APP] world 写入校验失败')
    return ok
  }

  // ============================================================
  // 三、初始化
  // ============================================================

  /**
   * 确保 world 存在；不存在就初始化
   * @param {boolean} force 为 true 时强制重建
   * @returns {object}
   */
  function ensureWorld(force = false) {
    if (!force) {
      const existing = loadWorld()
      if (existing && existing.bg?.version === 2) return existing
    }

    const GPT = root.OKHBackground
    if (!GPT) {
      throw new Error('[APP] 需要先加载 gpt_core_all.js')
    }

    const world = GPT.init(CFG.buildInitialWorld(), CFG.buildConfig())
    saveWorld(world)
    console.log('[APP] world 已初始化 · ' + Object.keys(world.npcs).length + ' 个角色')
    return world
  }

  /**
   * 清空重来
   * @returns {object}
   */
  function resetWorld() {
    store.del(STORAGE_KEY)
    return ensureWorld(true)
  }

  root.OKH_APP_WORLD = Object.freeze({
    STORAGE_KEY,
    store,
    loadWorld,
    saveWorld,
    ensureWorld,
    resetWorld
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_WORLD
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
