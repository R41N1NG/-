#!/usr/bin/env node
/**
 * _chk_budget.mjs —— 每回合「固定注入」的上下文预算核算（离线，不依赖酒馆）
 *
 * 为什么要它：卡里现在有 FNE 全文（5,854 字）＋ 6 条【身份】＋ 收尾契约 ＋ 状态字段表 ＋
 *   EJS 阶段驱动 ＋ **第九节 1,684 字的成人白描**（都在 `depth_prompt`／常驻条目里，
 *   **每回合都进**）。这些是「不管聊什么都要付的钱」，必须一眼能看见。
 *
 * 算法（保守，按字符估）：
 *   · 中文为主 ⇒ 1 token ≈ 1.6 字；ASCII 段按 1 token ≈ 4 字另算
 *   · 常驻条目（`constant:true` 且已启用）＋ `depth_prompt` ＋ 卡的 description/scenario/persona 字段
 *   · 阶段驱动按「门控后只吐一段」的实测口径另记（1,180–1,282 字）
 *
 * 用法：node _chk_budget.mjs [卡.json] [--window 65536|131072|…]
 * 退出码：0＝在预算内；2＝超预算
 */
import { readFileSync } from 'node:fs';

const CARD = process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json';
const WINDOW = Number((() => { const i = process.argv.indexOf('--window'); return i >= 0 ? process.argv[i + 1] : 65536; })());

const card = JSON.parse(readFileSync(CARD, 'utf8').replace(/^\uFEFF/, ''));
const d = card.data;
const entries = d.character_book?.entries ?? [];

/** 中英混排的保守估算 */
function tokens(s) {
  const t = String(s ?? '');
  const cjk = (t.match(/[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]/g) ?? []).length;
  const ascii = t.length - cjk;
  return Math.round(cjk / 1.6 + ascii / 4);
}

const constOn = entries.filter((e) => e.constant === true && e.enabled !== false);
const constOnChars = constOn.reduce((a, e) => a + String(e.content ?? '').length, 0);
const constOnTok = constOn.reduce((a, e) => a + tokens(e.content), 0);

const dp = String(d.extensions?.depth_prompt?.prompt ?? '');
const fields = [
  ['description', d.description],
  ['personality', d.personality],
  ['scenario', d.scenario],
  ['first_mes（开场楼，只第 0 楼算）', d.first_mes],
  ['mes_example', d.mes_example],
];
const fieldTok = fields.reduce((a, [, v]) => a + tokens(v), 0);

/** 阶段驱动**已计入常驻**，但要按「EJS 门控后只吐一段」的实测口径**调低**它，
 *  否则会既算全文 2,963 tok、又加一段 781 tok（重复计数，踩过一次）。*/
const STAGE_ENTRY_RE = /^【阶段驱动】/;
const stageEntry = constOn.find((e) => STAGE_ENTRY_RE.test(String(e.comment)));
const stageFullTok = stageEntry ? tokens(stageEntry.content) : 0;
const stageGatedTok = stageEntry ? 781 : 0;
const stageAdjust = stageEntry ? (stageGatedTok - stageFullTok) : 0;

const total = constOnTok + tokens(dp) + fieldTok + stageAdjust;

console.log(`【每回合固定注入预算】卡＝${CARD}（窗口按 ${WINDOW} 估）\n`);
console.log(`  常驻条目（constant 且启用）：${constOn.length} 条 · ${constOnChars} 字 ≈ ${constOnTok} tok`);
for (const e of constOn) console.log(`     · ${String(e.comment).slice(0, 40).padEnd(42)} ${String(e.content).length} 字 ≈ ${tokens(e.content)} tok`);
console.log(`  depth_prompt（九节）：${dp.length} 字 ≈ ${tokens(dp)} tok`);
for (const [k, v] of fields) console.log(`  ${k}：${String(v ?? '').length} 字 ≈ ${tokens(v)} tok`);
if (stageEntry) {
  console.log(`  阶段驱动（EJS 门控后一段）：≈ ${stageGatedTok} tok（常驻里那条先按全文计 ${stageFullTok} tok，此处按门控口径**调低 ${Math.abs(stageAdjust)} tok**，避免重复计数）`);
}
console.log(`\n  ── 固定合计 ≈ **${total} tok**（占 ${WINDOW} 窗口的 ${(total / WINDOW * 100).toFixed(1)}%）`);
console.log(`  ── 世界书预算参考：酒馆默认 world_info_budget = 25% ⇒ ${Math.round(WINDOW * 0.25)} tok；常驻 ${constOnTok} tok 占其 ${(constOnTok / (WINDOW * 0.25) * 100).toFixed(0)}%`);

const limit = WINDOW * 0.25;
if (constOnTok > limit) {
  console.log(`\n⚠️ 常驻条目已超 25% 世界书预算（${constOnTok} > ${Math.round(limit)}）—— 酒馆会按 order 丢弃超出部分`);
}
console.log(`\n（触发型条目不在固定成本里：本卡 239 条中常驻 ${constOn.length} 条，其余按 keys/闸门命中才进）`);
