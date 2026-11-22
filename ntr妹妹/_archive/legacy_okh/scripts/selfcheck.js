/**
 * selfcheck.js — 酒馆内一键自检
 *
 * 用法：全部复制，粘进酒馆控制台（F12），回车。
 * 会自动检查 8 项，最后给结论。
 *
 * 不需要装额外东西。
 */

(function () {
  'use strict'

  const results = []
  const check = (name, fn) => {
    try {
      const r = fn()
      results.push({ 检查项: name, 结果: r === true ? '✓' : (r === false ? '✗' : r) })
      return r
    } catch (e) {
      results.push({ 检查项: name, 结果: '✗ ' + e.message })
      return false
    }
  }

  console.log('\n══════ OKH 自检 ══════\n')

  // ---------- 1. 注册表 ----------
  const hasReg = check('① 注册表存在', () => !!window.__OKH__)
  if (!hasReg) {
    console.error('❌ 脚本没加载。检查酒馆助手里 11 个脚本是否启用、顺序是否正确。')
    return
  }

  // ---------- 2. 模块齐不齐 ----------
  const NEED = ['core', 'schema', 'rules', 'agency', 'presence', 'translate', 'turn', 'hud', 'debug', 'data']
  const missing = NEED.filter(m => !window.__OKH__.modules[m])
  results.push({ 检查项: '② 模块完整', 结果: missing.length ? '✗ 缺 ' + missing.join(',') : '✓ 10/10' })

  // ---------- 3. 存储模式 ----------
  const mode = window.__OKH__.modules.core?.mode
  results.push({
    检查项: '③ 存储模式',
    结果: mode === 'tavern' ? '✓ tavern（能进存档）'
        : mode === 'memory' ? '△ memory（刷新会丢，getvar 不可用）'
        : '✗ 未知'
  })

  // ---------- 4. 变量池读写 ----------
  check('④ 变量池读写', () => {
    const c = window.__OKH__.modules.core
    c.write('__selfcheck', 'ok')
    return c.read('__selfcheck') === 'ok'
  })
  results.push({ 检查项: '④ 变量池读写', 结果: '✓' })

  // ---------- 5. 数据装载 ----------
  let npcCount = 0
  check('⑤ 数据已装载', () => {
    const npcs = window.__OKH__.modules.core.read('npcs', {})
    npcCount = Object.keys(npcs).length
    return npcCount > 0
  })
  results.push({
    检查项: '⑤ 数据已装载',
    结果: npcCount > 0 ? `✓ ${npcCount} 个角色` : '✗ 未装载，跑 __OKH__.modules.data.seed()'
  })

  // ---------- 6. 时间解析 ----------
  check('⑥ 时间解析', () => {
    const t = window.__OKH__.modules.turn
    return t.parseElapsed('<time elapsed="30" />') === 30
  })

  // ---------- 7. 能否跑一轮 ----------
  let turnOk = false
  check('⑦ 推演可执行', () => {
    const r = window.__OKH__.modules.turn.runTurn({ force: true })
    turnOk = !!(r && r.present)
    return turnOk
  })

  // ---------- 8. 变量是否真的被写 ----------
  const d1 = check('⑧ char_d1 已写入', () => {
    const keys = Object.keys(window.__OKH__.modules.core.read('base_d1', {}))
    if (!keys.length) return false
    return !!window.__OKH__.modules.core.read(`char_d1_${keys[0]}`, '')
  })

  // ---------- 输出 ----------
  console.table(results)

  const fails = results.filter(r => String(r.结果).startsWith('✗'))
  const warns = results.filter(r => String(r.结果).startsWith('△'))

  console.log('\n══════ 结论 ══════')
  if (!fails.length && !warns.length) {
    console.log('✅ 全部通过。系统在这个酒馆里可以正常工作。')
  } else {
    if (fails.length) {
      console.log(`❌ ${fails.length} 项失败：${fails.map(f => f.检查项).join('、')}`)
    }
    if (warns.length) {
      console.log(`⚠️  ${warns.length} 项警告：${warns.map(w => w.检查项).join('、')}`)
      console.log('   警告不阻断使用，但刷新页面后数据可能丢。')
    }
    console.log('\n排查顺序：')
    console.log('  1. 注册表都没有 → 脚本没启用')
    console.log('  2. 模块缺 → 脚本顺序错，或某个文件语法错')
    console.log('  3. memory 模式 → getvar/setvar 不可用，换酒馆助手版本')
    console.log('  4. 数据没装载 → 手动跑 __OKH__.modules.data.seed()')
  }

  // ---------- 附：看看谁在哪儿 ----------
  if (npcCount > 0) {
    console.log('\n══════ 角色位置 ══════')
    const npcs = window.__OKH__.modules.core.read('npcs', {})
    console.table(Object.values(npcs).map(n => ({
      姓名: n.name,
      阶段: n.stage,
      堕落: n.corruption,
      位置: n.location,
      底线: (window.__OKH__.modules.rules.activeLineIds(n) || []).join(',') || '无'
    })))
  }

  console.log('')
})()
