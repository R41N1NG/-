#!/usr/bin/env node
/**
 * _chk_mind_engine_leak.mjs —— 「心智姿态」16 条的信息边界体检（离线）
 *
 * 起因（**主动发现的隐患**）：这 16 条是**按人名触发**的，**没有任何闸门** —— 玩家在第二楼提到
 *   「楚灵夜」，她的条目就会进上下文。可是小引擎的「破防退行／因由」是照**她整条人物弧线**写的，
 *   可能把**后期才揭晓**的东西带进来（阶段名、外相、归属、结局、某个锚点事件已经发生的口吻）。
 *
 * 本脚本按三级判据扫描，**只报告不改文件**（改动要人拍板；铁律 25）：
 *   🔴 高危：命中了卡片既有的 SPOIL_WORDS／名器阶段名／人批锚点的**结果词**
 *   🟡 待审：出现「后期／最终／结局／沦为／堕落／被擒／奴／封／镇」等**时点词**，
 *            或名器/称号词 —— 需要人读一遍上下文判断是不是「对时点的自然描述」
 *   🟢 提示：出现 { 她／他 } 之外的第二人称（`你`）—— 因由段本该只写动机
 *
 * 用法：node _chk_mind_engine_leak.mjs [条目.json] [--verbose]
 * 退出码：0＝无高危；2＝有高危
 */
import { readFileSync } from 'node:fs';

const FILE = process.argv[2] ?? '_mind_engine_entries.json';
const VERBOSE = process.argv.includes('--verbose');
const entries = JSON.parse(readFileSync(FILE, 'utf8'));

/* 与 _build_card.js 的 SPOIL_WORDS 同名表 */
const SPOIL = ['溟龙神女', '月奴', '欲凰神女', '孽莲神女', '惑心神女', '神女殿', '天姝榜', '奴种', '昨日欢', '邪心天目', '千心一欲', '邪欲凤翼', '拓印'];
/* 名器阶段名与外相（进了「心智姿态」就是提前抖外相）
 * ⚠️ 必须走**词边界**：`极乐` 是阶段名，但 `极乐楼`（残阳老怪的出身门派）与
 *    `极乐慈悲掌`（肉山佛的功法）都不是 —— 裸 `includes('极乐')` 会误报这两条（踩过）。 */
const STAGE = ['落红', '情动', '沉沦', '极乐', '一阶段', '二阶段', '三阶段', '四阶段'];
// ⚠️ 2026-09-29 补：专名一律放行（之前漏了「极乐龙体诀／极乐慈悲／极乐老人」这几处 ⇒ 误报 🔴）
const STAGE_ALLOW = ['极乐楼', '极乐慈悲掌', '极乐慈悲', '极乐太子', '极乐老人', '极乐引', '极乐净土', '极乐龙体诀', '极乐宝典', '极乐真谛', '极乐合欢散', '极乐合欢', '极乐化身', '极乐楼余孽'];
/* 人批锚点（这 7 个只能玩家 /解锁 翻开；小引擎里出现结果词＝越界） */
const HUMAN_ANCHORS = ['玄机子胁迫过叶红缨', '红缨分裂成形', '封元镇灵环', '灼酒流炎穴成形', '雀奴身份成立', '孤月失守', '双线并置'];
/* 时点词：出现在「已发生」的口吻里就是剧透 */
const TIME_WORDS = ['后期', '最终', '结局', '沦为', '堕落', '被擒', '成奴', '奴籍', '封元', '镇灵', '失守', '沦陷', '收为', '改造成', '调教成'];
/* 第三人称外的称呼 */
const SECOND_PERSON = /(你|您|玩家|user)/;

const rows = [];
for (const e of entries) {
  const c = String(e.content ?? '');
  const high = [];
  const mid = [];
  const low = [];

  for (const w of SPOIL) if (c.includes(w)) high.push(`揭晓词「${w}」`);
  for (const w of STAGE) {
    for (const m of c.matchAll(new RegExp(w, 'g'))) {
      const around = c.slice(m.index, m.index + Math.max(...STAGE_ALLOW.map((x) => x.length)));
      if (STAGE_ALLOW.some((x) => around.startsWith(x))) continue;   // 是「极乐楼」这类专名 ⇒ 不算阶段词
      high.push(`名器阶段词「${w}」（裸用）`);
      break;
    }
  }
  for (const w of HUMAN_ANCHORS) if (c.includes(w)) high.push(`人批锚点「${w}」`);
  for (const w of TIME_WORDS) if (c.includes(w)) mid.push(`时点词「${w}」`);
  if (SECOND_PERSON.test(c)) low.push('出现第二人称（因由段应只写动机）');

  /* 逐条给出上下文片段，便于人一眼判断 */
  const ctx = (w) => {
    const i = c.indexOf(w);
    return i < 0 ? '' : '…' + c.slice(Math.max(0, i - 24), i + w.length + 24).replace(/\n/g, ' ') + '…';
  };

  rows.push({ name: e.name, high, mid, low, ctx: [...high, ...mid].map((s) => s + ' ' + ctx(s.replace(/^.*「|」$/g, ''))) });
}

const withHigh = rows.filter((r) => r.high.length);
const withMid = rows.filter((r) => r.mid.length && !r.high.length);

console.log(`【心智姿态 · 信息边界体检】${FILE} —— ${entries.length} 条\n`);
console.log(`  🔴 高危 ${withHigh.length} 条 ｜ 🟡 待审 ${withMid.length} 条 ｜ 🟢 其余 ${entries.length - withHigh.length - withMid.length} 条\n`);

for (const r of withHigh) {
  console.log(`🔴 ${r.name}：${r.high.join('；')}`);
  if (VERBOSE) for (const s of r.ctx) console.log('      ' + s);
}
if (withHigh.length) console.log('');
for (const r of withMid) {
  console.log(`🟡 ${r.name}：${r.mid.join('；')}`);
  if (VERBOSE) for (const s of r.ctx) console.log('      ' + s);
}

const lowNames = rows.filter((r) => r.low.length).map((r) => r.name);
if (lowNames.length) console.log(`\n🟢 出现第二人称（可接受，仅提示）：${lowNames.join('、')}`);

console.log('\n判读口径：🔴 一出现就是越界（这些词只在后期揭晓，或属玩家才能翻的锚点）；');
console.log('           🟡 要看上下文 —— 「她最终会…」是剧透，「她不信最终解释」不是。逐条读再定。');
if (withHigh.length) process.exit(2);
console.log('\n✅ 无高危命中。');
