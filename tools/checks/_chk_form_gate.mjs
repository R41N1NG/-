#!/usr/bin/env node
/**
 * _chk_form_gate.mjs —— 名器成形闸门自测（2026-10-06 主人令改造）
 *
 * 为什么写它：上一轮的 `scratch/test_statemachine_relic.js` 只做了两件事 ——
 *   ① 用 `includes()` 在源码里搜字符串；② **手抄一份** `applyMilestones` 的副本喂假数据。
 *   真函数一次都没调用过，于是「11 个名字从来没进过台账、判据永远是假」这种病一路绿灯。
 * 本脚本跑的是真货：`卡片脚本/状态机.js` 里那个 `applyMilestones`，
 * 与 `卡片脚本/状态栏面板.js` 里那个 `xsdRelicState`（切出来注入桩，在 vm 里跑）。
 *
 * 六组用例：
 *   ① 口交误报拦截 —— 真机第 5 楼原文重放：报了成形、破处簿空、正文无破身词 ⇒ 必须丢弃
 *   ② 真破身放行 —— 破处簿写「孤月、赵无忧」⇒ 自动补成形 ＋ 名器归属 = 赵无忧
 *   ③ 漏标挽救 —— 只报成形，正文「孤月」附近有破身词 ⇒ 放行；没有 ⇒ 丢弃
 *   ④ 双姝用且 —— 只丢一个不成形；跨回合两个都丢 ⇒ 成形
 *   ⑤ 别名归一 —— 「孤月元阴被夺」归一到「孤月处女丧失」并补成形
 *   ⑥ 归属三身份 —— 自设／赵无忧／浊龙殿主；外加「破处者是别人 ⇒ 显示已被占据」
 *
 * 用法：node tools/checks/_chk_form_gate.mjs      （退出码 0＝全通过，1＝有失败）
 */
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const SM = '卡片脚本/状态机.js';
const PANEL = '卡片脚本/状态栏面板.js';
const FIXTURE_JSONL = 'E:/tavern/SillyTavern/data/default-user/chats/仙姝堕/仙姝堕 - 2026-10-06@16h16m49s.jsonl';

/* ── 切片：把三个函数块从真源里切出来 ── */
const src = readFileSync(SM, 'utf8');
const tableCode = (() => {
  const a = src.indexOf('const FIELD_TABLE');
  const b = src.indexOf('const DEFLOWER_HARD_WORDS');
  if (a < 0 || b < 0) throw new Error('状态机.js 里找不到 FIELD_TABLE 或常量块');
  return src.slice(a, src.indexOf('\n', src.indexOf(';', b)));
})();
const helperCode = (() => {
  const a = src.indexOf('function normalizeAnchorName');
  const b = src.indexOf('/* ── 状态条外壳');
  if (a < 0 || b < 0) throw new Error('状态机.js 里找不到归一／硬词那两段');
  return src.slice(a, b);
})();
/* ★ 2026-10-06：纳戒那一套纯函数（归一、匹配、增删、对账）在另一段，必须也切进来，
 *   否则 applyMilestones 一调 applyItemChange 就 ReferenceError。 */
const nadeCode = (() => {
  const a = src.indexOf('function normItemName');
  const b = src.indexOf('function defaultInventoryRaw');
  if (a < 0 || b < 0) throw new Error('状态机.js 里找不到纳戒那一段纯函数');
  return src.slice(a, b);
})();
const fnCode = (() => {
  const a = src.indexOf('async function applyMilestones');
  const b = src.lastIndexOf('/**', src.indexOf('把解析结果并入'));
  if (a < 0 || b < 0) throw new Error('状态机.js 里找不到 applyMilestones');
  return src.slice(a, b);
})();

/** 建一个跑真 applyMilestones 的沙箱；`stat` 就是它的 stat_data */
function makeRunner(stat) {
  const logs = [];
  const writes = [];
  const box = {
    console: {
      log: (...a) => logs.push(a.join(' ')),
      warn: (...a) => logs.push(a.join(' ')),
      error: (...a) => logs.push(a.join(' ')),
    },
    TAG: '[仿真]',
    readKnown: () => (stat.known && typeof stat.known === 'object' ? stat.known : {}),
    readStatData: () => stat,
    readIdentity: () => stat.身份 || '赵无忧',
    defaultInventoryFor: () => [],
    /* 对账用：`stat.__floors` 模拟「聊天里还剩哪几楼」，读不到就返回空串（＝那一楼已被删） */
    messageText: (id) => String((stat.__floors && stat.__floors[id]) || ''),
    writeStat: async (patch) => {
      writes.push(patch);
      for (const k of Object.keys(patch)) {
        if (k === 'known') Object.assign((stat.known = stat.known || {}), patch.known);
        else stat[k] = patch[k];
      }
      return { ok: true, via: '仿真' };
    },
  };
  vm.createContext(box);
  vm.runInContext(tableCode + '\n' + helperCode + '\n' + nadeCode + '\n' + fnCode
    + '\nglobalThis.__apply = applyMilestones;\nglobalThis.__reconcile = reconcileNadeLedger;', box);
  box.__reconcile = box.__reconcile || (async () => false);
  return { box, logs, writes, run: (p, text, floor = 1) => box.__apply(p, floor, text) };
}

