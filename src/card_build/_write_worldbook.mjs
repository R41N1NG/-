#!/usr/bin/env node
/**
 * _write_worldbook.mjs —— 把**卡里那份完整世界书**（292 条，含 6 条【身份】）写成酒馆世界书文件
 *
 * 为什么从**卡 JSON** 取而不是从册子取（2026-09-29 深夜修正）：
 *   【身份】那 6 条是 `_build_card.js` 里直接建的、**不在册子里**；从册子生成会漏掉它们，
 *   而「按身份只开一条」正要靠它们。⇒ 以**卡**为源最保险（卡＝册 ＋ 身份条 ＋ 心智条 ＋ 分区分组标记）。
 *
 * 用法：node _write_worldbook.mjs [--apply]
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
const APPLY = process.argv.includes('--apply');
const CARD = 'E:\\角色卡制作\\仙姝堕\\仙姝墮-角色卡（全书群像）.json';
const OUTDIR = 'E:\\tavern\\SillyTavern\\data\\default-user\\worlds';
const NAME = '仙姝堕';
const OUT = OUTDIR + '\\' + NAME + '.json';

const card = JSON.parse(readFileSync(CARD, 'utf8'));
const cb = card.data?.character_book;
if (!cb || !Array.isArray(cb.entries) || !cb.entries.length) { console.error('✗ 卡里没有 character_book'); process.exit(2); }

/* character_book.entries（数组）→ 世界书文件 entries（映射）。逐字对齐 ST 的 convertCharacterBook。 */
const entries = {};
cb.entries.forEach((e, i) => {
  const ex = e.extensions || {};
  /* position：character_book 用 'before_char'/'after_char'，世界书文件用 0/1 */
  let pos = ex.position ?? e.position ?? 0;
  if (pos === 'after_char') pos = 1;
  else if (pos === 'before_char') pos = 0;
  const uid = (e.id !== undefined) ? e.id : i;
  entries[String(uid)] = {
    uid,
    key: Array.isArray(e.keys) ? e.keys : [],
    keysecondary: Array.isArray(e.secondary_keys) ? e.secondary_keys : [],
    comment: e.comment ?? e.name ?? '',
    content: e.content ?? '',
    constant: !!e.constant,
    vectorized: false,
    selective: e.selective ?? true,
    selectiveLogic: 0,
    addMemo: !!e.addMemo,
    order: e.insertion_order ?? e.order ?? 100,
    position: pos,
    disable: e.enabled === false,
    excludeRecursion: !!e.exclude_recursion,
    preventRecursion: !!e.prevent_recursion,
    delayUntilRecursion: e.delay_until_recursion ?? false,
    probability: e.probability ?? 100,
    useProbability: e.useProbability ?? true,
    depth: ex.depth ?? e.depth ?? 4,
    group: e.group ?? '',
    groupOverride: false,
    groupWeight: 100,
    scanDepth: null, caseSensitive: null, matchWholeWords: null, useGroupScoring: null,
    automationId: e.automation_id ?? '',
    role: e.role ?? null,
    sticky: e.sticky ?? null, cooldown: e.cooldown ?? null, delay: e.delay ?? null,
    displayIndex: ex.display_index ?? i,
  };
});
const data = { entries, originalData: cb };
const out = JSON.stringify(data, null, 4);
JSON.parse(out);

const es = Object.values(entries);
const ids = es.filter((e) => /^【身份】/.test(e.comment)).sort((a, b) => a.order - b.order);
console.log('卡内世界书：' + cb.entries.length + ' 条（启用 ' + es.filter((e) => !e.disable).length + '／停用 ' + es.filter((e) => e.disable).length + '）');
console.log('【身份】条目 ' + ids.length + ' 条 → ' + ids.map((e) => e.comment + (e.disable ? '(停)' : '(启)')).join('、'));
console.log('输出：' + OUT + '（' + out.length + ' 字节）');
if (!APPLY) { console.log('（预演，未写盘）'); process.exit(0); }
if (!existsSync(OUTDIR)) mkdirSync(OUTDIR, { recursive: true });
if (existsSync(OUT)) { copyFileSync(OUT, OUT + '.bak'); console.log('（旧文件已备份 ⇒ ' + NAME + '.json.bak）'); }
writeFileSync(OUT, out, 'utf8');
const LEGACY_OUT = OUTDIR + '\\仙姝墮 · 一张跑全书.json';
if (existsSync(LEGACY_OUT)) { copyFileSync(LEGACY_OUT, LEGACY_OUT + '.bak'); }
writeFileSync(LEGACY_OUT, out, 'utf8');
console.log('✅ 已写盘：' + OUT + ' 与兼容文件 ' + LEGACY_OUT);
