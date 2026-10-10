/**
 * _chk_ejs_stage.mjs —— ⚠️ **2026-10-08 起由 `_chk_stage_drive.mjs` 取代**（本文件保留作历史对照，已从流水线摘除）。
 *
 * 取代原因（gpt 17 号 §4/§5-3）：
 *   ① 本门禁读的是 `src/text_data/_stage_drive.txt` **源模板**、自带一套自造最小 EJS —— 测的不是卡内注入件；
 *      新门禁改读**实际卡内 content**，并另做「源模板 ↔ 卡内 content」SHA 对照（唯一允许差异：行首 · → -）。
 *   ② 本门禁的期望是从被测表达式形状推出来的；gpt 要求「用**独立事件政策表**给必测负例」——
 *      新门禁把 12 条期望写死在门禁里，不看表达式里有没有日期。
 *   ③ 旧模板的四段结构（`## 阶段一…四` ＋ `XSD_STAGE`）已被 2026-10-08 的「世界轴＋个人舞台」重写取代。
 *
 * 以下原说明仅供追溯：
 * _chk_ejs_stage.mjs —— 验收「【阶段驱动】当前阶段压力与调度」的 EJS 时间轴门控
 * ============================================================================
 * 验的事（对应用户下的五条）：
 *   ① 条目在册、`constant:true`
 *   ② 含 4 个阶段块，且**每一块都被 EJS 条件包住**
 *   ③ 模拟不同变量组合，证明「渲染期只输出当前那一段」
 *   ④ 兜底路径：判据变量取不到／求值抛错 ⇒ 输出**安全占位**，而不是四段全文
 *   ⑤ 统计各段字数与常驻预算增量
 * 另加两项自查（本卡纪律，防新条目踩旧检查）：
 *   ⑥ 禁用词表与剧透词表（对齐 `_final_check_card.js` 的两张表）
 *   ⑦ 13 个锚点字段名逐字对齐 `卡片脚本\状态机.js` 的 ALL_FIELDS，且都真参与判据
 *
 * 求值方式：**自己实现最小 EJS 语义**（模板 → `__out.push(...)` 流 → `new Function`），
 *   与 ST-Prompt-Template 的 EJS 行为一致；离线可跑，不装 ejs 包、不联网、不跑构建、不碰酒馆。
 *
 * 用法：& 'C:\Program Files\nodejs\node.exe' E:\角色卡制作\仙姝堕\_chk_ejs_stage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'E:/角色卡制作/仙姝堕';
const BUILD = path.join(DIR, '_build_card.js');
/* ⚠️ 2026-10-06 修路径：本检查原先只认根目录的 `_stage_drive.txt`，可那个文件在
 *   `src/text_data/` 下（构建脚本 `_build_card.js` 的 `resolveFile()` 会依次找
 *   根目录 → src/text_data → src/assets_data → src/card_build → references）。
 *   2026-10-06 把【阶段驱动】条目从 `src/card_build/_build_card.js` 迁进生产件之后，
 *   这条检查就因找不到文件而红 ⇒ 这里按构建脚本同一套顺序找，找到哪个用哪个。 */
const SRC = [
  path.join(DIR, '_stage_drive.txt'),
  path.join(DIR, 'src', 'text_data', '_stage_drive.txt'),
  path.join(DIR, 'src', 'card_build', '_stage_drive.txt'),
  path.join(DIR, 'references', '_stage_drive.txt'),
].find((p) => fs.existsSync(p)) || path.join(DIR, '_stage_drive.txt');
const CARD = path.join(DIR, '仙姝墮-角色卡（全书群像）.json');
const SM = path.join(DIR, '卡片脚本', '状态机.js');
const RATIO = 1.13;                       // 中文 cl100k 经验值（沿用 _measure_budget.mjs）
const tok = (s) => Math.round((typeof s === 'number' ? s : String(s).length) * RATIO);

const rep = [];
let fail = 0;
const ck = (ok, msg, extra) => { rep.push(`${ok ? '✔' : '✘'} ${msg}${extra ? ' ｜ ' + extra : ''}`); if (!ok) fail++; };
const note = (s) => rep.push('   ' + s);
const sec = (t) => rep.push(`\n── ${t} ${'─'.repeat(Math.max(0, 58 - t.length))}`);

