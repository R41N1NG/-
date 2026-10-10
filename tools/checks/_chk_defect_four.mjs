/* 门禁：gpt 04 号「四条独立状态缺陷」的行为负例（离线真跑，不靠"代码里有没有那行字"）
 *
 * ① 原始里程碑先参与跳段     → 断言 validateAnchors 会把无依据申报判为不可用（旧行为直接进 knownAhead）
 * ② 普通首楼隐式继承写真     → 断言 detectInheritance 对「否定句 + 命中 2 个里程碑」返回 null；显式命令仍成立
 * ③ 证据过宽                 → 断言 anchorEvidenceIn 对空正文／裸地名／否定句判 false，对真实证据判 true
 * ④ 缺状态栏按 SEG_TIME 覆写 → 结构断言（该支已不含日期写入）＋ ②-b 的按段位补锚点已删
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', '卡片脚本', '状态机.js');
const code = fs.readFileSync(SRC, 'utf8');

function grabFn(name) {
  const m = new RegExp('function ' + name + '\\p{L}*\\(', 'u').exec(code) || new RegExp('async function ' + name + '\\(').exec(code);
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
  let d = 0, j = eq, started = false;
  for (; j < code.length; j++) {
    const c = code[j];
    if ('([{'.includes(c)) { d++; started = true; }
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
  grabConst('STAGE_MILESTONES'),
  grabConst('STAGE_STEPS'),
  grabConst('STAGE_BASE'),
  grabConst('CN_MAP'),
  grabConst('DEFLOWER_HARD_RES'),
  'const ALL_FIELDS = FIELD_TABLE.filter((f) => Boolean(f.name)).map((f) => f.name);',
  'const ANCHOR_KEYWORDS = Object.fromEntries(FIELD_TABLE.map((f) => [f.name, f.kws ?? []]));',
  grabFn('normalizeAnchorName'),
  grabFn('negatedAround'),
  grabFn('anchorEvidenceIn'),
  grabConst('MINGQI_PREREQ'),   /* 2026-10-08：validateAnchors 依赖它（名器成形硬前置） */
  grabConst('EVENT_ANCHOR_START'),
  grabFn('autoEventGate'),
  grabFn('validateAnchors'),
  grabFn('detectInheritance'),
].join('\n');

const M = new Function(src + '\nreturn { anchorEvidenceIn, validateAnchors, detectInheritance };')();
const { anchorEvidenceIn, validateAnchors, detectInheritance } = M;

const results = [];
const check = (name, cond, note = '') => results.push([name, !!cond, note]);

/* ③ 证据闸门 */
check('③ 空正文 fail-closed（旧行为：放行）', anchorEvidenceIn('', '兽潮血战').ok === false, anchorEvidenceIn('', '兽潮血战').why);
check('③ 裸地名不再放行「已抵达天溪」（旧式 /天溪/ 会中）', anchorEvidenceIn('他想起天溪城的旧事。', '已抵达天溪').ok === false, anchorEvidenceIn('他想起天溪城的旧事。', '已抵达天溪').why);
check('③ 「抵达天溪城」判 true', anchorEvidenceIn('赵无忧与叶红缨抵达天溪城，城门大开。', '已抵达天溪').ok === true, anchorEvidenceIn('赵无忧与叶红缨抵达天溪城，城门大开。', '已抵达天溪').why);
check('③ 「兽潮围城」判 true', anchorEvidenceIn('兽潮围城已有数日。', '兽潮血战').ok === true, anchorEvidenceIn('兽潮围城已有数日。', '兽潮血战').why);
check('③ 「天溪城恶战难免」不再是兽潮实证（旧式 /兽潮/ 才不会中，此项验新式仍不误放）', anchorEvidenceIn('此去天溪城，恶战难免。', '兽潮血战').ok === false, anchorEvidenceIn('此去天溪城，恶战难免。', '兽潮血战').why);
check('③ 否定句「我还没遇到兽潮血战」判 false', anchorEvidenceIn('本次开局不继承旧档，我还没遇到兽潮血战，也没有经历天溪城破。', '兽潮血战').ok === false, anchorEvidenceIn('本次开局不继承旧档，我还没遇到兽潮血战，也没有经历天溪城破。', '兽潮血战').why);
check('③ 否定句「也没有经历天溪城破」判 false', anchorEvidenceIn('本次开局不继承旧档，我还没遇到兽潮血战，也没有经历天溪城破。', '天溪城破').ok === false, anchorEvidenceIn('本次开局不继承旧档，我还没遇到兽潮血战，也没有经历天溪城破。', '天溪城破').why);
check('③ 真城破「城墙塌下，天溪城破了」判 true', anchorEvidenceIn('西南城墙轰然塌下，天溪城破了。', '天溪城破').ok === true, anchorEvidenceIn('西南城墙轰然塌下，天溪城破了。', '天溪城破').why);
check('③ 「坠入葬魔渊」判 true', anchorEvidenceIn('他被一掌拍落，坠入葬魔渊。', '进入葬魔渊').ok === true, anchorEvidenceIn('他被一掌拍落，坠入葬魔渊。', '进入葬魔渊').why);
check('③ 仅提「葬魔渊」地名判 false（旧式会中）', anchorEvidenceIn('葬魔渊之外一片迷雾。', '进入葬魔渊').ok === false, anchorEvidenceIn('葬魔渊之外一片迷雾。', '进入葬魔渊').why);

