#!/usr/bin/env node
/**
 * 心智姿态小引擎 · 进卡前核查
 *
 * 依据：`制卡规范 v2.0（统一版）` §9.5（每角色小引擎四行模板）＋ §12／附录 C 决议②，
 *       以及范例卡实测（68 条 × 370–509 字，全部 after_char / depth 1 / order 50、按人名触发）。
 *
 * 查什么：
 *   ① 五段齐全（角色定位／神韵灵魂底模／常态心智姿态／动机触动与破防退行／**执念**）
 *   ② 标签首尾闭合，且标签里的名字＝条目名
 *   ③ 常态段含**具体身体习惯**（可观察词命中 ≥2）
 *   ④ 破防段是「触发条件 → 变形表现」结构（含箭头或触发词）
 *   ⑤ 执念段**不绑玩家身份**（不出现 {{user}}／纯阳命格／修为绑定等）
 *   ⑥ 不写外貌（五官／胸／腰等描写词只在极低限度内）
 *   ⑦ 卡片禁用词（同 _final_check_card.js 的 BAN 表，排除纪律声明句）
 *   ⑧ 后期揭晓词（SPOIL_WORDS，与 _build_card.js 同名表）
 *   ⑨ keys 跨条冲突（同一条 keys 出现在两个角色 ⇒ 会同时注入）
 *   ⑩ 字数区间（范例卡 370–509；我们放 420–560）
 *
 * 用法：node _chk_mind_engine_card.mjs [_mind_engine_entries.json] [--card <卡.png|卡.json>]
 *   ── 加 `--card` 时做「进卡后复核」：直接从产物里读条目，逐条比对
 *      （comment／keys／position=after_char（字符串）＋ extensions.position=1／
 *       insertion_order=50／enabled／非恒常／正文逐字一致；同名身份的 3 条另查闸门行）。
 *      ⚠️ 2026-09-29 深夜改：原判据是「after_char＋extensions.position=4＋depth=1」（照范例卡），
 *         现按秋风 22:25 口径改成 CHAR 级 ---- 演绎类不许落 D1／D0。
 * 退出码：0 全通过 ／ 1 有失败项
 */
import { readFileSync } from 'node:fs';

const FILE = process.argv[2] ?? '_mind_engine_entries.json';
/** 源 16 条（进卡前后都用它做基准） */
const entries0 = JSON.parse(readFileSync(FILE, 'utf8'));

// ⚠️ 2026-09-29（主人裁定：「**B，执念才是对的**」）：第五段名 = **`执念:`**（原写「因由」，是子智能体产出的旧名）。
//    那一格的内容＝**卡内的「自我坚信」原词**（或加第三人称尾巴），仍受"不绑玩家身份"这条约束。
const SECTIONS = ['角色定位:', '神韵灵魂底模:', '常态心智姿态:', '动机触动与破防退行:', '执念:'];
const BODY_HABIT = ['先', '习惯', '重复', '每次', '总是', '食指', '指尖', '指腹', '掌心', '袖', '侧首', '停半拍', '抬头', '低头', '背对', '踱', '捻', '敲', '摩挲', '交叠', '站', '坐', '握', '揉'];
const APPEARANCE = ['容貌', '五官', '眉眼如画', '酥胸', '纤腰', '翘臀', '长发及腰', '肤若凝脂', '绝美的脸'];
const BAN = ['玄阳凤髓', '龙根', '凶器', '茎身', '阳器', '阳物', '阳根', '器物'];
const ALLOW_CTX = /禁用|不得|禁止|纪律|改写|纪律声明/;
const SPOIL = ['溟龙神女', '月奴', '欲凰神女', '孽莲神女', '惑心神女', '神女殿', '天姝榜', '奴种', '昨日欢', '邪心天目', '千心一欲', '邪欲凤翼', '拓印'];
const PRESET = [/\{\{user\}\}/, /\{\{char\}\}/, /纯阳命格/, /至阴之体/, /玩家(是|为)/, /你(应当|应该|必须)是/];
const MIN = 400, MAX = 600;