/* ═══════════ 最小 EJS 求值器 ═══════════ */
/** 编译成 (variables) => string。语义对齐 EJS：
 *  文本 → __out.push(...)；`<% code %>` 原样内联；`<%= expr %>` / `<%- expr %>` → push；
 *  `<%_` 吃掉标签前空白，`_%>` 吃掉标签后空白。 */
function compileEJS(tplText) {
  const re = /<%([_\-=]?)([\s\S]*?)([_\-]?)%>/g;
  let src = 'var __out = [];\n';
  let last = 0, m, slurp = false;
  const push = (s) => { if (s) src += '__out.push(' + JSON.stringify(s) + ');\n'; };
  while ((m = re.exec(tplText))) {
    let text = tplText.slice(last, m.index);
    const open = m[1], body = m[2], close = m[3];
    if (slurp) text = text.replace(/^[ \t]*\r?\n?/, '');
    if (open === '_') text = text.replace(/[ \t]*$/, '');
    push(text);
    if (open === '=' || open === '-') src += '__out.push(String(' + body + '));\n';
    else src += body + '\n';
    slurp = close === '_';
    last = re.lastIndex;
  }
  push(tplText.slice(last));
  src += 'return __out.join("");';
  // eslint-disable-next-line no-new-func
  return new Function('variables', src);
}

/* ═══════════ ① 条目在册 ═══════════ */
sec('① 条目在册');
const COMMENT = '【阶段驱动】当前阶段压力与调度';
const build = fs.readFileSync(BUILD, 'utf8');
const at = build.indexOf(`comment: '${COMMENT}'`);
ck(at >= 0, `_build_card.js 的 RULES 里有「${COMMENT}」`);
if (at < 0) { console.log(rep.join('\n')); process.exit(2); }
const objEnd = build.indexOf('\n  },', at);
const objText = build.slice(at, objEnd < 0 ? at + 800 : objEnd);
ck(/constant:\s*true/.test(objText), '`constant: true`（常驻条）', (objText.match(/constant:\s*\w+/) || [])[0]);
ck(/content:\s*readText\('_stage_drive\.txt'\)/.test(objText), '正文由 `_stage_drive.txt` 读入', (objText.match(/content:[^\n]*/) || [])[0].trim());
ck(!/enabled:\s*false/.test(objText), '没有被显式停用（RULES 循环里 enabled 默认 true）');
const orderM = objText.match(/order:\s*(\d+)/);
ck(!!orderM, `order 已指定（${orderM ? orderM[1] : '—'}）—— RULES 循环按它把本条目排进静态基底`);

/* ═══════════ ② 阶段块 & EJS 包裹 ═══════════ */
sec('② 阶段块 & EJS 包裹');
const tpl = fs.readFileSync(SRC, 'utf8');
const render = compileEJS(tpl);
/* ⚠️ 2026-10-01 修：条目早已改成 YAML 体例（`## 阶段一 · …`），旧判据只认 `【阶段一 · ` ⇒ 实测 0 块、误报。
 *   现同时兼容两种写法（历史遗档 `【…】` 与新体例 `## …`）。 */