/* ① 校验后置 */
{
  const r = validateAnchors(['天溪城兽潮'], '庭院平静，无事发生。', 1);
  check('① 无依据申报不进已校验集合（旧行为会进 knownAhead 顶段位）', r.good.length === 0 && r.dropped.length === 1, JSON.stringify(r.dropped));
}
{
  const r = validateAnchors(['已抵达天溪'], '赵无忧抵达天溪城，城门大开。', 1);
  check('① 有依据申报进已校验集合', r.good.includes('已抵达天溪'), JSON.stringify(r.good));
}

/* ② 隐式继承不再写盘 */
{
  const denial = '本次开局不继承旧档，我还没遇到兽潮血战，也没有经历天溪城破。';
  const r = detectInheritance(denial, 1);
  check('② 普通首楼否定句不再被判成继承（旧行为：继承第 11 段并写真 5 项 known）', r === null, JSON.stringify(r));
}
{
  const r = detectInheritance('/继承 11', 1);
  check('② 显式命令「/继承 11」仍成立', r && r.isInherited === true && r.targetStage === 11, JSON.stringify(r && r.targetStage));
}
{
  const r = detectInheritance('【大总结】第 11 段：兽潮血战、天溪城破俱已发生。', 1);
  check('② 显式标识「【大总结】…第 11 段」仍成立', r && r.isInherited === true, JSON.stringify(r && r.targetStage));
}

/* ④ 结构断言（配 diff 交付） */
check('④ 缺状态栏分支已不含日期写入（SEG_TIME[segIdx] 与 baseT 均已删）', !code.includes('const baseT = SEG_TIME[segIdx]') && !code.includes('仙盟历: baseT'), '');
check('②-b 已删「按段位补 已抵达天溪」', !code.includes("if (targetStage >= 6) patchKnown['已抵达天溪'] = true;"), '');
check('①-c 段位推进已改用已校验集合并落 patch', (code.includes('patch.本轮已验证锚点 = 本轮校验.good') || code.includes('p.本轮已验证锚点 = 本轮校验.good')) && code.includes('for (const f of 本轮校验.good) knownAhead[f] = true;'), '');
check('②-b 继承锚点恢复已过 anchorEvidenceIn', code.includes("const ev = anchorEvidenceIn(summaryText, f);"), '');

const bad = results.filter(([, ok]) => !ok);
for (const [n, ok, note] of results) console.log((ok ? '✔' : '✘') + ' ' + n + (note ? '｜' + note : ''));
console.log('\n门禁：四条状态缺陷行为负例  ' + (results.length - bad.length) + ' 通过 / ' + bad.length + ' 失败');
process.exit(bad.length ? 1 : 0);
