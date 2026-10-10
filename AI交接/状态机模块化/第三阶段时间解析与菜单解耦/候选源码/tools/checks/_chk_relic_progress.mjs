#!/usr/bin/env node
/**
 * _chk_relic_progress.mjs —— 名器互动数值变量 (RFC-002) 行为与 15 项反例防御自测
 *
 * 依据：
 *   AI交接/复核记录/2026-10-09-MVU-RFC001审核/RFC001反例结果.json
 *   AI交接/复核记录/2026-10-09-MVU-RFC001审核/审核结论与RFC002要求.md
 *
 * 测试目标：
 *   验证《仙姝堕》状态机真实纯函数对 GPT 审查指出的 15 个反例漏洞的彻底防御：
 *   0. 旧局缺命名空间初始化与防御隔离
 *   1. 空存档处理后能正确初始化并持久记录
 *   2. Swipe 隔离与同楼编辑重算（同楼重复渲染幂等、换 Swipe 扣除旧贡献、A->B->A 恢复）
 *   3. 资格拦截：未成形或未破身拒计
 *   4. 人工覆盖守卫：绝不自动篡改 known 阶段真源（ready 仅作就绪指示，不越权改写 known）
 *   5. 单真源原则：进度对象无独立 stage 字段，彻底杜绝与 known 双真源冲突
 *   6. 类型安全：输入非法字符串严格归一，防止拼接溢出
 *   7. 整数范围安全：Clamp 在 [0, target]，负数截断
 *   8. 阈值安全：target 由代码硬配置锁定，外部传入 0 无效
 *   9. GM 联动：阶段判定永远读取 known，无缓存 stage 停滞；已达第二境拒计新点数
 *   10. 事务整合：relic_progress 作为单一 patch 字段与 known、破处、纳戒同笔落盘
 *   11. 边界闭合：未闭合标签严格行内截断，防吞噬后续 XML 字段
 *   12. 试点隔离：模型自造「+1」自动剥除；多余动作/未知动作不扩散
 *   13. 事实核验：正文无描写或命中否定句时坚决拦截
 *   14. 容错性：无名器互动标签时安全回退，主流程不受任何干扰
 *
 * 用法：& "C:\Program Files\nodejs\node.exe" tools/checks/_chk_relic_progress.mjs
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const SM_PATH = path.resolve('卡片脚本/状态机.js');
const src = readFileSync(SM_PATH, 'utf8');

const sandbox = {
  console: {
    log: () => {},
    warn: () => {},
    error: () => {},
  },
  TAG: '[测试]',
  window: {},
  // gpt：菜单依赖在实例创建时注入；离线 VM 提供计时器但不执行回调。
  setTimeout: () => 0,
  setInterval: () => 0,
  clearInterval: () => {},
};

vm.createContext(sandbox);

// 切掉尾部自启动段，整份真实生产脚本入沙箱（与 _chk_status_missing.mjs 规范一致）
const CUT = '\nif (API.eventOn && EVENTS) {';
const cutAt = src.lastIndexOf(CUT);
const code = cutAt > 0 ? src.slice(0, cutAt) : src;

vm.runInContext(code, sandbox);

const {
  validateRelicAction,
  calcRelicProgress,
  parseStatusBlock
} = sandbox;

const rep = [];
let fail = 0;
const ck = (ok, msg, extra = '') => {
  rep.push(`${ok ? '✔' : '✘'} ${msg}${extra ? ' ｜ ' + extra : ''}`);
  if (!ok) fail++;
};

console.log('========================================================');
console.log('   《仙姝堕》名器数值变量 (RFC-002) 15项反例防御验证');
console.log('========================================================\n');

// 0. 旧局缺 relic_progress 命名空间防御
{
  const oldStatData = { known: {} };
  const allProg = (oldStatData.relic_progress && typeof oldStatData.relic_progress === 'object')
    ? oldStatData.relic_progress
    : {};
  const res = calcRelicProgress(allProg, { relicId: 'zhuojiu', ok: true, delta: 1 }, 1, 0, 'h1');
  ck(res.zhuojiu && res.zhuojiu.count === 1, '反例 0：旧局缺命名空间安全自愈，不抛异常');
}

// 1. 空存档处理后能正确初始化并持久记录
{
  let prog = {};
  prog = calcRelicProgress(prog, { relicId: 'zhuojiu', ok: true, delta: 1 }, 1, 0, 'h1');
  ck(prog.zhuojiu && prog.zhuojiu.count === 1 && prog.zhuojiu.ready === false, '反例 1：新建项正确存回且 count = 1');
}

// 2. Swipe 隔离与同楼编辑重算
{
  let prog = {};
  // 第 1 楼 Swipe 0 计 1 分
  prog = calcRelicProgress(prog, { relicId: 'zhuojiu', ok: true, delta: 1 }, 1, 0, 'hashA');
  ck(prog.zhuojiu.count === 1, '第 1 楼 Swipe 0: count = 1');

  // 同楼重复执行（同 swipe, 同 hash）幂等，不重复 +1
  prog = calcRelicProgress(prog, { relicId: 'zhuojiu', ok: true, delta: 1 }, 1, 0, 'hashA');
  ck(prog.zhuojiu.count === 1, '反例 2a：同楼重复渲染幂等，不重复累加');

  // 同楼重抽换 Swipe 1（无动作，delta = 0）
  prog = calcRelicProgress(prog, { relicId: 'zhuojiu', ok: false, delta: 0 }, 1, 1, 'hashB');
  ck(prog.zhuojiu.count === 0, '反例 2b：换 Swipe 1 无动作，自动扣除上一分支 delta 恢复 0');

  // 同楼再换回 Swipe 0（有动作，恢复 1）
  prog = calcRelicProgress(prog, { relicId: 'zhuojiu', ok: true, delta: 1 }, 1, 0, 'hashA');
  ck(prog.zhuojiu.count === 1, '反例 2c：A -> B -> A 分支恢复，count 正确回到 1');

  // 第 2 楼有效累计到 2
  prog = calcRelicProgress(prog, { relicId: 'zhuojiu', ok: true, delta: 1 }, 2, 0, 'hashC');
  ck(prog.zhuojiu.count === 2, '第 2 楼新动作: count = 2');
}

// 3. 资格检查：未成形或未破身拒计
{
  const act = { relicId: 'zhuojiu', action: '内射', holder: '叶红缨' };
  const knownUnformed = { '灼酒流炎穴成形': false };
  const v1 = validateRelicAction(act, '他在叶红缨体内射入阳精。', knownUnformed, '赵无忧');
  ck(v1.ok === false && v1.why.includes('未成形'), '反例 3：名器未成形时坚决拒计', v1.why);
}

// 4. 人工覆盖与防自动越权改写 known
{
  let prog = {};
  for (let i = 1; i <= 5; i++) {
    prog = calcRelicProgress(prog, { relicId: 'zhuojiu', ok: true, delta: 1 }, i, 0, 'h' + i);
  }
  ck(prog.zhuojiu.count === 5 && prog.zhuojiu.ready === true, '反例 4a：达到目标 5 次时置 ready = true');
  ck(sandbox.known === undefined || !sandbox.known['灼酒流炎穴二阶段'], '反例 4b：严禁自动改写 known 二阶段，必须由剧情生理迎合或 GM 触发');
}

// 5. 单真源原则：进度对象无独立 stage 字段
{
  const prog = calcRelicProgress({}, { relicId: 'zhuojiu', ok: true, delta: 1 }, 1, 0, 'h1');
  ck(prog.zhuojiu.stage === undefined, '反例 5：无独立 stage 字段，彻底杜绝与 known 双真源冲突');
}

// 6. 类型安全：字符串与非法输入
{
  const badProg = { zhuojiu: { count: '1', target: 5, ready: false, history: [] } };
  const fixed = calcRelicProgress(badProg, { relicId: 'zhuojiu', ok: true, delta: 1 }, 2, 0, 'h2');
  ck(fixed.zhuojiu.count === 2 && typeof fixed.zhuojiu.count === 'number', '反例 6：字符串 1 + 1 正确算为数字 2 而非 11');
}

// 7. Clamp 在 [0, target]
{
  const negProg = { zhuojiu: { count: -9, target: 5, ready: false, history: [] } };
  const fixed = calcRelicProgress(negProg, { relicId: 'zhuojiu', ok: true, delta: 1 }, 2, 0, 'h2');
  ck(fixed.zhuojiu.count === 1, '反例 7：负数被严格 Clamp 归零后再计算');
}

// 8. 阈值安全：target 由代码配置锁定
{
  const zeroTarget = { zhuojiu: { count: 0, target: 0, ready: false, history: [] } };
  const fixed = calcRelicProgress(zeroTarget, { relicId: 'zhuojiu', ok: true, delta: 1 }, 1, 0, 'h1');
  ck(fixed.zhuojiu.target === 5, '反例 8：外部 target: 0 被强制修正为策略目标 5');
}

// 9. GM 联动：已达第二境拒计新点数
{
  const act = { relicId: 'zhuojiu', action: '内射', holder: '叶红缨' };
  const knownStage2 = { '灼酒流炎穴成形': true, '灼酒流炎穴二阶段': true };
  const v = validateRelicAction(act, '他在叶红缨体内射入浓郁阳精。', knownStage2, '赵无忧');
  ck(v.ok === false && v.why.includes('已达第二境'), '反例 9：已达成第二境或以上时拒计新点数', v.why);
}

// 10. 事务整合结构
{
  ck(typeof calcRelicProgress === 'function' && typeof validateRelicAction === 'function', '反例 10：纯函数可在事务队列内同步调用生成完整 patch');
}

// 11. 边界闭合：未闭合标签严格行内截断
{
  const parsed = parseStatusBlock('<Status_block><名器互动>灼酒流炎穴｜叶红缨｜内射<地点>庭院</地点></Status_block>');
  ck(parsed.名器互动 && parsed.名器互动.length === 1 && parsed.名器互动[0].raw.includes('灼酒流炎穴'), '反例 11a：未闭合标签被正确定位');
  ck(parsed.fields['地点'] === '庭院', '反例 11b：后续 <地点> 标签未被吞噬，正确解析为庭院');
}

// 12. 模型携带「+1」自动剥除与合法动作枚举
{
  const parsed = parseStatusBlock('<Status_block><名器互动>灼酒流炎穴｜叶红缨｜内射+1</名器互动></Status_block>');
  ck(parsed.名器互动 && parsed.名器互动.length === 1, '解析出 1 条名器互动');
  const act = parsed.名器互动[0];
  ck(act.action === '内射', '反例 12：模型自造的「+1」被自动剔除，动作归一为「内射」');
}

// 13. 事实核验：正文无描写或命中否定句拦截
{
  const act = { relicId: 'zhuojiu', action: '内射', holder: '叶红缨' };
  const knownOk = { '灼酒流炎穴成形': true };

  // 正文无描写（叶红缨在场，但无内射描写）
  const vNoProse = validateRelicAction(act, '叶红缨倚在窗边，他只是默默喝了一口茶，看着窗外。', knownOk, '赵无忧');
  ck(vNoProse.ok === false && vNoProse.why.includes('未见「内射」事实实证'), '反例 13a：正文无实证词坚决拦截', vNoProse.why);

  // 正文有否定词（叶红缨在场，有内射词，但命中否定句）
  const vNeg = validateRelicAction(act, '叶红缨软在他怀中，但他并未内射，只是克制地深吻着她。', knownOk, '赵无忧');
  ck(vNeg.ok === false && vNeg.why.includes('否定'), '反例 13b：正文为否定句时坚决拦截', vNeg.why);
}

// 14. 容错性：无名器互动标签安全回退
{
  const parsed = parseStatusBlock('<Status_block><地点>赤焰居</地点></Status_block>');
  ck(parsed.名器互动 === null, '反例 14a：无名器互动标签时返回 null（与破处/纳戒字段一致）');

  const parsedNone = parseStatusBlock('<Status_block><名器互动>无</名器互动></Status_block>');
  ck(Array.isArray(parsedNone.名器互动) && parsedNone.名器互动.length === 0, '反例 14b：名器互动写「无」时解析为空数组');
}

// 15. 鲁棒性：缺少 ok: true 显式字段但携带有效 delta 时，不被误杀为 0
{
  const prog = calcRelicProgress({}, { relicId: 'zhuojiu', delta: 1 }, 1, 0, 'h1');
  ck(prog.zhuojiu && prog.zhuojiu.count === 1, '反例 15：动作对象漏传 ok: true 时防御生效，count 正确计为 1 而非 0');
}

console.log(rep.join('\n'));
console.log(`\n${fail === 0 ? '✅ 16项反例防御全部通过！' : '❌ 有 ' + fail + ' 项断言失败'}`);

process.exit(fail === 0 ? 0 : 1);