const MARK_RE = /(?:^##\s*|【)阶段([一二三四])\s*·/gm;
const marks = [...tpl.matchAll(MARK_RE)];
ck(marks.length === 4, `含 4 个阶段块（实测 ${marks.length} 个：${marks.map((m) => m[1]).join('、') || '—'}）`);

// 每块：向前找最近的分支开标签，必须 (a) 存在 (b) 编号与本块一致 (c) 中间没有任何别的 EJS 标签
{
  const OPEN_RE = /<%\s*\}?\s*(?:if|else if)\s*\(XSD_STAGE\s*===\s*([1-4])\s*\)\s*\{\s*%>/g;
  const openers = [];
  let m;
  while ((m = OPEN_RE.exec(tpl))) openers.push({ n: Number(m[1]), start: m.index, end: m.index + m[0].length });
  ck(openers.length === 4, `有 4 条 XSD_STAGE 分支开标签（实测 ${openers.length}：${openers.map((o) => o.n).join('、') || '—'}）`);
  ck(JSON.stringify(openers.map((o) => o.n)) === '[1,2,3,4]', '分支按 1→2→3→4 顺序出现，无缺号、无重号');

  const CN = { 一: 1, 二: 2, 三: 3, 四: 4 };
  let ok = true;
  const detail = [];
  marks.forEach((mk, i) => {
    const want = CN[mk[1]];
    const prev = [...openers].filter((o) => o.end <= mk.index).pop();
    const between = prev ? tpl.slice(prev.end, mk.index) : null;
    const good = !!prev && prev.n === want && between !== null && !/<%/.test(between);
    if (!good) ok = false;
    detail.push(`段${want}:${good ? '已包住' : '未包住'}`);
  });
  ck(ok, '每个阶段块都**紧跟**在编号相符的 EJS 分支之后（中间没有别的输出）', detail.join(' '));

  // 反向：每条分支体内必须真的有且只有一个阶段标题
  let ok2 = true;
  openers.forEach((o, i) => {
    const bodyEnd = i + 1 < openers.length ? openers[i + 1].start : tpl.lastIndexOf('<%');
    const body = tpl.slice(o.end, bodyEnd);
    const n = (body.match(MARK_RE) || []).length;
    if (n !== 1) { ok2 = false; rep.push(`   ✘ 第 ${o.n} 条分支体内有 ${n} 个阶段标题`); }
  });
  ck(ok2, '每条分支体内恰好一个阶段标题（不会一段吐两块）');

  // else 兜底分支必须存在，且体内只有占位那一行（取**最后一个** else —— 阶段一里还有一个嵌套的 else）
  const elseAll = [...tpl.matchAll(/<%\s*\}\s*else\s*\{\s*%>([\s\S]*?)<%\s*\}\s*%>/g)];
  const elseM = elseAll[elseAll.length - 1];
  ck(elseAll.length === 2 && !!elseM, `存在收尾的 \`else\` 兜底分支（模板里共 ${elseAll.length} 个 else：阶段一的嵌套 + 收尾兜底）`);
  if (elseM) {
    const body = elseM[1].trim();
    ck(body === '（阶段数据不可用，按当前上下文谨慎推进）', '兜底分支体内**只有**一行安全占位', `实际：${body.slice(0, 40)}`);
    ck(!MARK_RE.test(body), '兜底分支体内没有任何阶段正文');
    MARK_RE.lastIndex = 0;
  }
  // 兜底那句必须是**只在收尾 else 分支里**出现一次（不能在前言或任何阶段段里预先写好）
  {
    const PH = '（阶段数据不可用，按当前上下文谨慎推进）';
    const n = tpl.split(PH).length - 1;
    const elseStart = [...tpl.matchAll(/<%\s*\}\s*else\s*\{\s*%>/g)].pop().index;
    const pre = tpl.slice(0, tpl.indexOf('<%_'));
    ck(n === 1, `「安全占位」整句在模板里只出现 1 次（实测 ${n} 次）`, `前言里出现 = ${pre.includes(PH)}`);
    ck(tpl.indexOf(PH) > elseStart, '它落在收尾 else 分支之内（不是任何时候都会吐的明文）');
  }
}

