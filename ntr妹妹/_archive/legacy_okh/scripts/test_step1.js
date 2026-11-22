/**
 * test_step1.js — 第一步地基自测
 *
 * 验证 okh_boot + okh_core 能否正常读写变量。
 * 在 Node 里跑（内存模式），跑通了说明逻辑没问题，可以搬进酒馆。
 *
 * 运行：node scripts/test_step1.js
 */

// 模拟浏览器环境
globalThis.window = globalThis

require('../tavern_scripts/0_okh_boot.js')
require('../tavern_scripts/1_okh_core.js')

const core = window.__OKH__.modules.core

let pass = 0, fail = 0

/**
 * 断言
 * @param {string} name
 * @param {boolean} cond
 * @param {any} [detail]
 */
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ✓ ${name}`)
    pass++
  } else {
    console.log(`  ✗ ${name}` + (detail !== undefined ? `  实际：${JSON.stringify(detail)}` : ''))
    fail++
  }
}

console.log('\n=== 第一步：地基自测 ===\n')

// 1. 注册表
check('注册表已建立', !!window.__OKH__)
check('版本号存在', typeof window.__OKH__.version === 'string')
check('ready 标记为 true', window.__OKH__.ready === true)
check('core 模块已注册', typeof core === 'object')

// 2. 基础读写
console.log('')
core.write('test.number', 42)
check('写数字再读回', core.read('test.number') === 42)

core.write('test.text', '奥萝拉')
check('写中文再读回', core.read('test.text') === '奥萝拉')

core.write('test.obj', { hp: 80, name: '伯里' })
check('写对象再读回', core.read('test.obj')?.hp === 80)

core.write('test.arr', [1, 2, 3])
check('写数组再读回', JSON.stringify(core.read('test.arr')) === '[1,2,3]')

// 3. 默认值
console.log('')
check('读不存在的键返回 fallback', core.read('test.nothing', '默认') === '默认')
check('读不存在的键返回 null', core.read('test.nothing') === null)

// 4. 存在性
console.log('')
check('has 能识别已存在的键', core.has('test.number') === true)
check('has 能识别不存在的键', core.has('test.ghost') === false)

// 5. 删除
console.log('')
core.remove('test.number')
check('删除后读不到', core.read('test.number') === null)

// 6. 嵌套路径
console.log('')
core.write('npcs.aurora.corruption', 0)
core.write('npcs.aurora.room_id', 'church')
check('嵌套路径写入正常', core.read('npcs.aurora.corruption') === 0)
check('同层不同字段互不干扰', core.read('npcs.aurora.room_id') === 'church')

// 7. 模拟一次时间累加（第五步要用的逻辑）
console.log('')
core.write('sys.total_min', 0)
for (let i = 0; i < 3; i++) {
  core.write('sys.total_min', core.read('sys.total_min', 0) + 30)
}
check('三次 +30 后等于 90', core.read('sys.total_min') === 90)

// 8. 存储模式
console.log('')
check('当前为内存模式（Node 环境）', core.mode === 'memory')

// 收尾
console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===\n`)

if (fail === 0) {
  console.log('地基没问题。下一步：把这两个脚本粘进酒馆，在控制台再验一次。')
  console.log('验证方法见 scripts/test_step1.md')
} else {
  console.log('有失败项，先修再往下走。')
  process.exitCode = 1
}
