#!/usr/bin/env node
/**
 * _verify_acceptance.mjs —— 真机验收自动核对（读酒馆聊天记录逐楼对账）
 *
 * 为什么能自动核：酒馆把**每一条消息的变量层快照**一起写进聊天 jsonl
 *   （`<该行>.variables["0"].stat_data` 就是「这一楼处理完之后」的 stat_data：
 *     `段位`／`仙盟历`／`仙盟历文`／`inventory`／`known`／`破处者`／`名器归属`／`纳戒账本`）。
 *   ⇒ GPT 要的「四场景真机验收」里，有三条可以在这里逐楼算出结论，不用人眼盯。
 *
 * 核的五件事：
 *   A 物品账：数量不许 ≤0、同 id 不许重复、**每楼的增减必须等于该楼账本**（抓重复入账与漏回滚）
 *   B 时钟照抄：状态栏 `<时间>` 是否照抄后台 `仙盟历文`（治「时间线卡死」的回归门禁）
 *   C 思维块：统计原文里带 `<think…>` 的楼（⚠️ jsonl 存的是**原文**，正则的效果只能看 console）
 *   D 成形抢跑：`X成形` 翻真的那一楼，必须同时有 `破处者[X]` 或 `X处女丧失`（治「口交就成形」的回归门禁）
 *   E 状态栏质量：字段齐缺、关系刻度假数值、在场子块是否用了旧字段 `<阶段>`
 *
 * 用法：node tools/checks/_verify_acceptance.mjs [聊天.jsonl]
 *   不给参数就用 `runtime.json`（若存在）里记的最近一条，或按目录里最新的聊天文件。
 * 退出码：0＝全过；1＝有 FAIL；2＝读不到聊天文件。
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CHAT_DIR = 'E:/tavern/SillyTavern/data/default-user/chats/仙姝堕';
const PANEL_FIELDS = ['时间', '历时', '地点', '天气', '环境', '在场', '暗处', '身份', '修为', '状态', '目标', '局势', '线索', '近闻', '远闻', '危机', '关系刻度', '进度'];
const FORM_ANCHORS = [
  ['九幽玄阴穴成形', '孤月'], ['灼酒流炎穴成形', '叶红缨'], ['心魔茶璎乳成形', '闻观语'], ['般若菩提菊成形', '楚灵夜'],
  ['北冥潮生穴成形', '雨霏柔'], ['玉虎噙香乳成形', '云织梦'], ['梅蕊穴成形', '花芷凝'], ['冰魄剑心穴成形', '苏倾寒'],
  ['清歌弦鸣穴成形', '慕容清歌'], ['流焰叠薪穴成形', '顾云舒'], ['凤凰羽花成形', '陆烬颜'],
];
/* 三条固定加物品规则 + 各身份默认行囊，允许它们不写进 `<纳戒>` 账本 */
const ITEM_WHITELIST = ['《极乐引》残篇', '冰心泪', '封元镇灵环', '醉春风', '墨山道佩剑', '随身青锋剑',
  '天姝令（焚欲）', '天姝令（欢喜）', '天姝令（浊龙）', '天姝令（魂欢）', '《燎原蛊火诀》', '《旖旎梵音心经》',
  '《极乐龙体诀》', '《情丝化灵录》', '《极乐引》', '积云檀木念珠', '真龙暗卫密符', '百毒百草囊'];

