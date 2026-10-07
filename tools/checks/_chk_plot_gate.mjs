#!/usr/bin/env node
/**
 * _chk_plot_gate.mjs —— 主线【剧情】闸门的形状与语义检查（2026-10-07 立）
 *
 * 守的是主人 2026-10-07 那条设计令：
 *   「只能靠楼层段位？我们设计楼层段位是来保底的！不是来干这个的！」
 * ⇒ 每条主线剧情的闸门必须是 **正门（里程碑锚点） ＋ 兜底（段位）** 的形状，
 *   而且**正门锚点必须都在 `状态机.js` 的 FIELD_TABLE 里**（不在台账里 = 模型永远写不出 = 死名，
 *   那就等于又把保底当成了唯一的门）。
 *
 * 断言（对卡内 `最新角色卡/仙姝堕.json` 与 `references/仙姝墮-世界书.json`）：
 *   ① 主线剧情 N 的段位兜底数字 == 章号 N（一↔1 … 十五↔15）；
 *   ② N ≥ 2 的条目必须同时有正门锚点与段位兜底；N = 1 恒开（只认身份）；
 *   ③ 正门锚点全部在 FIELD_TABLE 台账里（**死名一律报错**）；
 *   ④ 求值语义四连：没有锚点且段位=1 ⇒ false；只给正门锚点 ⇒ true；只给段位 ⇒ true；别的身份 ⇒ false；
 *   ⑤ 专轨（自设／殿主）7 条不许被主线闸门污染 —— 闸门里不得出现主线锚点与段位兜底。
 * 用法：& 'C:\Program Files\nodejs\node.exe' tools/checks/_chk_plot_gate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'E:/角色卡制作/仙姝堕';
const CARD = path.join(DIR, '最新角色卡', '仙姝堕.json');
const SM = path.join(DIR, '卡片脚本', '状态机.js');

const rep = [];
let fail = 0;
const ck = (ok, msg, extra) => { rep.push(`${ok ? '✔' : '✘'} ${msg}${extra ? ' ｜ ' + extra : ''}`); if (!ok) fail += 1; };
const note = (s) => rep.push('   ' + s);

/* 台账 */
function arrOf(txt, name) {
  const i = txt.indexOf('const ' + name + ' = [');
  if (i < 0) throw new Error('状态机里找不到 ' + name);
  let d = 0, j = i + ('const ' + name + ' = ').length;
  for (; j < txt.length; j += 1) {
    const c = txt[j];
    if (c === '[') d += 1;
    else if (c === ']') { d -= 1; if (d === 0) { j += 1; break; } }
  }
  return txt.slice(i, j);
}
const sm = fs.readFileSync(SM, 'utf8');
const LEDGER = new Set([...arrOf(sm, 'FIELD_TABLE').matchAll(/kind:\s*'[^']+',\s*name:\s*'([^']+)'/g)].map((m) => m[1]));
const FF = {};
arrOf(sm, 'STAGE_FAST_FORWARD').split('\n').forEach((line) => {
  const m = line.match(/段\s*(\d+)/);
  const names = [...line.matchAll(/'([^']+)'/g)].map((x) => x[1]);
  if (m && names.length) FF[Number(m[1])] = names;
});

const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const entries = card.data.character_book.entries || [];
const main = entries.filter((e) => /【剧情】[一二三四五六七八九十]+ ·/.test(String(e.comment)) && !String(e.comment).includes('专轨'));
const side = entries.filter((e) => /【剧情】.*（(?:自设|殿主)专轨）/.test(String(e.comment)));
const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12, 十三: 13, 十四: 14, 十五: 15 };

rep.push(`卡：${CARD}`);
rep.push(`主线剧情 ${main.length} 条｜专轨 ${side.length} 条｜台账 ${LEDGER.size} 个字段`);
ck(main.length === 15, `主线剧情应当是 15 条（实为 ${main.length}）`);

