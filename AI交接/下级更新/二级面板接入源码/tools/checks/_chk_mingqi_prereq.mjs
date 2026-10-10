/* 门禁：名器成形的**硬前置**（持有者必须先破身）
 * 依据：主人 2026-10-08 当面指定；字段表里每条 `X处女丧失` 的 desc 原文。
 * 真机事故：与苏瑶的戏里解锁了**慕容清歌**的「清歌弦鸣穴」。
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
  let d = 0, j = open;
  for (; j < code.length; j++) { const c = code[j]; if (c === '{') d++; else if (c === '}') { d--; if (!d) { j++; break; } } }
  return code.slice(m.index, j);
}
function grabConst(name) {
  const i = code.indexOf('const ' + name + ' =');
  if (i < 0) throw new Error('抠不到常量：' + name);
  const eq = code.indexOf('=', i);
  let d = 0, j = eq;
  for (; j < code.length; j++) {
    const c = code[j];
    if ('([{'.includes(c)) d++;
    else if (')]}'.includes(c)) d--;
    else if (c === ';' && d <= 0) { j++; break; }
  }
  return code.slice(i, j);
}

const src = [
  'const TAG = "[test]";',
  'const console = { log(){}, warn(){}, error(){} };',
  grabConst('FIELD_TABLE'),
  grabConst('ANCHOR_EVIDENCE'),
  grabConst('NEG_RE'),
  grabConst('MINGQI_PREREQ'),
  grabConst('DEFLOWER_HARD_RES'),
  'const ALL_FIELDS = FIELD_TABLE.filter((f) => Boolean(f.name)).map((f) => f.name);',
  grabFn('normalizeAnchorName'),
  grabFn('negatedAround'),
  grabFn('anchorEvidenceIn'),
  grabFn('validateAnchors'),
].join('\n');

const M = new Function(src + '\nreturn { validateAnchors, MINGQI_PREREQ, ALL_FIELDS };')();
const { validateAnchors, MINGQI_PREREQ, ALL_FIELDS } = M;

const results = [];
const check = (n, c, note = '') => results.push([n, !!c, note]);
const good = (list, prose, known, deflower) => validateAnchors(list, prose, 1, known, deflower || []).good;
const dropped = (list, prose, known) => validateAnchors(list, prose, 1, known).dropped;

/* ① 真机事故：与苏瑶的戏里报「清歌弦鸣穴成形」 */
check('① 慕容清歌未破身时，报「清歌弦鸣穴成形」⇒ 拒绝（真机事故）',
  good(['清歌弦鸣穴成形'], '苏瑶与他在帐中温存，琴声戛然而止。', {}) .length === 0,
  JSON.stringify(dropped(['清歌弦鸣穴成形'], '苏瑶与他在帐中温存，琴声戛然而止。', {})));
check('① 慕容清歌已破身 ⇒ 放行',
  good(['清歌弦鸣穴成形'], '慕容清歌已被破身，清歌弦鸣穴成形。', { 慕容清歌处女丧失: true }).includes('清歌弦鸣穴成形'));

/* ② 楚灵夜：必须「处女丧失 ∧ 后窍开发」两个都为真 */
check('② 楚灵夜只破身、后窍未开发 ⇒ 拒绝般若菩提菊',
  good(['般若菩提菊成形'], '楚灵夜于积云古寺显现，般若菩提菊成形。', { 楚灵夜处女丧失: true }).length === 0,
  JSON.stringify(dropped(['般若菩提菊成形'], '楚灵夜于积云古寺显现，般若菩提菊成形。', { 楚灵夜处女丧失: true })));
check('② 楚灵夜两者齐备 ⇒ 放行',
  good(['般若菩提菊成形'], '楚灵夜后窍被开发，般若菩提菊成形。', { 楚灵夜处女丧失: true, 楚灵夜后窍开发: true }).includes('般若菩提菊成形'));

/* ③ 灵犀同心：苏瑶与苏玲**两个都要破身** */
check('③ 只有苏瑶破身 ⇒ 拒绝灵犀同心',
  good(['灵犀同心成形'], '灵犀同心、日月同辉，同心异体成形。', { 苏瑶处女丧失: true }).length === 0,
  JSON.stringify(dropped(['灵犀同心成形'], '灵犀同心、日月同辉，同心异体成形。', { 苏瑶处女丧失: true })));
check('③ 两人都破身 ⇒ 放行',
  good(['灵犀同心成形'], '灵犀同心、日月同辉，同心异体成形。', { 苏瑶处女丧失: true, 苏玲处女丧失: true }).includes('灵犀同心成形'));

/* ④ 灼酒流炎穴：叶红缨未破身 ⇒ 拒绝（它另有过宽的实证闸门，前置这层必须挡住） */
check('④ 叶红缨未破身 ⇒ 拒绝灼酒流炎穴成形',
  good(['灼酒流炎穴成形'], '她双腿摩擦，喷出酒香蜜露。', {}).length === 0,
  JSON.stringify(dropped(['灼酒流炎穴成形'], '她双腿摩擦，喷出酒香蜜露。', {})));
check('④ 叶红缨已破身 ⇒ 放行',
  good(['灼酒流炎穴成形'], '地核异变，灼酒流炎穴成形。', { 叶红缨处女丧失: true }).includes('灼酒流炎穴成形'));

/* ④b **同轮算数**（主人 2026-10-08 确认「肯定算」）：破身与成形常在同一场戏 */
check('④b 同轮 <破处> 簿里有慕容清歌 ⇒ 放行（同一场戏破身＋成形）',
  good(['清歌弦鸣穴成形'], '慕容清歌低呼一声，清歌弦鸣穴成形。', {}, [{ 持有者: '慕容清歌', 破处者: '赵无忧' }]).includes('清歌弦鸣穴成形'));
check('④b 同轮正文硬词兜底：正文写了孤月被破身 ⇒ 放行',
  good(['九幽玄阴穴成形'], '孤月被破了身，元阴初泄，九幽玄阴穴成形。', {}, []).includes('九幽玄阴穴成形'));

/* ⑤ 例外：烟霞灵乳不在前置表里（它没有「成形」这一步） */
check('⑤ 烟霞灵乳不在前置表（例外：出场即二境、占据者阎雷子）',
  MINGQI_PREREQ['烟霞灵乳成形'] === undefined);

/* ⑥ 覆盖度：12 个「X成形」字段全部在表里（烟霞灵乳除外） */
{
  const cheng = ALL_FIELDS.filter(f => /成形$/.test(f));
  const covered = cheng.filter(f => MINGQI_PREREQ[f]);
  const missing = cheng.filter(f => !MINGQI_PREREQ[f]);
  check('⑥ 全部「X成形」字段都已覆盖（' + covered.length + '/' + cheng.length + '）',
    missing.length === 0, '未覆盖：' + (missing.join('、') || '（无）'));
}

/* ⑦ 前置字段本身必须真实存在（不许指向不存在的字段名） */
{
  const bad = [];
  for (const [k, need] of Object.entries(MINGQI_PREREQ)) {
    for (const n of need) if (!ALL_FIELDS.includes(n)) bad.push(k + ' → ' + n);
  }
  check('⑦ 前置字段名全部真实存在于字段表', bad.length === 0, bad.join('；'));
}

const fails = results.filter(([, ok]) => !ok);
for (const [n, ok, note] of results) console.log((ok ? '✔' : '✘') + ' ' + n + (note ? '｜' + note : ''));
console.log('\n门禁：名器成形硬前置  ' + (results.length - fails.length) + ' 通过 / ' + fails.length + ' 失败');
process.exit(fails.length ? 1 : 0);