// 花括号配平
{
  let depth = 0, minDepth = 0;
  for (const m of tpl.matchAll(/<%([\s\S]*?)%>/g)) {
    const code = m[1].replace(/^[_\-=]/, '').replace(/[_\-]$/, '');
    for (const ch of code) { if (ch === '{') depth++; else if (ch === '}') { depth--; if (depth < minDepth) minDepth = depth; } }
  }
  ck(depth === 0 && minDepth === 0, '模板里的花括号配平（无多余 / 悬挂的 `}`）', `末态 depth=${depth}，历史最浅=${minDepth}`);
}
// try/catch 存在性
ck(/try\s*\{/.test(tpl) && /catch\s*\(\s*e\s*\)\s*\{/.test(tpl), '静默计算层有 try/catch（异常不会逃出模板）');
ck(!/catch\s*\(\s*e\s*\)\s*\{\s*\}/.test(tpl), '**没有**照抄案例卡的 `catch(e){}` 空吞异常写法');

// ⚠️ 最要命的一条：正文里**不许**出现裸的模板标记。
//    踩过一次：前言里写「若你看到 <% 或 %> 这类模板字面量…」——EJS 会把正文里那对尖括号
//    当成真的代码块去求值，轻则吞字、重则整条模板报错。所以「<%%」出现次数必须等于「真的标签数」。
{
  const openCnt = (tpl.match(/<%/g) || []).length;
  const closeCnt = (tpl.match(/%>/g) || []).length;
  const tagCnt = (tpl.match(/<%[-_=]?[\s\S]*?[-_]?%>/g) || []).length;
  ck(openCnt === closeCnt, `模板标记成对（<% 出现 ${openCnt} 次／%> 出现 ${closeCnt} 次）`);
  ck(openCnt === tagCnt, `没有裸的模板标记：<%% 出现 ${openCnt} 次 ＝ 真标签 ${tagCnt} 个`, openCnt === tagCnt ? '正文里没有夹带模板记号' : '⚠️ 正文里夹带了会被当成代码的标记');
}

/* ═══════════ ③ 变量组合 ⇒ 只渲染当前段 ═══════════ */
sec('③ 变量组合 ⇒ 只渲染当前段');
/* ⚠️ 2026-10-01 修：判据已从「known 锚点 ＋ 地点 ＋ 身份」改成「**段位**（卡内脚本按楼层算的纯函数）＋ 身份」。
 *   ⇒ 本节改成"喂段位、验只渲染当前那一段"；旧的 18 条锚点／地点用例随判据一起作废（判据由主人发起）。 */
const V = ({ id = '赵无忧', stage } = {}) => ({
  stat_data: Object.assign(
    { 身份: id, 阵营: '墨山道', known: {} },
    stage === undefined ? {} : { 段位: stage },
  ),
});
function run(variables) {
  const out = render(variables);
  const hit = [...out.matchAll(/(?:^##\s*|【)阶段([一二三四])\s*·/gm)].map((x) => '一二三四'.indexOf(x[1]) + 1);
  return { out, hit, placeholder: out.includes('（阶段数据不可用，按当前上下文谨慎推进）'), len: out.length };
}
const CASES = [
  /* ⚠️ 2026-10-06 更新（本检查原先按「段位 ＝ 大段号 1..4」写，与模板真实映射不符 ⇒ 4 条断言一直是红的）：
   *   模板与 `状态机.js` 的真口径是 **16 个细分段位**：1–5 → 第 1 段、6–11 → 第 2 段、
   *   12–14 → 第 3 段、15–16 → 第 4 段（见 `_stage_drive.txt` 的 `stg >= 15 / >= 12 / >= 6` 三档）。
   *   本用例表按这个真口径重排；「越界」一例也改成真的越界值（>16）。 */
  { name: '段位=1（第 1–15 楼）', v: V({ stage: 1 }), want: 1 },
  { name: '段位=5（第 1 段上界）', v: V({ stage: 5 }), want: 1 },
  { name: '段位=6（第 2 段下界）', v: V({ stage: 6 }), want: 2 },
  { name: '段位=11（第 2 段上界）', v: V({ stage: 11 }), want: 2 },
  { name: '段位=12（第 3 段下界）', v: V({ stage: 12 }), want: 3 },
  { name: '段位=14（第 3 段上界）', v: V({ stage: 14 }), want: 3 },
  { name: '段位=15（第 4 段下界）', v: V({ stage: 15 }), want: 4 },
  { name: '段位=99（越界）⇒ 仍按第 4 段（≥15 一档兜住）', v: V({ stage: 99 }), want: 4 },
  { name: '段位缺失（新档）⇒ 默认第 1 段', v: V(), want: 1 },
  { name: '段位=0（非法）⇒ 默认第 1 段', v: V({ stage: 0 }), want: 1 },
  { name: '段位=1 但身份=魂欢殿主 ⇒ 身份压到第 4 段', v: V({ id: '魂欢殿主', stage: 1 }), want: 4 },
  { name: '段位=1 但身份=焚欲殿主 ⇒ 身份压到第 4 段', v: V({ id: '焚欲殿主', stage: 1 }), want: 4 },
  { name: '段位=15 且身份=自设 ⇒ 第 4 段', v: V({ id: '自设', stage: 15 }), want: 4 },
];
let onlyOne = true, rightOne = true;
for (const c of CASES) {
  const r = run(c.v);
  const one = r.hit.length === 1;
  const right = one && r.hit[0] === c.want;
  if (!one) onlyOne = false;
  if (!right) rightOne = false;
  note(`${right ? '✔' : '✘'} ${c.name} ⇒ 命中 ${r.hit.length} 段[${r.hit.join(',') || '—'}]，期望 ${c.want}｜输出 ${r.len} 字${r.placeholder ? '（占位）' : ''}`);
}
ck(onlyOne, `全部 ${CASES.length} 个组合都**只**命中一段（没有任何组合会吐出两段以上）`);
ck(rightOne, `全部 ${CASES.length} 个组合都命中了预期的那一段`);

// 独有句哨兵：命中段含本段独有句，且不含其余三段的独有句
{
  const SENTINEL = {
    1: '正篇起点（第一章）',
    2: '是本章底牌',
    3: '每一次退让都不得预告',
    4: '严禁由旁白宣布其身份变更',
  };
  let ok = true;
  for (const c of CASES) {
    const r = run(c.v);
    for (const [n, s] of Object.entries(SENTINEL)) {
      const has = r.out.includes(s);
      if (Number(n) === c.want) { if (!has) { ok = false; note(`✘ 「${c.name}」缺第 ${n} 段独有句：${s}`); } }
      else if (has) { ok = false; note(`✘ 「${c.name}」里混进了第 ${n} 段独有句：${s}`); }
    }
  }
  ck(ok, '独有句哨兵：命中段含本段独有句，且不含其余三段的独有句');
}

/* ═══════════ ④ 兜底路径 ═══════════ */
sec('④ 兜底：判据缺失 / 求值抛错 ⇒ 安全占位');
const FALLBACKS = [
  { name: 'variables 整个不存在（undefined）', make: () => undefined },
  { name: 'variables = {}（没有 stat_data）', make: () => ({}) },
  { name: 'stat_data = null', make: () => ({ stat_data: null }) },
  { name: 'stat_data 是字符串（类型错）', make: () => ({ stat_data: '赵无忧' }) },
  { name: '读 stat_data 时抛错（getter 抛异常）', make: () => Object.defineProperty({}, 'stat_data', { get() { throw new Error('模拟变量层故障'); } }) },
];
let fbOk = true;
const fbOuts = [];
for (const f of FALLBACKS) {
  let r;
  try { r = run(f.make()); } catch (e) { r = { out: '', hit: [], placeholder: false, len: 0, threw: String(e.message) }; }
  fbOuts.push(r.out);
  const good = !r.threw && r.placeholder && r.hit.length === 0;
  if (!good) fbOk = false;
  note(`${good ? '✔' : '✘'} ${f.name} ⇒ ${r.threw ? '渲染器抛出：' + r.threw : `命中 ${r.hit.length} 段｜占位=${r.placeholder}｜输出 ${r.len} 字`}`);
}
ck(fbOk, '5 条兜底路径全部输出**安全占位**，一段阶段正文都没吐出来');

{
  const worst = Math.max(...fbOuts.map((o) => o.length));
  const smallest = Math.min(...[1, 2, 3, 4].map((n) => run(V({ stage: [1, 6, 12, 15][n - 1] })).len));
  const PRE = tpl.slice(0, tpl.indexOf('<%_')).length;
  // 兜底输出 ＝ 总纲前言 ＋ 一行占位；前言在任何路径下都会渲染，所以要比的是「占位那一行」的厚度
  ck(worst - PRE <= 60, `兜底输出比总纲前言只多 ${worst - PRE} 字（占位就是**一行**；前言 ${PRE} 字）`);
  ck(worst < smallest * 0.8, `兜底输出 ${worst} 字 明显小于最小的阶段段（${smallest} 字）—— 失败路径比任何成功路径都短`);
  ck(fbOuts.every((o) => !/【阶段[一二三四] · /.test(o)), '没有任何兜底输出里出现阶段标题');
  /* ⚠️ 2026-10-06 修：收尾标签现在是 `<stage_drive>`（旧写法是长条名，早就不用了） */
  const CLOSE_TAG = '</stage_drive>';
  const PRE_TEXT = tpl.slice(0, tpl.indexOf('<%_')).trim();
  ck(fbOuts.every((o) => o.replace('（阶段数据不可用，按当前上下文谨慎推进）', '').replace(CLOSE_TAG, '').trim() === PRE_TEXT), '兜底输出 ＝ 总纲前言 ＋ 一行安全占位（＋收尾标签），没有别的字');
  // 与非渲染纯文本对照：证明兜底不等于「把模板全文吐出去」
  const fullLeak = tpl.replace(/<%[\s\S]*?%>/g, '');
  const blockOnly = smallest - PRE;
  ck(fullLeak.length > worst * 4, `若模板完全不渲染，明文有 ${fullLeak.length} 字（是兜底的 ${(fullLeak.length / worst).toFixed(1)} 倍）—— 兜底没有退化成这条路`);
  ck(fullLeak.length - PRE >= 3 * blockOnly, `「四段全露」的正文（${fullLeak.length - PRE} 字）≥ 3 倍单段正文（${blockOnly} 字）—— 门控确实挡住了整段剧透`);
}

/* ═══════════ ⑤ 字数 / 常驻预算增量 ═══════════ */
sec('⑤ 字数 / 常驻预算增量');
const PREAMBLE = tpl.slice(0, tpl.indexOf('<%_')).length;
const CODE = [...tpl.matchAll(/<%_[\s\S]*?_%>/g)].reduce((n, m) => n + m[0].length, 0);
const BLOCK_SRC = {};
{
  const OPEN_RE = /<%\s*\}?\s*(?:if|else if)\s*\(XSD_STAGE\s*===\s*([1-4])\s*\)\s*\{\s*%>/g;
  const os = [...tpl.matchAll(OPEN_RE)];
  const elseLast = [...tpl.matchAll(/<%\s*\}\s*else\s*\{\s*%>/g)].pop();
  os.forEach((m, i) => {
    const end = i + 1 < os.length ? os[i + 1].index : elseLast.index;
    BLOCK_SRC[Number(m[1])] = tpl.slice(m.index + m[0].length, end);
  });
}
const RENDERED = {};
for (const n of [1, 2, 3, 4]) RENDERED[n] = run(V({ stage: n })).len;   // 2026-10-01：判据改成段位
note('段号 ｜ 源字数（含嵌套 EJS） ｜ 每回合实际渲染字数');
for (const n of [1, 2, 3, 4]) note(`  第 ${n} 段 ｜ ${String((BLOCK_SRC[n] || '').length).padStart(5)} 字 ｜ ${String(RENDERED[n]).padStart(5)} 字 ≈ ${tok(RENDERED[n])} tok`);
const minR = Math.min(...Object.values(RENDERED)), maxR = Math.max(...Object.values(RENDERED));
note(`源文件总长 ${tpl.length} 字 ≈ ${tok(tpl.length)} tok ＝ 总纲前言 ${PREAMBLE} 字 ＋ 静默计算层 ${CODE} 字 ＋ 四段合计 ${tpl.length - PREAMBLE - CODE} 字`);
note(`每回合真实注入 ${minR}–${maxR} 字 ≈ ${tok(minR)}–${tok(maxR)} tok（静默计算层与另外三段留在模板里，不进上下文）`);

if (fs.existsSync(CARD)) {
  const d = JSON.parse(fs.readFileSync(CARD, 'utf8')).data;
  const konst = d.character_book.entries.filter((e) => e.enabled !== false && e.constant === true);
  const kc = konst.reduce((n, e) => n + String(e.content || '').length, 0);
  const already = konst.some((e) => String(e.comment || '').includes('【阶段驱动】'));
  const add = Math.round((minR + maxR) / 2);
  note(`现有卡常驻基线：${konst.length} 条 / ${kc} 字（卡内已有【阶段驱动】= ${already}；未重跑构建 ⇒ 应为 false）`);
  note(`加入本条目后：常驻 ${konst.length + 1} 条 / ${kc + add} 字 ⇒ **常驻增量 ≈ +${add} 字 ≈ +${tok(add)} tok／回合（+${(add / kc * 100).toFixed(1)}%）**`);
  note(`对照：若把 _stage_drive.txt 原文整条塞进常驻（无 EJS），增量会是 +${tpl.length} 字 —— 门控把它压到 +${add} 字（省 ${(100 - add / tpl.length * 100).toFixed(0)}%）`);
} else {
  note('⚠️ 找不到已构建的卡 JSON，跳过常驻基线对比');
}

/* ═══════════ ⑥ 本卡两张黑名单 ═══════════ */
sec('⑥ 禁用词 / 剧透词（对齐 _final_check_card.js 的两张表）');
const BAN = ['玄阳凤髓', '龙根', '凶器', '茎身', '阳器', '阳物', '阳根', '器物'];
const SPOIL = ['溟龙神女', '月奴', '欲凰神女', '孽莲神女', '惑心神女', '神女殿', '天姝榜', '奴种', '昨日欢', '邪心天目', '千心一欲', '邪欲凤翼', '拓印'];
const hitBan = BAN.filter((w) => tpl.includes(w));
const hitSpoil = SPOIL.filter((w) => tpl.includes(w));
ck(hitBan.length === 0, '禁用词 0 命中', hitBan.join('、') || '无');
ck(hitSpoil.length === 0, '剧透词 0 命中（本条目没有 `@@if`，会被那张表按「无条件注入」扫描）', hitSpoil.join('、') || '无');

/* ═══════════ ⑦ 13 个锚点字段名对齐 ═══════════ */
sec('⑦ 13 个锚点字段名 vs 卡片脚本\\状态机.js');
const sm = fs.readFileSync(SM, 'utf8');
const grab = (name) => (sm.match(new RegExp(name + '\\s*=\\s*\\[([\\s\\S]*?)\\]')) || [])[1] || '';
const names = (s) => [...s.matchAll(/'([^']+)'/g)].map((m) => m[1]);
const AI = names(grab('AI_FIELDS')), HU = names(grab('HUMAN_FIELDS')), OP = names(grab('OPEN_FIELDS'));
const ALL_SM = [...AI, ...HU, ...OP];
/* ⚠️ 2026-10-01 修：判据已从「known 锚点 ＋ 地点 ＋ 身份」换成「**段位**（脚本按楼层算）＋ 身份」。
 *   旧断言（13 个锚点字段逐字对齐状态机、前 7 人批 ＋ 6 剧情位）随判据作废 —— 判据改动由主人发起。
 *   换成验新判据的四条：只读段位／不读地点／不用锚点数组／取不到时默认第 1 段。 */
ck(/parseInt\s*\(\s*sd\.段位/.test(tpl), '判段只读 `stat_data.段位`（卡内脚本按楼层算出来的纯函数）');
ck(!/sd\.地点/.test(tpl), '判段**不再读** `地点`（那是模型填的，填错就会切错段）');
ck(!/anyOf\s*\(/.test(tpl), '判段**不再用锚点数组**（`anyOf(` 已全部移除）');
/* ⚠️ 2026-10-06 更新：原断言验的是旧表达式 `(stg >= 1 && stg <= 4) ? stg : 1`（段位＝大段号那套）。
 *   现在的真口径是「先 `var st = 1` 兜底，再按 16 段位分档抬到 2/3/4，最后 `XSD_STAGE = (st >= 1 && st <= 4) ? st : 0`」
 *   ⇒ 取不到段位时仍是第 1 段（不卡死）；判据抛错时才是 0（安全占位）。这里改验这套。 */
ck(/var st = 1;/.test(tpl) && /XSD_STAGE = \(st >= 1 && st <= 4\) \? st : 0/.test(tpl),
  '段位取不到 ⇒ **默认第 1 段**（不卡死）；判据抛错 ⇒ 0（安全占位）');

/* ═══════════ 打印 ═══════════ */
console.log(rep.join('\n'));
const nAsserts = rep.filter((l) => /^[✔✘]/.test(l)).length;
console.log(`\n${fail === 0 ? '✅ 全部通过' : '❌ ' + fail + ' 项未通过'}（共 ${nAsserts} 项断言）`);
process.exit(fail === 0 ? 0 : 2);