const fails = [];
const notes = [];
const keyMap = new Map();

for (const e of entries0) {
  const c = e.content;
  const inner = c.replace(/\s/g, '').length;
  const bare = c.trim().split('\n');
  const tag = bare[0];
  const nameInTag = (tag.match(/^<角色档案_[^_]+_(.+)_心智姿态>$/) ?? [])[1];
  const at = (s) => e.name + ' · ' + s;

  const miss = SECTIONS.filter((k) => !c.includes(k));
  if (miss.length) fails.push(at('缺段：' + miss.join('、')));

  if (nameInTag !== e.name) fails.push(at(`标签名不符（标签里是「${nameInTag}」）`));
  if (!bare[bare.length - 1].startsWith('</角色档案_')) fails.push(at('标签未闭合'));

  const habitHits = BODY_HABIT.filter((w) => c.includes(w)).length;
  if (habitHits < 2) fails.push(at(`常态段缺具体身体习惯（命中 ${habitHits} 个可观察词）`));

  const breakSec = c.split('动机触动与破防退行:')[1] ?? '';
  if (!/[，,。；].{0,40}(则|就|便|即|立刻|当场|转而|退行)/.test(breakSec)) {
    fails.push(at('破防段看不出「触发 → 变形」结构'));
  }

  const presetHit = PRESET.filter((re) => re.test(c)).map(String);
  if (presetHit.length) fails.push(at('绑了玩家身份：' + presetHit.join('、')));

  const appHit = APPEARANCE.filter((w) => c.includes(w));
  if (appHit.length) fails.push(at('写了外貌（应归公开层）：' + appHit.join('、')));

  for (const line of c.split('\n')) {
    for (const w of BAN) {
      if (line.includes(w) && !ALLOW_CTX.test(line)) fails.push(at(`禁用词「${w}」实质使用：${line.trim().slice(0, 50)}`));
    }
  }

  const spoilHit = SPOIL.filter((w) => c.includes(w));
  if (spoilHit.length) fails.push(at('正文含后期揭晓词（命中 _build_card.js 的 SPOIL_WORDS，会被自动停用）：' + spoilHit.join('、')));

  const keySpoil = e.keys.filter((k) => SPOIL.some((w) => k.includes(w)));
  if (keySpoil.length) fails.push(at('keys 含后期揭晓词（一被叫到就会注入标题）：' + keySpoil.join('、')));

  const keyShort = e.keys.filter((k) => k.trim().length < 2);
  if (keyShort.length) fails.push(at('keys 有过短触发词（易误触发）：' + JSON.stringify(keyShort)));

  const keyTag = (tag.match(/_心智姿态>$/) ? e.name : '');
  if (keyTag && !e.keys.includes(e.name)) fails.push(at('keys 里没有角色本名（无法按人名触发）'));

  if (inner < MIN || inner > MAX) fails.push(at(`字数 ${inner} 不在 ${MIN}–${MAX} 区间`));

  for (const k of e.keys) keyMap.set(k, [...(keyMap.get(k) ?? []), e.name]);
}

const shared = [...keyMap].filter(([, names]) => new Set(names).size > 1);
for (const [k, names] of shared) notes.push(`keys 冲突：「${k}」同时触发 ${[...new Set(names)].join('、')} —— 同现时会一起注入（成对角色可接受，需人工确认）`);

console.log(`【心智姿态核查】${FILE} —— ${entries0.length} 条`);
console.log('  四行/五段模板：' + (fails.length ? '❌' : '✅ 全通过'));
console.log('  keys 总数：' + keyMap.size + '（跨条共用 ' + shared.length + ' 个）');
if (notes.length) console.log('\n【提示】\n  ' + notes.join('\n  '));
if (fails.length) {
  console.log('\n【失败项】\n  ' + fails.join('\n  '));
  console.log(`\n结果：${fails.length} 项未过`);
  process.exit(1);
}
console.log('\n结果：✅ 全部通过（可进卡）');

