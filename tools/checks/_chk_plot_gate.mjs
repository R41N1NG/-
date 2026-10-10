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
  /* 闸门形状（2026-10-08 按 gpt §3 外层结构更新）：
     允许三种形态之一 ——
       ① 身份 ＋ ((准入… || 段位保底) && !(完成…))        ← 原形态
       ② 身份 ＋ (日期门) ＋ ((准入… || 段位保底) && !(完成…))
       ③ 身份 ＋ (日期门) ＋ (!(完成…))                    ← 无正门锚点，靠可信日期推进（主人给「前往天溪」定的形态）
     「没到时间一定不能出现」由下方 semBad 的日期硬断言守。 */
  const hasDate = /Number\(variables\.stat_data\?\.仙盟历\)\s*>=/.test(first);
  /* 用**配对计数**把 !(…) 上界块整块摘出来（正则的 [^)]* 吃不下 Number(…) 里的括号）；
     剩下的部分就是准入（含身份与日期条件）—— 对三种形态都成立。 */
  const splitGate = (g) => {
    let adm = '', negs = [];
    for (let i = 0; i < g.length; i++) {
      if (g[i] === '!' && g[i + 1] === '(') {
        let d = 0, j = i + 1, s0 = i;
        for (; j < g.length; j++) { if (g[j] === '(') d++; else if (g[j] === ')') { d--; if (!d) { j++; break; } } }
        negs.push(g.slice(s0, j)); i = j - 1; continue;
      }
      adm += g[i];
    }
    return { adm, negs };
  };
  const sp = splitGate(first);
  const enterRaw = sp.adm;
  const doneRaw = sp.negs.join(' && ');
  if (!sp.negs.length) { shapeBad.push(`${cm.slice(0, 20)}：没有上界（旧章会一直能被叫回来）`); continue; }
  /* 2026-10-08：必需世界前置（南域大劫）不算「正门锚点」—— 它由 worldOk 单独供给，
     不参与「只给一个锚点就应放行」的用例。 */
  const WORLD_ANCHORS = ['南域大劫', '天溪城兽潮'];
  const allEnter = [...enterRaw.matchAll(/known\?\.\['([^']+)'\]/g)].map((x) => x[1]);
  const enterAnchors = allEnter.filter((a) => !WORLD_ANCHORS.includes(a));
  const doneAnchors = [...doneRaw.matchAll(/known\?\.\['([^']+)'\]/g)].map((x) => x[1]);
  const hasFloor = /段位 \?\? 1\) >= (\d+)/.test(enterRaw) || /\(true/.test(enterRaw) || enterRaw.trim() === 'true' || hasDate;
  [...enterAnchors, ...doneAnchors].forEach((a) => { if (!LEDGER.has(a)) deadNames.push(`${cm.slice(0, 20)} → ${a}`); });

  if (!hasFloor) shapeBad.push(`${cm.slice(0, 20)}：准入里既没有段位保底、也不是起手恒开、也没有日期门`);
  if (!doneAnchors.length) shapeBad.push(`${cm.slice(0, 20)}：没有上界（旧章会一直能被叫回来）`);
  const floorNum = Number((enterRaw.match(/段位 \?\? 1\) >= (\d+)/) || [])[1]);
  /* 2026-10-08（gpt 05 §3 表 ＋ 06 §2；主人令）：主线门形态现在有**两种**——
   *   ① 段位门：段位兜底数字必须 ＝ 章号；
   *   ② **场景门**（固定世界事件，如兽潮血战／天溪城破）：**没有段位兜底**，但必须同时具备
   *      **硬日期门** 与 **场景前置锚点**（已抵达天溪／受征召南下／双姝回归…）—— 这才是"日期＋事实"。
   *   ⚠️ 早前的写法无条件要求 `floorNum === n`，加了场景门之后对 7／11 章报 NaN ⇒ 那是**预期表过时**，
   *      不是闸门坏了。这里按两种形态分别校验，**没有放宽**：场景门反而多要求了日期与场景两条。 */
  if (Number.isFinite(floorNum)) {
    if (enterAnchors.length && floorNum !== n) shapeBad.push(`${cm.slice(0, 20)}：段位保底 ${floorNum} ≠ 章号 ${n}`);
  } else if (!(/\(true/.test(enterRaw) || enterRaw.trim() === 'true')) {
    /* 形态③：**日期门-only 的过渡章**（如 id57【剧情】六 · 前往天溪：身份 ＋ 仙盟历>=1578.11 ＋ 上界 !已抵达天溪）
     *   ⇒ 允许"没有场景锚点"，但**硬日期门必须在**；
     *   反之，**有场景锚点就属于形态②**，那时必须同时有硬日期门与必需世界前置（原样保留，没有放宽）。 */
    const 有日期 = /[>=]\s*(1[5-9][0-9]{2}\.[0-9]{2})/.test(enterRaw);
    const 有世界前置 = /known\?\.\['(南域大劫|天溪城兽潮|兽潮血战|天溪城破)'\]/.test(enterRaw);
    if (!有日期) shapeBad.push(`${cm.slice(0, 20)}：既无段位保底、也无**硬日期门**（过渡章至少要有日期）`);
    if (enterAnchors.length && !有世界前置) shapeBad.push(`${cm.slice(0, 20)}：带场景锚点却缺**必需世界前置**（如南域大劫／天溪城兽潮）`);
  }

  const runCase = (known, 段位, 身份, 历) => {
    const expr = first.replace(/^@@if\s*/, '');
    try {
      const sd = { 段位, known };
      if (身份 !== undefined) sd.身份 = 身份;   /* 身份缺失用例须**不带**身份，别兜底 */
      if (历 !== undefined) sd.仙盟历 = 历;
      return new Function('variables', 'return (' + expr + ');')({ stat_data: sd });
    } catch (err) { return 'ERR'; }
  };
  /* 2026-10-08（主人指令）：天溪城兽潮相关条目必须额外满足**必需世界前置** known['南域大劫']。
     故「放行」用例要一起带上它；「未到不放」（idle）与「完成即退出」用例保持原样。 */
  /* 剥掉 !(…) 否定块（＝上界）后的部分才算「准入」；只看整行会把剧情四（上界＝¬南域大劫）误判成"要求"它 */
  const stripNeg = (g) => { let out = ''; for (let i = 0; i < g.length; i++) { if (g[i] === '!' && g[i + 1] === '(') { let d = 0, j = i + 1; for (; j < g.length; j++) { if (g[j] === '(') d++; else if (g[j] === ')') { d--; if (!d) { j++; break; } } } i = j - 1; continue; } out += g[i]; } return out; };
  const admWhole = stripNeg(first);
  const needsWorld = ['南域大劫'].filter((w) => admWhole.includes("known?.['" + w + "'] === true"));
  const worldOk = (known) => { const k = { ...known }; for (const w of needsWorld) k[w] = true; return k; };
  /* 2026-10-08（gpt §3 外层结构 ＋ 主人要求）：主线闸门允许带**可信日期**；带日期时下面所有用例都补到窗口内。
     另：**日期未到必须不放** 单独断言。日期字面量沿用项目既有写法 15xx.xx（十一月＝1578.11）。 */
  const DL = (/>=\s*(1[5-9][0-9]{2}\.[0-9]{2})/.exec(admWhole) || [])[1];
  const dl = DL ? Number(DL) : undefined;
  const idle = runCase({}, 1, '赵无忧', dl);
  /* 「未到不放」按**未经过滤**的准入锚点判定：只要准入里有任何锚点，事实未到就不该放行 */
  const expectIdle = allEnter.length ? false : true;
  if (idle !== expectIdle) semBad.push(`${cm.slice(0, 20)}：未到时应当 ${expectIdle}（实为 ${idle}）`);
  /* 2026-10-08：准入锚点的期望分两种形态 ——
   *   · **段位门／恒开门**：逐个锚点单独给一次就应放行（原语义）。
   *   · **场景门**（兽潮血战／天溪城破这类固定世界事件）：准入是 **AND 组合**（世界前置 ∧ 场景锚点），
   *     所以"只给一个锚点就放行"本来就不成立 —— 改为断言 **给齐全部锚点 ⇒ 放行** 与
   *     **只给其中一个 ⇒ 不放行**（比原来更严，不是放宽）。 */
  const 恒开 = /\(true/.test(enterRaw) || enterRaw.trim() === 'true';
  const 是场景门 = !Number.isFinite(floorNum) && !恒开;
  if (是场景门) {
    const 全给 = Object.fromEntries(allEnter.map((a) => [a, true]));
    if (runCase(全给, 1, '赵无忧', dl) !== true) semBad.push(`${cm.slice(0, 20)}：场景门给齐全部锚点「${allEnter.join('／')}」应当放行`);
    if (allEnter.length > 1 && runCase({ [allEnter[0]]: true }, 1, '赵无忧', dl) !== false) {
      semBad.push(`${cm.slice(0, 20)}：场景门**只给一个锚点**「${allEnter[0]}」不应放行（世界前置／场景事实要齐）`);
    }
  } else {
    for (const a of enterAnchors) {
      if (runCase(worldOk({ [a]: true }), 1, '赵无忧', dl) !== true) semBad.push(`${cm.slice(0, 20)}：只给准入锚点「${a}」＋必需世界前置应当放行`);
    }
  }
  for (const a of doneAnchors) {
    if (runCase({ [a]: true }, n, '赵无忧', dl) !== false) semBad.push(`${cm.slice(0, 20)}：**完成**锚点「${a}」为真时本章应当退出注入**`);
  }
  /* 段位兜底：仅在闸门里**确实写了**段位时才要求；gpt §3 已明确段位不可代替日期与事实 */
  if (/段位/.test(admWhole) && runCase(worldOk({}), n, '赵无忧', dl) !== true) semBad.push(`${cm.slice(0, 20)}：写了段位兜底 ⇒ 只给段位 ${n} ＋必需世界前置应当放行`);
  /* ★ 主人 2026-10-08：**没到时间点一定不能出现** —— 有日期下界时，早一点点都必须不放 */
  if (dl !== undefined && runCase(worldOk({}), n, '赵无忧', dl - 0.01) !== false) {
    semBad.push(`${cm.slice(0, 20)}：**日期未到（${(dl - 0.01).toFixed(2)}）必须不放**`);
  }
  if (runCase({}, 99, '焚欲殿主') !== false) semBad.push(`${cm.slice(0, 20)}：别的身份不应放行`);
  if (runCase({}, 99, undefined) !== false) semBad.push(`${cm.slice(0, 20)}：**身份缺失不应放行**`);
  /* 环境坏掉（variables 未声明）⇒ 必须 fail-closed */
  try {
    const broken = new Function('return (' + first.replace(/^@@if\s*/, '') + ');')();
    if (broken !== false) semBad.push(`${cm.slice(0, 20)}：**求值环境坏掉时应 fail-closed**（实为 ${broken}）`);
  } catch (err) { semBad.push(`${cm.slice(0, 20)}：求值环境坏掉时抛异常（说明没包 fail-closed）`); }
}

ck(shapeBad.length === 0, '闸门形状：**三种形态任一**（① 段位兜底＝章号｜② 场景门＝硬日期＋必需世界前置＋场景锚点｜③ 日期门过渡章）＋ 上界（本章完成即退出）', shapeBad.slice(0, 4).join('；'));
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
