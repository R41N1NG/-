/* 门禁：历时推进（nextAcc 纯函数 ＋ parseLishi 解析）离线路测
 *
 * ⚠️ 2026-10-08 规格变更（gpt 04 号《日期门与可玩性裁定》的「时钟计量」四项）：
 *   · ① 一日计足一日（1/30 ＝ 0.03333）；原常规上限 0.02（＝0.6 日）会把「一日」截成 0.6 日，
 *        30 次「一日」只记 18 日 —— 这是 gpt 复现的缺陷，不是规格。
 *   · ② 转场正则必须认出「一个月」（原式只认「一月」）。
 *   · ③ 半年计足半年（原过渡上限 3 会把 6 截成 3）。
 *   · ④ 倒计时不计增量（『距启程 3 日』原会被当已过历时累计）。
 *   因此本文件里两条「上限」断言按新规格更新（常规 0.02→0.1／过渡 3→12），
 *   行为断言（合法 0 不被跳过／同楼撤销／换段不清零／无历时不动累计）**一字未改**，
 *   并**新增**上面四项的反例断言。证据来源：gpt 04 号《日期门与可玩性裁定》＋ 时钟复核.cjs。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', '卡片脚本', '状态机.js');
const code = fs.readFileSync(SRC, 'utf8');

function grabFn(name) {
  const m = new RegExp('function ' + name + '\\(').exec(code);
  if (!m) throw new Error('抠不到函数：' + name);
  const open = code.indexOf('{', m.index);
  let depth = 0, j = open;
  for (; j < code.length; j++) {
    const c = code[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { j++; break; } }
  }
  return code.slice(m.index, j);
}
function grabLine(re, label) {
  const m = re.exec(code);
  if (!m) throw new Error('抠不到：' + label);
  return m[0];
}
function grabArr(label) {
  const i = code.indexOf(label);
  if (i < 0) throw new Error('抠不到：' + label);
  const open = code.indexOf('[', i);
  let depth = 0, j = open;
  for (; j < code.length; j++) {
    const c = code[j];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { j++; break; } }
  }
  return code.slice(i, j) + ';';
}

const src = [
  grabLine(/const LISHI_CAP = [^\n]*/, 'LISHI_CAP'),
  grabLine(/const LISHI_CAP_TRANSIT = [^\n]*/, 'LISHI_CAP_TRANSIT'),
  grabLine(/const LISHI_TRANSIT_RE = [^\n]*/, 'LISHI_TRANSIT_RE'),
  grabArr('const LISHI_WORDS ='),
  grabFn('parseLishi'),
  grabFn('nextAcc'),
].join('\n');

const M = new Function(src + '\nreturn { nextAcc, parseLishi, LISHI_TRANSIT_RE, LISHI_CAP, LISHI_CAP_TRANSIT };')();
const nextAcc = M.nextAcc, parseLishi = M.parseLishi;

const results = [];
const check = (name, cond, note = '') => results.push([name, !!cond, note]);
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

/* ───────── 行为断言（一字未改） ───────── */
{
  const r = nextAcc({ 历时累计: 0, 时点加速: 0.05 }, 5, 0.02, false);
  check('P1-4 合法 0 不被跳过（0 + 0.02 = 0.02，而非 0.07）', near(r.acc, 0.02), 'acc=' + r.acc);
}
{
  const r = nextAcc({ 历时累计: null, 时点加速: 0.05 }, 5, 0.02, false);
  check('P1-4 真缺失（null）才回退到时点加速（0.05 + 0.02 = 0.07）', near(r.acc, 0.07), 'acc=' + r.acc);
}
{
  const r = nextAcc({ 历时累计: 1.02, 最后处理楼号: 8, 本楼历时加速: 0.02 }, 8, 0.02, false);
  check('P1-5 同楼撤销不重复叠加（1.02 → 1.02）', near(r.acc, 1.02) && r.sameFloor === true, 'acc=' + r.acc);
}
{
  const r = nextAcc({ 历时累计: 1.02, 最后处理楼号: 7, 本楼历时加速: 0.02 }, 8, 0.02, false);
  check('P1-5 换楼正常累加（1.02 + 0.02 = 1.04）', near(r.acc, 1.04) && r.sameFloor === false, 'acc=' + r.acc);
}
{
  const r = nextAcc({ 历时累计: 3.5 }, 9, 0.02, false);
  check('P1-2 换段不清零（3.5 + 0.02 = 3.52）', near(r.acc, 3.52), 'acc=' + r.acc);
}
{
  const r = nextAcc({ 历时累计: -5 }, 9, 0.02, false);
  check('P1-2 非法（负值）才归零（0 + 0.02 = 0.02）', near(r.acc, 0.02), 'acc=' + r.acc);
}
{
  const r = nextAcc({ 历时累计: 2 }, 9, 0, false);
  check('无历时（stepM=0）⇒ adv=0、累计不动（2）', near(r.adv, 0) && near(r.acc, 2), 'acc=' + r.acc + ' adv=' + r.adv);
}
{
  let sd = {};
  for (let i = 1; i <= 10; i++) { const r = nextAcc(sd, i, 0.02, false); sd = { 历时累计: r.acc, 最后处理楼号: i, 本楼历时加速: r.adv }; }
  check('十楼小步长累计无浮点垃圾（0.2）', near(sd.历时累计, 0.2), 'acc=' + sd.历时累计);
}