/* ══════════ 进卡后复核（--card <卡.png|卡.json>）══════════ */
const cardArg = process.argv.includes('--card') ? process.argv[process.argv.indexOf('--card') + 1] : undefined;
if (cardArg) {
  const card = readCard(cardArg);
  const entries = card.data.character_book.entries;
  const mine = entries.filter((e) => /^【心智姿态】/.test(e.comment) || /\(心智姿态\)$/.test(e.comment || ''));
  const ALSO = new Set(['残阳老怪', '肉山佛', '九皇子']);
  const cardFails = [];
  if (mine.length !== entries0.length) cardFails.push(`卡内【心智姿态】条目 ${mine.length} 条，源 ${entries0.length} 条`);
  for (const e of mine) {
    const name = e.comment.replace(/^【心智姿态】/, '').replace(/（小引擎）$/, '');
    const s = entries0.find((x) => x.name === name);
    if (!s) { cardFails.push(`${name}：源里没有同名条目`); continue; }
    const gate = ALSO.has(name) ? `@@if (variables.stat_data?.身份 ?? '赵无忧') !== '${name}'\n` : '';
    if (JSON.stringify(e.keys) !== JSON.stringify(s.keys)) cardFails.push(`${name}：keys 与源不一致`);
    /* ⚠️ 2026-09-29 深夜定案（秋风 21:1x 第七／八条标准）：
     *   「角色资料 D3，角色资料心智模块 D1」⇒ 心智姿态＝角色自己的心智模块 ⇒ **at_depth / depth 1**。
     *   （21:02 那条「不许 D1／D0」只管全局演绎／导演规则，不覆盖角色心智模块。） */
    if (e.extensions?.position !== 4) cardFails.push(`${name}：不是 at_depth（extensions.position=${e.extensions?.position}）`);
    if (e.extensions?.depth !== 1) cardFails.push(`${name}：depth 不是 1（现 ${e.extensions?.depth}）`);
    if (e.insertion_order !== 50) cardFails.push(`${name}：order 不是 50`);
    if (e.enabled !== true) cardFails.push(`${name}：未启用`);
    if (e.constant !== false) cardFails.push(`${name}：成了恒常条目`);
    if (e.content !== gate + s.content) cardFails.push(`${name}：正文与源不逐字一致（或闸门行不符）`);
  }
  console.log(`\n【进卡复核】${cardArg}`);
  console.log('  卡内条目总数 ' + entries.length + '（启用 ' + entries.filter((e) => e.enabled !== false).length + '／停用 ' + entries.filter((e) => e.enabled === false).length + '）');
  console.log('  【心智姿态】' + mine.length + ' 条 ｜ 带身份闸门 ' + mine.filter((e) => e.content.startsWith('@@if')).length + ' 条');
  if (cardFails.length) {
    console.log('\n【进卡失败项】\n  ' + cardFails.join('\n  '));
    process.exit(1);
  }
  console.log(`  ✅ ${mine.length}/${entries0.length}：keys／after_char(1)／order 50／启用／非恒常／正文逐字一致（2026-09-29 起不再要求 depth 1）`);
}

function readCard(p) {
  if (p.toLowerCase().endsWith('.json')) return JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  // PNG：找 tEXt 块里的 chara（base64 字符串，与 _build_card_png.js 的写入口径一致）
  const buf = readFileSync(p);
  let off = 8;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.subarray(off + 4, off + 8).toString('ascii');
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'tEXt') {
      const zero = data.indexOf(0);
      if (data.subarray(0, zero).toString('latin1') === 'chara') {
        return JSON.parse(Buffer.from(data.subarray(zero + 1).toString('latin1'), 'base64').toString('utf8'));
      }
    }
    if (type === 'IEND') break;
    off += 12 + len;
  }
  throw new Error('PNG 里找不到 chara 块：' + p);
}
