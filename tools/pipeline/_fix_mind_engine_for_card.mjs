#!/usr/bin/env node
/**
 * 心智姿态 16 条 · 进卡前修补
 *
 * 依据 `_chk_mind_engine_card.mjs` 的失败项与提示，做三件事：
 *   ① 禁用词：`器物` → `陈设`（卡片禁用词表，见 `_final_check_card.js` BAN）
 *   ② 后期揭晓称号：把 `角色定位` 行里的 __神女／昨日欢 这类**后期才揭晓的称号**去掉 ——
 *      它们会命中 `_build_card.js` 的 SPOIL_WORDS，导致整条被自动停用（人物就演扁了）；
 *      去掉称号只减信息、不减语义，且与「名器内容归【名器】条」的纪律一致。
 *      每条改写都记进该条的 `markers`，便于人工审。
 *   ③ 给每条补 `note`（改写记录），不动正文其它一字。
 *
 * 幂等：重复跑不会有第二次改动。
 * 用法：node _fix_mind_engine_for_card.mjs [--apply]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const FILE = '_mind_engine_entries.json';
const entries = JSON.parse(readFileSync(FILE, 'utf8'));

/** 后期揭晓词（＝ `_build_card.js` 的 SPOIL_WORDS）：正文与 keys 都要清） */
const SPOIL_KEYS = ['溟龙神女', '月奴', '欲凰神女', '孽莲神女', '惑心神女', '神女殿', '天姝榜', '奴种', '昨日欢', '邪心天目', '千心一欲', '邪欲凤翼', '拓印'];

/** 角色定位行：后期揭晓称号 → 中性表述（整段切除） * ⚠️ 一律「切整段」，不做子串替换 —— 子串替换会留下「掌千欲枢机者·掌千欲枢机」这种重复。
 * ⚠️ 定位行里的两个分隔符是 ` ／ `（组间·全角斜杠）与 ` · `（组内·中点），
 *    切除组间段后要把**紧随其后的那个 ` · `** 一起吃掉，否则会留下「· 元婴期」这种断头分隔符。
 *    删除后的分隔符位置**不重排**（信息不变、只减信息），保持与其它条目一致的观感。 */
const TITLE_FIX = [
  ['，天姝会掌千欲枢机者 ', ''],
  ['／ 天姝会惑心神女·掌千欲枢机 · ', ''],
  ['／ 天姝会掌千欲枢机者 · ', ''],
  ['／ 天姝会溟龙神女 · ', ''],
  ['／ 天姝会欲凰神女 · ', ''],
  ['／ 天姝会孽莲神女 · ', ''],
  ['／ 天姝会魂欢殿殿主·鬼医病相思 · ', ''],
  ['／ 天姝会魂欢殿殿主 · ', ''],
  ['／ 天姝会浊龙殿殿主 · ', ''],
  ['／ 天姝会焚欲殿殿主 · ', ''],
  ['／ 天姝会欢喜殿主 · ', ''],
  [' · 化神期·昨日欢道韵与蛇姬法相', ' 化神期·蛇姬法相与道韵'],
];

const changes = [];
const KI = SPOIL_KEYS;
for (const e of entries) {
  const bodyBefore = e.content;
  const keysBefore = e.keys;
  const lines = bodyBefore.split('\n');
  const idx = lines.findIndex((l) => l.includes('角色定位:'));
  const removed = [];

  // ① 触发词里的后期揭晓称号也要摘掉（条目正文删了、keys 还留着 ⇒ 一被叫到就注入标题）
  e.keys = e.keys.filter((k) => !KI.some((w) => k.includes(w)));
  if (e.keys.length !== keysBefore.length) {
    removed.push(`去 keys 里的后期揭晓词：${keysBefore.filter((k) => !e.keys.includes(k)).join('、')}`);
  }

  // ① 后期揭晓称号：只改「角色定位」行
  if (idx >= 0) {
    const before = lines[idx];
    let line = before;
    for (const [from, to] of TITLE_FIX) line = line.split(from).join(to);
    // 收拾切除后残留的分隔符：把后续 ` · `（前一组用的那个 `·`）降级成一个空格
    line = line.replace(/ · /g, ' ').replace(/· /g, ' ').replace(/ {2,}/g, ' ');
    if (line !== before) {
      lines[idx] = line;
      removed.push(`去后期称号：${before.trim().slice(0, 72)} ⇒ ${line.trim().slice(0, 72)}`);
    }
  }
  let body = lines.join('\n');

  // ② 禁用词：全条扫一遍（`器物` → `陈设`）
  if (body.includes('器物')) {
    body = body.split('器物').join('陈设');
    removed.push('禁用词 器物→陈设');
  }

  /* ③ 共用触发词拆解（2026-09-28，主人拍板「互斥」）：
   *    苏瑶／苏玲原本共用 `听雪双姝` ⇒ 提一次这个词就**两条一起注入**（约 1.1k tok 白付）。
   *    改成「互相把对方的本名／昵称收进 keys」——她们是成对人物、条目里本来就互相指涉，
   *    但**只有在正文真的提到对方时才带进来**，不再被一个泛称一网打尽。 */
  const TWIN_SWAP = {
    苏瑶: ['苏玲', '玲儿'],
    苏玲: ['苏瑶', '瑶儿'],
  };
  if (TWIN_SWAP[e.name]) {
    const had = e.keys.includes('听雪双姝');
    if (had) e.keys = e.keys.filter((k) => k !== '听雪双姝');
    const add = TWIN_SWAP[e.name].filter((k) => !e.keys.includes(k));
    e.keys = [...e.keys, ...add];
    if (had || add.length) removed.push(`共用词拆解：去「听雪双姝」＋补 ${add.join('、')}`);
  }

  if (body !== bodyBefore) e.content = body;
  if (removed.length) {
    e.markers = [...(e.markers ?? []), ...removed];
    changes.push({ 条: e.name, 改动: removed });
  }
}

console.log(JSON.stringify({ 文件: FILE, 改动条数: changes.length, changes }, null, 2));
if (!APPLY) {
  console.log('\n（预演模式 —— 加 --apply 才写入）');
  process.exit(0);
}
writeFileSync(FILE, JSON.stringify(entries, null, 2) + '\n', 'utf8');
console.log('\n✅ 已写入 ' + FILE);