/* ── 用例 ① 的真机原文：优先读记录，读不到用逐字摘录 ── */
const FIXTURE_FALLBACK = [
  '孤月呼吸骤停，耳根与精致锁骨腾地烧起大片绯红。她强忍着几乎要将神魂烧融的羞耻，暗暗催动体内九幽玄阴脉，至精至纯的阴寒灵力自舌下涌出，化作一泓带着奇香的冰凉甘津。',
  '她长睫剧烈颤抖，闭上美眸，决然俯下螓首，将那两片冰凉柔软、从未教男子沾染过的娇嫩唇瓣，小心翼翼地覆上了滚烫如烙铁的肉棒顶端。',
  '极致的冰冷与极致的滚烫猝然交融！',
  '赵无忧浑身剧颤，喉间迸出一声沙哑破碎的低吼。那冰凉柔软的檀口宛如久旱甘霖，玄阴甘津顺着肉棒马眼缓缓度入，登时引得他腰胯不受控制地向上狠顶。孤月喉间溢出一声被堵住的娇柔呜咽，生涩地撑开窄小檀口，艰难地将滚烫粗硕的肉棒一点点含入口腔深处。',
].join('\n');
function floor5Text() {
  try {
    if (!existsSync(FIXTURE_JSONL)) return { text: FIXTURE_FALLBACK, from: '内置逐字摘录（记录文件不在本机）' };
    const msgs = readFileSync(FIXTURE_JSONL, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
    const body = String(msgs[5].mes).split(/<Status_block>/)[0];
    return { text: body, from: '真机记录第 5 楼全文（' + body.length + ' 字）' };
  } catch (e) {
    return { text: FIXTURE_FALLBACK, from: '内置逐字摘录（读记录失败：' + e.message + '）' };
  }
}

let pass = 0;
const fails = [];
function ck(name, cond, detail) {
  if (cond) { pass += 1; console.log(`  ✔ ${name}`); return; }
  fails.push(name + (detail ? '  —— ' + detail : ''));
  console.log(`  ✘ ${name}${detail ? '  —— ' + detail : ''}`);
}

console.log('========================================================');
console.log('   《仙姝堕》名器成形闸门自测（跑真函数）');
console.log('========================================================\n');

/* ═══ ① 口交误报拦截 ═══ */
{
  const fix = floor5Text();
  const stat = { known: {}, 身份: '赵无忧' };
  const r = makeRunner(stat);
  await r.run({
    里程碑: ['极乐引入手', '邪修洞府替孤月中毒', '邪修洞府解毒', '九幽玄阴穴成形'],
    破处: [],
  }, fix.text);
  console.log(`【① 口交误报拦截】正文来源：${fix.from}`);
  ck('正文里确实没有破身硬词（前置事实）',
    !['破身', '破处', '破瓜', '初破', '落红', '处子', '元阴失守', '元阴被夺', '初夜'].some((w) => fix.text.includes(w)));
  /* ★ 2026-10-07：现在**准入／跳段锚点也要正文实证**（`ANCHOR_EVIDENCE`）。
   *   这份 fixture 只是那段口交正文，里面既没提《极乐引》、也没提幽寂谷 ⇒ 那几个带实证要求的锚点
   *   会被「锚点闸门」丢弃，这是**设计如此**。所以这里改成：**不在实证表里的锚点**照常入账。 */
  const evTable = ['极乐引入手'];                        // 在 ANCHOR_EVIDENCE 里有词表（正文没提《极乐引》⇒ 应被丢弃）
  const noEv = ['邪修洞府替孤月中毒', '邪修洞府解毒'];      // 不在表里 ⇒ 必须照常入账
  ck('没有实证要求的锚点照常入账', noEv.every((f) => stat.known[f] === true));
  ck('实证表里的锚点在正文无据时被丢弃（新加的锚点闸门）', evTable.every((f) => stat.known[f] !== true));
  ck('「九幽玄阴穴成形」被丢弃', stat.known['九幽玄阴穴成形'] !== true);
  ck('连带不派生「获得任意名器」', stat.known['获得任意名器'] !== true);
  ck('日志里明说了丢弃与手工补法', r.logs.some((l) => l.includes('丢弃') && l.includes('九幽玄阴穴成形') && l.includes('/解锁')));
  ck('没有顺手写归属表', !stat.名器归属 || Object.keys(stat.名器归属).length === 0);
  console.log(`     （脚本日志 ${r.logs.length} 行，写盘 ${r.writes.length} 次）\n`);
}

/* ═══ ② 真破身放行 ═══ */
{
  const stat = { known: {}, 身份: '赵无忧' };
  const r = makeRunner(stat);
  await r.run({ 里程碑: ['九幽玄阴穴成形'], 破处: [{ 持有者: '孤月', 破处者: '赵无忧' }] }, '孤月被破身的那一夜。');
  console.log('【② 真破身放行】');
  ck('成形入账', stat.known['九幽玄阴穴成形'] === true);
  ck('名器归属 = 赵无忧（破处者是谁就归谁）', stat.名器归属 && stat.名器归属['九幽玄阴穴'] === '赵无忧');
  ck('破处簿落盘', stat.破处者 && stat.破处者['孤月'] === '赵无忧');
  ck('派生「获得任意名器」', stat.known['获得任意名器'] === true);
  console.log('');
}

/* ═══ ③ 漏标挽救 与 反例 ═══ */
{
  const s1 = { known: {}, 身份: '赵无忧' };
  await makeRunner(s1).run({ 里程碑: ['九幽玄阴穴成形'], 破处: [] }, '孤月闭上眼，任由自己在这一夜破了身，元阴初泄。');
  console.log('【③ 漏标挽救】');
  ck('正文实锤 ⇒ 挽救放行（不误杀真破身）', s1.known['九幽玄阴穴成形'] === true);

  const s2 = { known: {}, 身份: '赵无忧' };
  await makeRunner(s2).run({ 里程碑: ['九幽玄阴穴成形'], 破处: [] }, '孤月与他叙了半宿的旧事，烛火将尽。');
  ck('正文无实证 ⇒ 仍然丢弃', s2.known['九幽玄阴穴成形'] !== true);

  const s3 = { known: {}, 身份: '赵无忧' };
  const far = '那夜雨大，山路泥泞，同门彼此都没有多说什么。'.repeat(6);   // 把两个名字拉开 100 字以上
  await makeRunner(s3).run({ 里程碑: ['九幽玄阴穴成形'], 破处: [] },
    '叶红缨那一夜破了身。' + far + '孤月那夜在孤剑崖上打坐，什么都不知道。');
  ck('硬词离这个名字超过 80 字（破的是别人）⇒ 丢弃', s3.known['九幽玄阴穴成形'] !== true);
  /* ⚠️ 已知残量：一句里同时出现两个持有人名、且破身那句离**另一个**名字更近时，
   *    邻近度判不出来（例：「叶红缨那一夜破了身，孤月在门外守着」会被误救）。
   *    这类残余风险靠两条兜底：漏救可 `/解锁`、误救可 `/回锁`（§1.5 自愈）。 */
  console.log('');
}

/* ═══ ④ 双姝用且（跨回合）═══ */
{
  const stat = { known: {}, 身份: '赵无忧' };
  const r = makeRunner(stat);
  await r.run({ 里程碑: ['灵犀同心成形'], 破处: [{ 持有者: '苏瑶', 破处者: '赵无忧' }] }, '苏瑶先失了身。');
  console.log('【④ 双姝用且（跨回合）】');
  ck('只丢一个 ⇒ 灵犀同心不成形', stat.known['灵犀同心成形'] !== true);
  ck('先记的那个人不丢（破处簿留着）', stat.破处者 && stat.破处者['苏瑶'] === '赵无忧');

  await r.run({ 里程碑: [], 破处: [{ 持有者: '苏玲', 破处者: '赵无忧' }] }, '这一夜苏玲也失了身，姐妹自此同心。');   // 正文里得有破身实证，否则被「破处依据闸门」拦下
  ck('两个都丢 ⇒ 自动补成形', stat.known['灵犀同心成形'] === true);
  ck('归属 = 赵无忧', stat.名器归属 && stat.名器归属['灵犀同心'] === '赵无忧');
  ck('同名重复不覆盖（先记的为准）',
    !(stat.破处者['苏瑶'] !== '赵无忧'));
  console.log('');
}

/* ═══ ⑤ 别名归一 ═══ */
{
  const stat = { known: {}, 身份: '赵无忧' };
  await makeRunner(stat).run({ 里程碑: ['孤月元阴被夺'], 破处: [] }, '');
  console.log('【⑤ 别名归一】');
  ck('「孤月元阴被夺」⇒ 归一到「孤月处女丧失」并补成形',
    stat.known['孤月处女丧失'] === true && stat.known['九幽玄阴穴成形'] === true);
  console.log('');
}

/* ═══ ⑥ 归属三身份（跑真 xsdRelicState）═══ */
{
  const panelSrc = readFileSync(PANEL, 'utf8');
  const i = panelSrc.indexOf('function xsdRelicState(rel, known, identity, customOwners) {');
  if (i < 0) throw new Error('面板里找不到 xsdRelicState 的签名（改过签名就要同步本脚本）');
  let depth = 0, end = -1;
  for (let k = panelSrc.indexOf('{', i); k < panelSrc.length; k++) {
    if (panelSrc[k] === '{') depth += 1;
    else if (panelSrc[k] === '}') { depth -= 1; if (depth === 0) { end = k + 1; break; } }
  }
  if (end < 0) throw new Error('xsdRelicState 括号不配对');
  const box = { console };
  vm.createContext(box);
  vm.runInContext([
    "function s0(v) { return String(v === undefined || v === null ? '' : v).trim(); }",
    "const XSD_RELIC_CN = ['', '一', '二', '三', '四'];",
    panelSrc.slice(i, end),
    'globalThis.__f = xsdRelicState;',
  ].join('\n'), box);
  const xsdRelicState = box.__f;
  const rel = { n: '九幽玄阴穴', id: 'jiuyouxuanyinxue', c: '九幽玄阴穴成形', s: '九幽玄阴穴', a: 4, lord: '九皇子', hall: '浊龙殿主' };
  const formed = { 九幽玄阴穴成形: true };

  console.log('【⑥ 归属三身份（真 xsdRelicState）】');
  const a1 = xsdRelicState(rel, formed, '自设 · 顾长生', null);
  ck('自设 ⇒ 归玩家本人', a1.state === 'self' && a1.owner === '自设 · 顾长生', JSON.stringify(a1));
  const a2 = xsdRelicState(rel, formed, '赵无忧', null);
  ck('赵无忧 ⇒ 归赵无忧', a2.state === 'self' && a2.owner === '赵无忧', JSON.stringify(a2));
  const a3 = xsdRelicState(rel, formed, '浊龙殿主 · 九皇子', null);
  ck('浊龙殿主 ⇒ 归九皇子', a3.state === 'self' && a3.owner === '九皇子', JSON.stringify(a3));
  const a4 = xsdRelicState(rel, formed, '赵无忧', { 九幽玄阴穴: '九皇子' });
  ck('破处簿写着九皇子 ⇒ 赵无忧这边显示「已被占据」', a4.state === 'other' && a4.owner === '九皇子' && a4.owned === false, JSON.stringify(a4));
  const a5 = xsdRelicState(rel, formed, '赵无忧', null);
  ck('老存档（没有归属表）⇒ 身份兜底，不崩', a5.state === 'self' && a5.owner === '赵无忧', JSON.stringify(a5));
  const a6 = xsdRelicState(rel, {}, '赵无忧', null);
  ck('没成形 ⇒ 未出世', a6.state === 'none' && a6.arcs === 0, JSON.stringify(a6));
  console.log('');
}

/* ═══ ⑦ 纳戒进出、数量与回退（主人 2026-10-06 报：酒喝了还在物品栏；同日夜按 GPT 复核重做）═══ */
{
  const mk = () => ({
    known: {}, 身份: '赵无忧',
    inventory: [
      { name: '醉春风', desc: '南域佳酿两坛。', full: '南域仙坊颇具盛名的上等灵酿「醉春风」。', count: 2 },
      { name: '随身青锋剑', desc: '入世防身佩剑。', full: '随身淬炼多年的上好青锋剑。' },
    ],
  });
  console.log('【⑦ 纳戒进出、数量与回退】');

  /* 7.1 两坛喝一坛 ⇒ 剩一坛 */
  {
    const stat = mk();
    await makeRunner(stat).run({ 里程碑: [], 破处: [], 纳戒: { 消耗: [{ name: '醉春风', count: 1 }] } }, '他取出一坛醉春风，与师姐分饮。');
    const it = (stat.inventory || []).find((x) => x.name === '醉春风');
    ck('两坛喝一坛 ⇒ 还剩一坛（不是整件消失）', it && it.count === 1, JSON.stringify(stat.inventory));
    ck('没动的那件还在', (stat.inventory || []).some((x) => x.name === '随身青锋剑'));
  }
  /* 7.2 再喝一坛 ⇒ 用尽才移出（**两个不同回合**：账本按楼层记，所以要用不同的楼层号） */
  {
    const stat = mk();
    const r = makeRunner(stat);
    await r.run({ 纳戒: { 消耗: [{ name: '醉春风', count: 1 }] } }, '取出一坛醉春风，一饮而尽。', 11);
    await r.run({ 纳戒: { 消耗: [{ name: '醉春风', count: 1 }] } }, '把剩下那坛醉春风也开了。', 13);
    ck('扣到 0 才移出纳戒', !(stat.inventory || []).some((x) => x.name === '醉春风'), JSON.stringify(stat.inventory));
  }
  /* 7.3 越量扣减 ⇒ 钳到 0，不出现负数 */
  {
    const stat = mk();
    await makeRunner(stat).run({ 纳戒: { 消耗: [{ name: '醉春风', count: 5 }] } }, '他把醉春风一口气全喝了。');
    ck('要扣 5 坛而只有 2 坛 ⇒ 钳到 0、不留负值', !(stat.inventory || []).some((x) => x.name === '醉春风'));
  }
  /* 7.4 名字归一：数词量词与括号不算两件东西 */
  {
    const stat = mk();
    stat.inventory.push({ name: '灵酒', desc: '谷中所采。', full: '谷中所采。', count: 3 });
    await makeRunner(stat).run({ 纳戒: { 消耗: [{ name: '两壶灵酒', count: 1 }] } }, '喝了一壶灵酒。');
    const it = (stat.inventory || []).find((x) => x.name === '灵酒');
    ck('「两壶灵酒」扣到「灵酒」头上（不被当成两件东西）', it && it.count === 2, JSON.stringify(stat.inventory));
  }
  /* 7.5 幂等：同一楼同一栏重跑不再入账 */
  {
    const stat = mk();
    const r = makeRunner(stat);
    const p = { 里程碑: [], 破处: [], 纳戒: { 消耗: [{ name: '醉春风', count: 1 }] } };
    await r.run(p, '他取出一坛醉春风，与师姐分饮。');
    const after1 = JSON.stringify(stat.inventory);
    await r.run(p, '他取出一坛醉春风，与师姐分饮。');
    ck('同一楼重复解析 ⇒ 不重复扣（幂等）', JSON.stringify(stat.inventory) === after1, after1);
  }
  /* 7.6 重生成/编辑：同一楼内容变了 ⇒ 先回滚旧账再施加新账 */
  {
    const stat = mk();
    const r = makeRunner(stat);
    await r.run({ 里程碑: [], 破处: [], 纳戒: { 消耗: [{ name: '醉春风', count: 1 }] } }, '他取出一坛醉春风，与师姐分饮。');
    await r.run({ 里程碑: [], 破处: [], 纳戒: { 消耗: [{ name: '醉春风', count: 2 }] } }, '改口：两坛醉春风都喝了。');
    ck('同一楼改成「两坛都喝」⇒ 回滚旧账后按新账算（已用尽）',
      !(stat.inventory || []).some((x) => x.name === '醉春风'), JSON.stringify(stat.inventory));
  }
  /* 7.7 这一栏被撤掉 ⇒ 该楼账回滚 */
  {
    const stat = mk();
    const r = makeRunner(stat);
    await r.run({ 里程碑: [], 破处: [], 纳戒: { 消耗: [{ name: '醉春风', count: 1 }] } }, '他取出一坛醉春风，与师姐分饮。');
    await r.run({ 里程碑: [], 破处: [], 纳戒: { 消耗: [], 获得: [] } }, '其实没喝那坛醉春风。');
    const it = (stat.inventory || []).find((x) => x.name === '醉春风');
    ck('该楼的 <纳戒> 被撤掉 ⇒ 回滚，酒回到两坛', it && it.count === 2, JSON.stringify(stat.inventory));
  }
  /* 7.8 对账：楼被删 ⇒ 回滚那一楼的账 */
  {
    const stat = mk();
    const r = makeRunner(stat);
    stat.__floors = { 7: '他取出一坛醉春风，与师姐分饮。' };
    await r.run({ 里程碑: [], 破处: [], 纳戒: { 消耗: [{ name: '醉春风', count: 1 }] } }, '他取出一坛醉春风，与师姐分饮。');
    stat.__floors = {};                                   // 那一楼被删掉
    await r.box.__reconcile('测试');
    const it = (stat.inventory || []).find((x) => x.name === '醉春风');
    ck('那一楼被删除 ⇒ 对账回滚（酒回到两坛）', it && it.count === 2, JSON.stringify(stat.inventory));
  }
  /* 7.9 获得写数量 ⇒ 按数量入账 */
  {
    const stat = mk();
    await makeRunner(stat).run({ 纳戒: { 获得: [{ name: '凤血灵芝', desc: '幽寂谷所采。', count: 3 }] } }, '采到三株凤血灵芝，收进囊中。');
    const it = (stat.inventory || []).find((x) => x.name === '凤血灵芝');
    ck('获得写 ×3 ⇒ 入账 3', it && it.count === 3, JSON.stringify(stat.inventory));
  }
  /* 7.10 找不着那一件 ⇒ 只告警，不崩、不乱删 */
  {
    const s2 = mk();
    await makeRunner(s2).run({ 纳戒: { 消耗: [{ name: '不存在的东西', count: 1 }] } }, '');
    ck('要消耗一件没有的东西 ⇒ 只告警，不崩、不乱删', (s2.inventory || []).length === 2);
  }
  /* 7.11 ★ 2026-10-07 主人报的第二种坑：正文完全没提酒，`<纳戒>` 每楼都写「消耗：醉春风×1」⇒ 两坛被抄光。
   *      修法：正文（去掉状态栏）里找不到依据的进出，一律丢弃。 */
  {
    const stat = mk();
    await makeRunner(stat).run(
      { 纳戒: { 消耗: [{ name: '醉春风', count: 1 }] } },
      '她把药碗放下，替他掖了掖被角。\n\n<Status_block>\n<纳戒>消耗：醉春风×1</纳戒>\n</Status_block>',
    );
    const it = (stat.inventory || []).find((x) => x.name === '醉春风');
    ck('正文没提到那件酒 ⇒ 报的「消耗」被判无据、丢弃（两坛仍是两坛）', it && it.count === 2, JSON.stringify(stat.inventory));
  }
  /* 7.12 正文真的写了喝酒 ⇒ 照常生效 */
  {
    const stat = mk();
    await makeRunner(stat).run(
      { 纳戒: { 消耗: [{ name: '醉春风', count: 1 }] } },
      '他从行囊里取出一坛醉春风，与师姐分饮。\n\n<Status_block>\n<纳戒>消耗：醉春风×1</纳戒>\n</Status_block>',
    );
    const it = (stat.inventory || []).find((x) => x.name === '醉春风');
    ck('正文真的写了「取出一坛醉春风」⇒ 照常扣 1（剩一坛）', it && it.count === 1, JSON.stringify(stat.inventory));
  }
  /* 7.13 获得同样要有依据（防「照抄示例」把东西凭空加进来） */
  {
    const stat = mk();
    const r = makeRunner(stat);
    await r.run({ 纳戒: { 获得: [{ name: '凤血灵芝', desc: '幽谷所采。', count: 1 }] } }, '两人在崖边说了几句话，便各自歇下。');
    ck('正文没提到那件东西 ⇒ 报的「获得」也被丢弃', !(stat.inventory || []).some((x) => x.name === '凤血灵芝'), JSON.stringify(stat.inventory));
    await r.run({ 纳戒: { 获得: [{ name: '凤血灵芝', desc: '幽谷所采。', count: 1 }] } }, '崖壁缝里竟生着一株凤血灵芝，他小心采下。');
    ck('正文写了「采到凤血灵芝」⇒ 正常入账', (stat.inventory || []).some((x) => x.name === '凤血灵芝'));
  }
  /* 7.14 ★ 2026-10-07 破处依据闸门：状态栏照抄写法示例（`<破处>孤月、赵无忧</破处>`）不许落地 */
  {
    const mk2 = () => ({ known: {}, 身份: '赵无忧', 破处者: {} });
    const s1 = mk2();
    await makeRunner(s1).run(
      { 破处: [{ 持有者: '孤月', 破处者: '赵无忧' }] },
      '夜色沉沉，他盘膝坐在洞里，把三枚阵旗插进石缝。\n\n<Status_block>\n<破处>孤月、赵无忧</破处>\n</Status_block>',
    );
    ck('正文里没有「孤月」⇒ 报的破处记录被丢弃（照抄示例的典型）', !(s1.破处者 || {})['孤月'], JSON.stringify(s1.破处者));
    ck('连带不成形：九幽玄阴穴仍是 false', s1.known['九幽玄阴穴成形'] !== true);

    const s2 = mk2();
    await makeRunner(s2).run({ 破处: [{ 持有者: '孤月', 破处者: '赵无忧' }] }, '孤月把药碗放下，转身走到门口站住了。');
    ck('正文有「孤月」但没有破身实证 ⇒ 仍然丢弃', !(s2.破处者 || {})['孤月'], JSON.stringify(s2.破处者));

    const s3 = mk2();
    await makeRunner(s3).run({ 破处: [{ 持有者: '孤月', 破处者: '赵无忧' }] }, '那一夜孤月在他怀里失了身，元阴尽付。');
    ck('正文写了「孤月…失了身」⇒ 破处记录照常落地', (s3.破处者 || {})['孤月'] === '赵无忧', JSON.stringify(s3.破处者));
  }
  /* 7.15 ★ 2026-10-07 同类问题普查三条：① 环不再自动进背包；② 直报「X处女丧失」也要实证；③ 派发只派一次 */
  {
    const s1 = { known: { 封元镇灵环: true }, 身份: '赵无忧', inventory: [{ name: '醉春风', desc: '', full: '', count: 2 }] };
    await makeRunner(s1).run({ 里程碑: [], 破处: [], 纳戒: { 消耗: [], 获得: [] } }, '正文里只是替她拢了拢衣襟。');
    ck('锚点「封元镇灵环」为真也不再往纳戒里塞环（她的东西不进他的背包）',
      !(s1.inventory || []).some((x) => x.name === '封元镇灵环'), JSON.stringify((s1.inventory || []).map((x) => x.name)));

    const s2 = { known: {}, 身份: '赵无忧', 破处者: {} };
    await makeRunner(s2).run({ 里程碑: ['孤月处女丧失'] }, '他盘膝坐在洞里，把阵旗插进石缝。');
    ck('直报「孤月处女丧失」但正文无实证 ⇒ 丢弃，不成形',
      s2.known['孤月处女丧失'] !== true && s2.known['九幽玄阴穴成形'] !== true, JSON.stringify(s2.known));

    const s3 = { known: {}, 身份: '赵无忧', 破处者: {} };
    await makeRunner(s3).run({ 里程碑: ['孤月处女丧失'] }, '那一夜孤月在他怀里破了身，九幽玄阴脉自此成形。');
    ck('正文有实证 ⇒ 直报的「孤月处女丧失」照常落地并派生成形',
      s3.known['孤月处女丧失'] === true && s3.known['九幽玄阴穴成形'] === true, JSON.stringify(s3.known));

    const s4 = { known: { 极乐引入手: true }, 身份: '赵无忧', inventory: [] };
    const r4 = makeRunner(s4);
    await r4.run({ 里程碑: [], 破处: [], 纳戒: { 消耗: [], 获得: [] } }, '他把《极乐引》残篇收进怀里。');
    ck('派发一次：《极乐引》残篇进包', (s4.inventory || []).some((x) => x.name === '《极乐引》残篇'));
    await r4.run({ 里程碑: [], 破处: [], 纳戒: { 消耗: [{ name: '《极乐引》残篇', count: 1 }] } }, '他把《极乐引》残篇烧了。');
    ck('用掉之后不会再自己长回来（派发记录生效）', !(s4.inventory || []).some((x) => x.name === '《极乐引》残篇'), JSON.stringify(s4.inventory));
  }
  /* 7.16 ★ 2026-10-07 复核发现：准入／跳段锚点必须有正文实证（false 报一次就能开一整章） */
  {
    const s1 = { known: {}, 身份: '赵无忧' };
    await makeRunner(s1).run({ 里程碑: ['天溪城破'] }, '他在观星台上静坐了一夜，什么也没发生。');
    ck('正文没提城破 ⇒ 报的「天溪城破」被丢弃（不会打开第 12 章）', s1.known['天溪城破'] !== true);

    const s2 = { known: {}, 身份: '赵无忧' };
    await makeRunner(s2).run({ 里程碑: ['天溪城破'] }, '巨猿破城而入，西南城墙轰然塌下，血水漫过街石。');
    ck('正文写了城破 ⇒ 「天溪城破」照常入账', s2.known['天溪城破'] === true);

    const s3 = { known: {}, 身份: '赵无忧' };
    await makeRunner(s3).run({ 里程碑: ['封元镇灵环'] }, '他替她拢了拢衣襟，只说到明日再议。');
    ck('正文没提暴露 ⇒ 报的「封元镇灵环」被丢弃（不会打开第 13 章）', s3.known['封元镇灵环'] !== true);

    const s4 = { known: {}, 身份: '赵无忧' };
    await makeRunner(s4).run({ 里程碑: ['双姝回归'] }, '她的琴声在夜里潜回，两姐妹终于回来了。');
    ck('正文写了回归 ⇒ 「双姝回归」照常入账', s4.known['双姝回归'] === true);
  }
  /* 7.17 ★ 2026-10-07（GPT §7 分支回退）：同一楼内容变了 ⇒ 那一楼置真的锚点被回滚 */
  {
    const stat = { known: {}, 身份: '赵无忧', 破处者: {} };
    const r = makeRunner(stat);
    await r.run({ 里程碑: ['天溪城破'] }, '巨猿破城而入，西南城墙轰然塌下。');
    ck('先报一次：城破锚点入账', stat.known['天溪城破'] === true);
    await r.run({ 里程碑: [] }, '其实那晚什么都没发生，只是刮了一夜风。');
    ck('同一楼改口（改成没有锚点）⇒ 锚点被回滚', stat.known['天溪城破'] !== true, JSON.stringify(stat.known));
  }
  /* 7.18 ★ 2026-10-07 主人令：般若菩提菊 = 楚灵夜处女丧失 **且** 楚灵夜后窍开发（被肛交／走后门） */
  {
    const s1 = { known: { 楚灵夜处女丧失: true }, 身份: '赵无忧', 破处者: { 楚灵夜: '赵无忧' } };
    await makeRunner(s1).run({ 里程碑: [] }, '那一夜楚灵夜破了身，元阴尽付。');
    ck('只破身、没走后门 ⇒ 般若菩提菊不成形', s1.known['般若菩提菊成形'] !== true, JSON.stringify(s1.known));

    const s2 = { known: { 楚灵夜处女丧失: true, 楚灵夜后窍开发: true }, 身份: '赵无忧', 破处者: { 楚灵夜: '赵无忧' } };
    await makeRunner(s2).run({ 里程碑: [] }, '那一夜楚灵夜破了身，后庭菊径也被开发过。');
    ck('破身 ＋ 后窍开发都真 ⇒ 般若菩提菊成形', s2.known['般若菩提菊成形'] === true, JSON.stringify(s2.known));

    const s3 = { known: { 楚灵夜后窍开发: true }, 身份: '赵无忧', 破处者: {} };
    await makeRunner(s3).run({ 里程碑: [] }, '只走了后门，并未破身。');
    ck('只走后门、没破身 ⇒ 仍不成形', s3.known['般若菩提菊成形'] !== true, JSON.stringify(s3.known));
  }
  /* 7.19 ★ 跨回合累加 + 实证：第 10 楼破身、第 30 楼走后门 ⇒ 第 30 楼才成形；
   *       若 30 楼那句「后窍开发」在正文里没有依据 ⇒ 丢弃，仍不成形 */
  {
    const stat = { known: {}, 身份: '赵无忧', 破处者: {} };
    const r = makeRunner(stat);
    await r.run({ 里程碑: ['楚灵夜处女丧失'] }, '那一夜楚灵夜破了身，元阴尽付。', 10);
    ck('第 10 楼：只破身 ⇒ 尚不成形', stat.known['般若菩提菊成形'] !== true);
    await r.run({ 里程碑: ['楚灵夜后窍开发'] }, '他说了几句闲话，天就亮了。', 30);
    ck('第 30 楼：后窍那句在正文里没依据 ⇒ 丢弃，仍不成形', stat.known['般若菩提菊成形'] !== true);
    await r.run({ 里程碑: ['楚灵夜后窍开发'] }, '他把她的后窍开发得透彻，菊径自此门户大开。', 32);
    ck('第 32 楼：正文有实证 ⇒ 两条齐备，般若菩提菊成形', stat.known['般若菩提菊成形'] === true, JSON.stringify(stat.known));
  }
  /* 7.20 ★ 2026-10-07（主人问：纹章激活后一阶段描述会进正文吗）：
   *   成形 ⇒ 自动派发一阶段锚点（阶段条的闸门需要它）；灵犀同心的锚点带「穴」字。 */
  {
    const s1 = { known: {}, 身份: '赵无忧', 破处者: { 般若菩提菊: '赵无忧', 楚灵夜: '赵无忧' } };
    await makeRunner(s1).run({ 里程碑: ['楚灵夜处女丧失', '楚灵夜后窍开发'] }, '那一夜楚灵夜破了身，后窍也被开发过。');
    ck('般若菩提菊成形 ⇒ 自动派发「般若菩提菊一阶段」', s1.known['般若菩提菊成形'] === true && s1.known['般若菩提菊一阶段'] === true, JSON.stringify(s1.known));

    const s2 = { known: {}, 身份: '赵无忧', 破处者: { 灵犀同心: '赵无忧', 苏瑶: '赵无忧', 苏玲: '赵无忧' } };
    await makeRunner(s2).run({ 里程碑: ['苏瑶处女丧失', '苏玲处女丧失'] }, '苏瑶先失了身，这一夜苏玲也失了身。');
    ck('灵犀同心成形 ⇒ 派发的是「灵犀同心穴一阶段」（带穴字）', s2.known['灵犀同心成形'] === true && s2.known['灵犀同心穴一阶段'] === true, JSON.stringify(s2.known));
  }
  console.log('');
}

console.log('--------------------------------------------------------');
console.log(`【名器成形闸门自测】${pass} 项通过，${fails.length} 项失败`);
if (fails.length) {
  console.log('失败项：\n  ' + fails.join('\n  '));
  process.exit(1);
}
console.log('✅ 全通过（误报拦得住、真破身放得行、双姝用且、归属按破处者）');