/* ───────── 上限断言（按 2026-10-08 gpt 04 号新规格更新） ───────── */
check('规格·常规上限 ＝ 0.1 月（3 日）', near(M.LISHI_CAP, 0.1), 'LISHI_CAP=' + M.LISHI_CAP);
check('规格·过渡上限 ＝ 12 月（一年）', near(M.LISHI_CAP_TRANSIT, 12), 'LISHI_CAP_TRANSIT=' + M.LISHI_CAP_TRANSIT);
{
  const r = nextAcc({ 历时累计: 0 }, 9, 5, false);
  /* 2026-10-08（gpt 17 号 §5-4 ↔ 05 §4 L98）：超限从「按上限截半截计入」改为「**整笔拒绝**」
     —— 截了却照写"五个月后"，玩家看到的日历与正文对不上。新预期：adv=0、累计不变、rejected=true。 */
  check('常规历时超限 ⇒ 整笔不计（5 月申报，adv=0）', near(r.adv, 0) && near(r.acc, 0), 'adv=' + r.adv + ' acc=' + r.acc);
  check('超限带 clipped 与 rejected 标记（原来只是静默/诊断）', r.clipped === true && r.rejected === true, 'clipped=' + r.clipped + ' rejected=' + r.rejected);
  check('超限时把申报值原样带回（供落 [历时待确认]）', near(r.raw, 5) && near(r.capM, 0.1), 'raw=' + r.raw + ' capM=' + r.capM);
}
{
  const r = nextAcc({ 历时累计: 3.14 }, 9, 5, false);
  check('超限拒绝时不改动已有累计（3.14 个月保持）', near(r.acc, 3.14), 'acc=' + r.acc);
}
{
  const r = nextAcc({ 历时累计: 0 }, 9, 5, true);
  check('过渡历时 5 月计足（5 → 5，原被截成 3）', near(r.adv, 5) && r.clipped === false, 'adv=' + r.adv);
}

/* ───────── gpt 04 号四项的反例断言（新增） ───────── */
check('①「一日」解析 ＝ 1/30（不再只等于 0.033）', near(parseLishi('一日'), 1 / 30, 1e-9), 'v=' + parseLishi('一日'));
check('①「一日」> 旧上限 0.02（旧规则会被截成 0.6 日）', parseLishi('一日') > 0.02, 'v=' + parseLishi('一日'));
{
  let sd = {};
  for (let i = 1; i <= 30; i++) { const r = nextAcc(sd, i, parseLishi('一日'), false); sd = { 历时累计: r.acc, 最后处理楼号: i, 本楼历时加速: r.adv }; }
  check('① 30 次「一日」记足 30 日（＝1 月，旧规则只记 18 日）', near(sd.历时累计, 1, 1e-6), 'acc=' + sd.历时累计);
}
check('② 转场正则认出「一个月」（旧式 false）', M.LISHI_TRANSIT_RE.test('一个月'), 'hit=' + M.LISHI_TRANSIT_RE.test('一个月'));
check('② 转场正则认出「数个月」', M.LISHI_TRANSIT_RE.test('数个月后'), 'hit=' + M.LISHI_TRANSIT_RE.test('数个月后'));
check('②「一个月」解析 ＝ 1', near(parseLishi('一个月'), 1), 'v=' + parseLishi('一个月'));
{
  const step = parseLishi('一个月');
  const r = nextAcc({ 历时累计: 0 }, 9, step, M.LISHI_TRANSIT_RE.test('一个月'));
  check('②「一个月」按过渡计足 1 月（旧规则只记 0.02）', near(r.adv, 1), 'adv=' + r.adv);
}
check('③「半年」解析 ＝ 6', near(parseLishi('半年'), 6), 'v=' + parseLishi('半年'));
{
  const step = parseLishi('半年');
  const r = nextAcc({ 历时累计: 0 }, 9, step, M.LISHI_TRANSIT_RE.test('半年'));
  check('③「半年」计足 6 月（旧被截成 3）', near(r.adv, 6), 'adv=' + r.adv);
}
check('④ 倒计时「距启程 3 日」不计增量', near(parseLishi('距启程 3 日'), 0), 'v=' + parseLishi('距启程 3 日'));
check('④ 倒计时「还有两日」不计增量', near(parseLishi('还有两日'), 0), 'v=' + parseLishi('还有两日'));
check('④ 倒计时「倒计时：三日后」不计增量', near(parseLishi('倒计时：三日后'), 0), 'v=' + parseLishi('倒计时：三日后'));
/* 2026-10-08（gpt 17 号 §5-4 ↔ 05 §4 L100）：**未来计划不算已过**。原断言写的是
   `parseLishi('三日后启程') > 0`（把计划当已过）—— 与 gpt 的裁定相反，现改为 0；
   同时补一条"明写已过"的正例，避免只是削弱判据。 */
check('④b 未来计划不计（「三日后启程」＝0，不因有"日"字就算已过）', parseLishi('三日后启程') === 0, 'v=' + parseLishi('三日后启程'));
check('④b-2 师尊说的计划也不计（「师尊说三日后启程」＝0）', parseLishi('师尊说三日后启程') === 0, 'v=' + parseLishi('师尊说三日后启程'));
check('④b-3 明写已过的转场照计（「三日已过，我们启程」＝3 日＝0.1 月）', near(parseLishi('三日已过，我们启程'), 0.1), 'v=' + parseLishi('三日已过，我们启程'));
check('④b-4 定于/拟于 一律 0', parseLishi('定于三日后启程') === 0, 'v=' + parseLishi('定于三日后启程'));
check('⑤「三日」计足 0.1 月', near(parseLishi('三日'), 0.1), 'v=' + parseLishi('三日'));

const bad = results.filter(([, ok]) => !ok);
for (const [n, ok, note] of results) console.log((ok ? '✔' : '✘') + ' ' + n + (note ? '｜' + note : ''));
console.log('\n门禁：历时推进（nextAcc ＋ parseLishi）  ' + (results.length - bad.length) + ' 通过 / ' + bad.length + ' 失败');
process.exit(bad.length ? 1 : 0);
