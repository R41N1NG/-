/* 门禁：历时推进（nextAcc 纯函数）离线路测 —— 对应 gpt 复核答复的 P1-2／P1-4／P1-5／P1-7
 *
 * 断言的是**行为**（把生效脚本里的 nextAcc 逐字抠出来跑），不是"代码里有没有那行字"：
 *   · P1-4  合法的 0 不能被 || 跳过（账上 历时累计=0 而 时点加速=0.05 时，必须从 0 起算）
 *   · P1-5  同楼重绘/修改：先撤本楼上一轮加的量，再加本次的
 *   · P1-2  换段**不清零**（旧行为：段位变化即归零）
 *   · P1-7  截断在纯函数里做：过渡历时上限 3 月／常规上限 0.02 月
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

const src = [
  grabLine(/const LISHI_CAP = [^\n]*/, 'LISHI_CAP'),
  grabLine(/const LISHI_CAP_TRANSIT = [^\n]*/, 'LISHI_CAP_TRANSIT'),
  grabFn('nextAcc'),
].join('\n');

const nextAcc = new Function(src + '\nreturn nextAcc;')();

const results = [];
const check = (name, cond, note = '') => results.push([name, !!cond, note]);
const near = (a, b) => Math.abs(a - b) < 1e-9;

/* P1-4：合法 0 不被 || 跳过 —— 账上 历时累计=0，时点加速=0.05 ⇒ 必须从 0 起算（0.02），不是 0.07 */
{
  const r = nextAcc({ 历时累计: 0, 时点加速: 0.05 }, 5, 0.02, false);
  check('P1-4 合法 0 不被跳过（0 + 0.02 = 0.02，而非 0.07）', near(r.acc, 0.02), 'acc=' + r.acc);
}
/* 只有"真缺失"才回退到时点加速 */
{
  const r = nextAcc({ 历时累计: null, 时点加速: 0.05 }, 5, 0.02, false);
  check('P1-4 真缺失（null）才回退到时点加速（0.05 + 0.02 = 0.07）', near(r.acc, 0.07), 'acc=' + r.acc);
}
/* P1-5：同楼撤销 —— 原先 1.02（含本楼 0.02）⇒ 撤 0.02 得 1.00，再加 0.02 = 1.02 */
{
  const r = nextAcc({ 历时累计: 1.02, 最后处理楼号: 8, 本楼历时加速: 0.02 }, 8, 0.02, false);
  check('P1-5 同楼撤销不重复叠加（1.02 → 1.02）', near(r.acc, 1.02) && r.sameFloor === true, 'acc=' + r.acc);
}
/* 不同楼 ⇒ 不回撤，正常累加 */
{
  const r = nextAcc({ 历时累计: 1.02, 最后处理楼号: 7, 本楼历时加速: 0.02 }, 8, 0.02, false);
  check('P1-5 换楼正常累加（1.02 + 0.02 = 1.04）', near(r.acc, 1.04) && r.sameFloor === false, 'acc=' + r.acc);
}
/* P1-2：换段不清零 —— 无「最后处理楼号」也带 3.5 的累计（模拟换段后的老账）⇒ 3.52 */
{
  const r = nextAcc({ 历时累计: 3.5 }, 9, 0.02, false);
  check('P1-2 换段不清零（3.5 + 0.02 = 3.52）', near(r.acc, 3.52), 'acc=' + r.acc);
}
/* 非法值才归零 */
{
  const r = nextAcc({ 历时累计: -5 }, 9, 0.02, false);
  check('P1-2 非法（负值）才归零（0 + 0.02 = 0.02）', near(r.acc, 0.02), 'acc=' + r.acc);
}
/* P1-7：常规上限 0.02 */
{
  const r = nextAcc({ 历时累计: 0 }, 9, 5, false);
  check('P1-7 常规历时限 0.02（5 → 0.02）', near(r.adv, 0.02), 'adv=' + r.adv);
}
/* P1-7：过渡上限 3 */
{
  const r = nextAcc({ 历时累计: 0 }, 9, 5, true);
  check('P1-7 过渡历时限 3（5 → 3）', near(r.adv, 3), 'adv=' + r.adv);
}
/* 无历时 ⇒ adv=0、累计不动 */
{
  const r = nextAcc({ 历时累计: 2 }, 9, 0, false);
  check('无历时（stepM=0）⇒ adv=0、累计不动（2）', near(r.adv, 0) && near(r.acc, 2), 'acc=' + r.acc + ' adv=' + r.adv);
}
/* 精度：小步长不产生浮点垃圾 */
{
  let sd = {};
  for (let i = 1; i <= 10; i++) { const r = nextAcc(sd, i, 0.02, false); sd = { 历时累计: r.acc, 最后处理楼号: i, 本楼历时加速: r.adv }; }
  check('十楼小步长累计无浮点垃圾（0.2）', near(sd.历时累计, 0.2), 'acc=' + sd.历时累计);
}

const bad = results.filter(([, ok]) => !ok);
for (const [n, ok, note] of results) console.log((ok ? '✔' : '✘') + ' ' + n + (note ? '｜' + note : ''));
console.log('\n门禁：历时推进（nextAcc）  ' + (results.length - bad.length) + ' 通过 / ' + bad.length + ' 失败');
process.exit(bad.length ? 1 : 0);