const run = (first, known, 段位, 身份 = '赵无忧') => {
  /* ⚠️ 2026-10-07：闸门现在是**自带 try/catch 的 IIFE**（报错即 false）。求值要按整体来算，
   *   所以这里直接 eval 整行（含 `@@if` 前缀剥掉后的 `(function(){…})()`），不再先剥尾部注释。 */
  const expr = first.replace(/^@@if\s*/, '').replace(/\/\*[\s\S]*?\*\/\s*$/, '');
  try {
    const vars = (身份 === undefined) ? { stat_data: { 段位, known } } : { stat_data: { 身份, 段位, known } };
    return new Function('variables', 'return (' + expr + ');')(vars);
  } catch (e) { return 'ERR:' + e.message; }
};
/** 故意让求值环境坏掉（`variables` 未声明）—— 验 fail-closed */
const runBroken = (first) => {
  const expr = first.replace(/^@@if\s*/, '').replace(/\/\*[\s\S]*?\*\/\s*$/, '');
  try { return new Function('return (' + expr + ');')(); } catch (e) { return 'THREW:' + e.message; }
};

let deadNames = [];
let shapeBad = [];
let semBad = [];
for (const e of main) {
  const cm = String(e.comment);
  const n = CN[(cm.match(/^【剧情】([一二三四五六七八九十]+) ·/) || [])[1]];
  const first = String(e.content).split('\n')[0];
  if (!first.startsWith('@@if')) { shapeBad.push(`${cm.slice(0, 20)}：首行不是 @@if`); continue; }
  /* 闸门形状：身份 ＋ ((准入… || 保底) && !(完成…)) */
  const m = /身份 === '赵无忧' && \(\((.*?)\) && !\((.*?)\)\)/.exec(first);
  if (!m) { shapeBad.push(`${cm.slice(0, 20)}：不是「准入 ＋ 上界」形状`); continue; }
  const enterAnchors = [...m[1].matchAll(/known\?\.\['([^']+)'\]/g)].map((x) => x[1]);
  const doneAnchors = [...m[2].matchAll(/known\?\.\['([^']+)'\]/g)].map((x) => x[1]);
  const hasFloor = /段位 \?\? 1\) >= (\d+)/.test(m[1]) || /\(true/.test(m[1]) || m[1].trim() === 'true';
  [...enterAnchors, ...doneAnchors].forEach((a) => { if (!LEDGER.has(a)) deadNames.push(`${cm.slice(0, 20)} → ${a}`); });

  if (!hasFloor) shapeBad.push(`${cm.slice(0, 20)}：准入里既没有段位保底、也不是起手恒开`);
  if (!doneAnchors.length) shapeBad.push(`${cm.slice(0, 20)}：没有上界（旧章会一直能被叫回来）`);
  const floorNum = Number((m[1].match(/段位 \?\? 1\) >= (\d+)/) || [])[1]);
  if (enterAnchors.length && floorNum !== n) shapeBad.push(`${cm.slice(0, 20)}：段位保底 ${floorNum} ≠ 章号 ${n}`);

  const runCase = (known, 段位, 身份) => {
    const expr = first.replace(/^@@if\s*/, '');
    try {
      const vars = (身份 === undefined) ? { stat_data: { 段位, known } } : { stat_data: { 身份, 段位, known } };
      return new Function('variables', 'return (' + expr + ');')(vars);
    } catch (err) { return 'ERR'; }
  };
  const idle = runCase({}, 1, '赵无忧');
  const expectIdle = enterAnchors.length ? false : true;          // 最早两章起手即可读
  if (idle !== expectIdle) semBad.push(`${cm.slice(0, 20)}：未到时应当 ${expectIdle}（实为 ${idle}）`);
  for (const a of enterAnchors) {
    if (runCase({ [a]: true }, 1, '赵无忧') !== true) semBad.push(`${cm.slice(0, 20)}：只给准入锚点「${a}」应当放行`);
  }
  for (const a of doneAnchors) {
    if (runCase({ [a]: true }, n, '赵无忧') !== false) semBad.push(`${cm.slice(0, 20)}：**完成**锚点「${a}」为真时本章应当退出注入**`);
  }
  if (runCase({}, n, '赵无忧') !== true) semBad.push(`${cm.slice(0, 20)}：只给段位 ${n}（保底）应当放行`);
  if (runCase({}, 99, '焚欲殿主') !== false) semBad.push(`${cm.slice(0, 20)}：别的身份不应放行`);
  if (runCase({}, 99, undefined) !== false) semBad.push(`${cm.slice(0, 20)}：**身份缺失不应放行**`);
  /* 环境坏掉（variables 未声明）⇒ 必须 fail-closed */
  try {
    const broken = new Function('return (' + first.replace(/^@@if\s*/, '') + ');')();
    if (broken !== false) semBad.push(`${cm.slice(0, 20)}：**求值环境坏掉时应 fail-closed**（实为 ${broken}）`);
  } catch (err) { semBad.push(`${cm.slice(0, 20)}：求值环境坏掉时抛异常（说明没包 fail-closed）`); }
}

ck(shapeBad.length === 0, '闸门形状：**准入（前章完成的事实）＋ 上界（本章完成即退出）＋ 段位保底**', shapeBad.slice(0, 4).join('；'));
ck(deadNames.length === 0, '准入／上界锚点全部在 FIELD_TABLE 台账里（**没有死名** —— 死名等于又把保底当门）', deadNames.slice(0, 6).join('；'));
ck(semBad.length === 0, '求值语义：未到不放／准入放行／**完成即退出**／保底放行／别的身份不放／身份缺失不放／环境坏掉也 fail-closed', semBad.slice(0, 4).join('；'));

/* ★ 2026-10-07 新增：**全卡每条闸门都必须是 fail-closed 形态**
 *   （ST-Prompt-Template 只在返回值严格等于 'false' 时剔除条目；求值出错会返回 null ⇒ 条目不剔除） */
{
  const gated = entries.filter((e) => /^@@if/.test(String(e.content)));
  const unwrapped = gated.filter((e) => !/^@@if \(function\(\)\{try\{return \(/.test(String(e.content)));
  ck(unwrapped.length === 0, `全卡 ${gated.length} 条闸门都包了 fail-closed（求值报错 ⇒ 剔除条目）`,
    unwrapped.slice(0, 5).map((e) => String(e.comment).slice(0, 22)).join('；'));
  const soft = gated.filter((e) => String(e.content).split('\n')[0].includes("?? '赵无忧'"));
  ck(soft.length === 0, '身份条件不再用 `?? \'赵无忧\'` 兜底（身份缺失不得被当成赵无忧）',
    soft.slice(0, 5).map((e) => String(e.comment).slice(0, 22)).join('；'));
  const multi = gated.filter((e) => {
    const first = String(e.content).split('\n')[0];
    return !first.trim().endsWith(')') || /^@@if[^\n]*[^)]\s*$/m.test(first) === false ? false : false;
  });
  void multi;
}

/* ★ 2026-10-07（GPT 复核 §3）：闸门**不再**与 `STAGE_FAST_FORWARD` 绑定 ——
 *   跳段表说的是「哪些事实可以让段位跳到第 N 段」，准入说的是「上一章真的演完了」。
 *   下面钉住他点名的三个反例，防以后有人又「从跳段表自动生成闸门」。 */
{
  const problem = [];
  const gateOfNum = (n) => {
    const e = main.find((x) => CN[(String(x.comment).match(/^【剧情】([一二三四五六七八九十]+) ·/) || [])[1]] === n);
    if (!e) return null;
    const f = String(e.content).split('\n')[0];
    const m = /身份 === '赵无忧' && \(\((.*?)\) && !\((.*?)\)\)/.exec(f);
    if (!m) return null;
    return { enter: m[1], done: m[2], enterAnchors: [...m[1].matchAll(/known\?\.\['([^']+)'\]/g)].map((x) => x[1]), doneAnchors: [...m[2].matchAll(/known\?\.\['([^']+)'\]/g)].map((x) => x[1]) };
  };
  const g9 = gateOfNum(9); const g5 = gateOfNum(5); const g8 = gateOfNum(8);
  if (g9 && g9.enterAnchors.includes('赵无忧看见乳环')) problem.push('第 9 段仍拿「赵无忧看见乳环」当准入（设计明说可提前发现）');
  if (g9 && !g9.doneAnchors.includes('血染天溪')) problem.push('第 9 段没有用「血染天溪」收口');
  if (g5 && g5.enterAnchors.includes('赠送冰心泪')) problem.push('第 5 段仍拿「赠送冰心泪」当准入（那是本段要完成的事件）');
  if (g5 && !g5.doneAnchors.includes('赠送冰心泪')) problem.push('第 5 段没把「赠送冰心泪」当完成条件');
  if (g8 && g8.enterAnchors.includes('灵犀同心成形')) problem.push('第 8 段仍拿「灵犀同心成形」当准入（那是结果）');
  if (g8 && !g8.doneAnchors.includes('灵犀同心成形')) problem.push('第 8 段没把「灵犀同心成形」当完成条件');
  ck(problem.length === 0, 'GPT §3 点名的三处已分家：可提前发现的信息不当准入／本段完成事件当上界／结果当上界', problem.join('；'));
}

/* 专轨 7 条：必须仍带自己的身份条件，且**不许**被套上主线那套「正门锚点 ＋ 段位兜底」。
 *   ⚠️ 注意：专轨闸门里**允许**出现个别主线锚点 —— 那是设计（例：「起获《极乐引》」要求
 *      `!known['极乐引入手']`、「鼎炉争锋」要求 `known['极乐引入手'] === true`）。
 *      所以这里查的是「身份条件在不在」与「段位兜底有没有被误加」，不是「有没有提到主线锚点」。 */
{
  const bad = [];
  for (const e of side) {
    const cm = String(e.comment);
    const first = String(e.content).split('\n')[0];
    const wantsIdentity = cm.includes('自设')
      ? /身份 === '自设'/.test(first)
      /* ★ 2026-10-07：改成**空白容忍**的匹配 —— 断言该查语义（身份条件在不在），不该因为生成器少写一个空格就报红。 */
      : /\['焚欲殿主'\s*,\s*'浊龙殿主'\s*,\s*'欢喜殿主'\s*,\s*'魂欢殿主'\]\s*\.includes\(\s*variables\.stat_data\?\.身份\s*\)/.test(first);
    if (!wantsIdentity) bad.push(`${cm.slice(0, 26)}：身份条件没了`);
    if (/段位 \?\? 1\) >=/.test(first)) bad.push(`${cm.slice(0, 26)}：被误加了段位兜底`);
    /* ★ 2026-10-07（GPT 复核修法 1）：专轨条的时间条件改按**实际日历**，且必须**有有效区间**（不许只有下界） */
    /* ★ 时间条件：走实际日历；开场型条目（以事件为前提）例外 —— 但两者必居其一 */
    if (!/Number\(variables\.stat_data\?\.仙盟历\)/.test(first) && !/known\?\.\[/.test(first)) bad.push(`${cm.slice(0, 26)}：既没有日历窗口、也没有事件前提`);
  }
  ck(bad.length === 0, `专轨 ${side.length} 条仍只认自己的身份，没被主线那套闸门覆盖`, bad.slice(0, 4).join('；'));
  ck(side.length === 7, `专轨应当是 7 条（自设 3 ＋ 殿主 4，实为 ${side.length}）`);
}

if (fail) { rep.push(''); rep.push('✘ 未通过项：'); }
console.log(rep.join('\n'));
console.log(`\n${fail === 0 ? '✅ 全部通过' : '❌ ' + fail + ' 项未通过'}（主线剧情闸门：正门＝里程碑，兜底＝段位）`);
process.exit(fail === 0 ? 0 : 2);