function pickChat(arg) {
  if (arg) return arg;
  if (!existsSync(CHAT_DIR)) return null;
  const files = readdirSync(CHAT_DIR).filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({ f: join(CHAT_DIR, f), t: statSync(join(CHAT_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files.length ? files[0].f : null;
}
const CHAT = pickChat(process.argv[2]);
if (!CHAT || !existsSync(CHAT)) { console.error('❌ 找不到聊天文件（可显式传入路径）'); process.exit(2); }

const lines = readFileSync(CHAT, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const tag = (t, n) => { const m = String(t).match(new RegExp('<' + n + '>([\\s\\S]*?)</' + n + '>')); return m ? m[1].trim() : null; };
/** 第 i 楼的变量快照（变量层键 `"0"` ＝ 聊天层；兼容数字键） */
const stateOf = (i) => {
  const v = lines[i] && lines[i].variables;
  if (!v) return null;
  const chat = v['0'] || v[0] || null;
  return chat && chat.stat_data ? chat.stat_data : null;
};
const invOf = (sd) => {
  const list = (sd && Array.isArray(sd.inventory)) ? sd.inventory : [];
  const m = new Map();
  for (const it of list) { if (it && it.name) m.set(String(it.name), Math.max(1, parseInt(it.count, 10) || 1)); }
  return m;
};

const rep = [];
let fail = 0;
const ck = (ok, msg, extra) => { rep.push(`${ok ? '✔' : '✘'} ${msg}${extra ? ' ｜ ' + extra : ''}`); if (!ok) fail += 1; };
const note = (s) => rep.push('   ' + s);
const sec = (t) => rep.push(`\n── ${t} ${'─'.repeat(Math.max(0, 56 - t.length))}`);

const aiFloors = [];
lines.forEach((l, i) => { if (i > 0 && !l.is_user && String(l.mes || '').trim()) aiFloors.push(i); });

rep.push(`聊天文件：${CHAT}`);
rep.push(`楼层：${lines.length}（AI 楼 ${aiFloors.length}）`);

/* ═══ A 物品账 ═══ */
sec('A 物品账（数量 / 唯一性 / 每楼增减＝该楼账本）');
{
  let bad = 0;
  const events = [];
  const resets = [];
  for (let k = 0; k < aiFloors.length; k += 1) {
    const i = aiFloors[k];
    const sd = stateOf(i);
    if (!sd) continue;
    /* ⚠️ 变量层的快照常常是**部分快照**（早期楼里可能压根没有 inventory / 身份 两个键）。
     *   只有真的带 `inventory` 数组的那一楼才当账算，否则一律跳过 —— 这是本节唯一的两处误报来源。 */
    if (!Array.isArray(sd.inventory)) continue;
    for (const it of sd.inventory) {
      const c = Math.max(1, parseInt(it && it.count, 10) || 1);
      const raw = it && it.count;
      if (raw !== undefined && (!(Number(raw) >= 1) || !Number.isInteger(Number(raw)))) {
        note(`✘ 第 ${i} 楼「${it.name}」数量 ${raw}（应为 ≥1 的整数）`); bad += 1;
      }
      void c;
    }
    const ids = (sd.inventory || []).map((x) => x && (x.id || x.name));
    if (new Set(ids).size !== ids.length) { note(`✘ 第 ${i} 楼出现重复物品（同 id 两条）`); bad += 1; }
    /* 找上一份**真带 inventory 的**快照 */
    let prevSd = null;
    for (let j = k - 1; j >= 0; j -= 1) { const s = stateOf(aiFloors[j]); if (s && Array.isArray(s.inventory)) { prevSd = s; break; } }
    if (!prevSd) continue;
    const cur = invOf(sd), prev = invOf(prevSd);
    const ledger = (sd.纳戒账本 && sd.纳戒账本[String(i)]) ? sd.纳戒账本[String(i)] : null;
    const names = new Set([...prev.keys(), ...cur.keys()]);
    const changed = [...names].filter((n) => (prev.get(n) || 0) !== (cur.get(n) || 0));
    /* 整组换过（>1 件同时变，且新集合都在白名单里）⇒ 这是换身份／初始化重置，不算账目异常 */
    const wholeReset = !ledger && changed.length > 1 && [...cur.keys()].every((n) => ITEM_WHITELIST.includes(n));
    if (wholeReset) { resets.push(`第 ${i} 楼行囊重置为：${[...cur.keys()].join('、')}`); continue; }
    for (const n of changed) {
      const a = prev.get(n) || 0, b = cur.get(n) || 0;
      const delta = b - a;
      events.push(`第 ${i} 楼 ${n} ${a}→${b}`);
      const said = ledger ? [...(ledger.消耗 || []).filter((x) => x.name === n).map((x) => -x.count),
        ...(ledger.获得 || []).filter((x) => x.name === n).map((x) => x.count)] : [];
      const saidSum = said.reduce((s, x) => s + x, 0);
      const whitelisted = ITEM_WHITELIST.includes(n) && b > 0 && a === 0;   // 起手／固定规则补的物品
      if (!ledger && !whitelisted) { note(`✘ 第 ${i} 楼「${n}」${a}→${b}，但这一楼没有纳戒账（可能凭空增减）`); bad += 1; continue; }
      if (ledger && saidSum !== delta) {
        note(`✘ 第 ${i} 楼「${n}」实际 ${a}→${b}（差 ${delta}），账本记的是 ${saidSum}（${JSON.stringify(said)}）`);
        bad += 1;
      }
    }
  }
  ck(bad === 0, `物品账无异常（检查 ${aiFloors.length} 楼）`, bad ? `${bad} 处不符` : '');
  if (resets.length) { note('行囊重置（换身份／初始化，不算异常）：'); resets.slice(0, 6).forEach((r) => note('  · ' + r)); }
  if (events.length) { note('物品变动流水：'); events.slice(0, 20).forEach((e) => note('  · ' + e)); if (events.length > 20) note(`  · …共 ${events.length} 条`); }
  else note('本局没有任何物品增减（起手行囊之外没动过）');
}

/* ═══ B 时钟照抄 ═══ */
sec('B 时钟照抄（状态栏 <时间> vs 后台 仙盟历文）');
{
  const YEAR = /(\d{3,4})\s*年/;
  const MON = /(正月|冬月|腊月|闰?[一二三四五六七八九十]{1,2}月)/;
  let total = 0, ok = 0;
  const mism = [];
  for (const i of aiFloors) {
    const sd = stateOf(i);
    if (!sd) continue;
    const behind = String(sd.仙盟历文 || (sd.仙盟历 !== undefined ? sd.仙盟历 : '')).trim();
    if (!behind) continue;
    const wrote = tag(lines[i].mes, '时间') || '';
    if (!wrote) continue;
    total += 1;
    const by = YEAR.exec(behind), bm = MON.exec(behind);
    const wy = YEAR.exec(wrote), wm = MON.exec(wrote);
    const same = (!by || !wy || by[1] === wy[1]) && (!bm || !wm || bm[1] === wm[1]);
    if (same) ok += 1; else mism.push(`第 ${i} 楼：后台「${behind}」／状态栏「${wrote.slice(0, 40)}」`);
  }
  if (!total) { note('（本局没有任何楼层能拿到后台仙盟历 ⇒ 无法判定；确认卡是 2026-10-06 深夜之后那一版）'); }
  else {
    const rate = (ok / total) * 100;
    ck(rate >= 90, `照抄率 ${rate.toFixed(0)}%（${ok}/${total} 楼与后台一致）`, '阈值 90%');
    mism.slice(0, 10).forEach((m) => note('  · ' + m));
    if (mism.length > 10) note(`  · …共 ${mism.length} 处不一致`);
  }
}

/* ═══ C 思维块 ═══ */
sec('C 思维块（原文统计；正则效果只能看 console）');
{
  let withTag = 0, closed = 0;
  for (const i of aiFloors) {
    const t = String(lines[i].mes || '');
    if (/<think[\w~-]*>/i.test(t)) { withTag += 1; if (/<\/think[\w~-]*>/i.test(t)) closed += 1; }
  }
  note(`带思考块的 AI 楼：${withTag}/${aiFloors.length}（其中闭合 ${closed}）`);
  note('⚠️ jsonl 存的是**原文**，正则只在「发送给模型的提示词」里生效 ⇒ 这条要看 console（见验收方案第 3 节）。');
}

/* ═══ D 成形抢跑 ═══ */
sec('D 成形抢跑（X成形翻真的那一楼必须带破身证据）');
{
  const runaway = [];
  let seenTrue = new Set();
  for (const i of aiFloors) {
    const sd = stateOf(i);
    /* 同样只认**真带 known 对象**的那一楼（变量层常有部分快照） */
    if (!sd || !sd.known || typeof sd.known !== 'object') continue;
    const kn = sd.known;
    const book = sd.破处者 || {};
    for (const [anchor, holder] of FORM_ANCHORS) {
      if (kn[anchor] !== true || seenTrue.has(anchor)) continue;
      seenTrue.add(anchor);
      const byBook = Boolean(book[holder]);
      const byAnchor = kn[holder + '处女丧失'] === true;
      if (!byBook && !byAnchor) {
        const ph = tag(lines[i].mes, '破处');
        runaway.push(`第 ${i} 楼「${anchor}」翻真，但破处簿与「${holder}处女丧失」都没有（本楼 <破处>=${ph === null ? '（没写）' : ph}）`);
      }
    }
  }
  ck(runaway.length === 0, `成形锚点全部带证据翻真（本局翻真 ${seenTrue.size} 个）`);
  runaway.forEach((r) => note('  · ' + r));
}

/* ═══ E 状态栏质量 ═══ */
sec('E 状态栏质量');
{
  const miss = [], fake = [], oldField = [];
  for (const i of aiFloors) {
    const t = lines[i].mes || '';
    for (const f of PANEL_FIELDS) if (tag(t, f) === null) miss.push(`第 ${i} 楼缺 <${f}>`);
    const rel = tag(t, '关系刻度') || '';
    if (/[+＋]\d/.test(rel)) fake.push(`第 ${i} 楼：${rel.slice(0, 50)}`);
    if (/<阶段>/.test(t)) oldField.push(i);
  }
  ck(miss.length === 0, `状态栏字段齐全（${aiFloors.length} 楼）`, miss.slice(0, 5).join('；'));
  ck(fake.length === 0, '关系刻度没有 ±N 假数值', fake.slice(0, 3).join('；'));
  ck(oldField.length === 0, '在场子块没有用旧字段 <阶段>', oldField.join('、'));
}

console.log(rep.join('\n'));
console.log(`\n${fail === 0 ? '✅ 自动核对全过' : '❌ ' + fail + ' 项未过'}（本脚本只核「能从聊天记录算出来」的部分；思维块与提示词实际内容要看 console）`);
process.exit(fail === 0 ? 0 : 1);
