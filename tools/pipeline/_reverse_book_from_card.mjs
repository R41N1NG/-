#!/usr/bin/env node
/**
 * _tmp_reverse_book.mjs —— 反解（只读真卡；读/写路径全部指到临时文件）
 *   ① 卡产物 232 条 → 按册子字段名映射 → 临时册子
 *   ② 复制 _build_card.js 并只改「读哪个册子」「写到哪个卡」
 *   ③ 反复跑，直到产物 comment 多重集与真卡**完全一致**（多 0、少 0）
 *   ④ --final：把收敛后的册子落到 `仙姝墮-世界书.json`，并把 _build_card.js 第 12 行指过去，真跑一次验证
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const CARD = D + '仙姝墮-角色卡（全书群像）.json';
const TMP_BOOK = D + '_tmp_book.json';
const TMP_BUILD = D + '_tmp_build_test.js';
const TMP_CARD = D + '_tmp_card_out.json';
const FINAL_BOOK = D + '仙姝墮-世界书.json';
const node = process.execPath;
const FINAL = process.argv.includes('--final');

const realCard = JSON.parse(readFileSync(CARD, 'utf8'));
const realEntries = Object.values(realCard.data.character_book.entries);
const realComments = realEntries.map((e) => e.comment);

const toBook = (list) => {
  const b = { entries: {} };
  list.forEach((e, i) => {
    b.entries[String(i)] = {
      uid: i,
      key: e.keys || [],
      keysecondary: e.secondary_keys || [],
      comment: e.comment,
      content: e.content,
      constant: e.constant === true,
      selective: e.selective !== false,
      order: e.insertion_order,
      position: e.extensions?.position ?? (e.position === 'at_depth' ? 4 : 0),
      disable: e.enabled === false,
      depth: e.extensions?.depth ?? 4,
      selectiveLogic: e.extensions?.selectiveLogic ?? 0,
      scanDepth: e.extensions?.scan_depth ?? null,
    };
  });
  return b;
};

const cnt = (arr) => arr.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});
const rc = cnt(realComments);

function writePatchedBuild() {
  let b = readFileSync(D + '_build_card.js', 'utf8');
  const before = b;
  b = b.replace(`'仙姝墮-世界书.json'`, `'_tmp_book.json'`);
  b = b.replace(`const outJson = path.join(DIR, '仙姝墮-角色卡（全书群像）.json');`, `const outJson = path.join(DIR, '_tmp_card_out.json');`);
  if (b === before) throw new Error('路径替换没命中');
  writeFileSync(TMP_BUILD, b, 'utf8');
}

function runTemp(bookList, label) {
  writeFileSync(TMP_BOOK, JSON.stringify(toBook(bookList), null, 2), 'utf8');
  writePatchedBuild();
  if (existsSync(TMP_CARD)) unlinkSync(TMP_CARD);
  const r = spawnSync(node, [TMP_BUILD], { cwd: D, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const counted = /character_book entries: (\d+)/.exec(out);
  if (!existsSync(TMP_CARD)) {
    console.log(`  [${label}] 没产出临时卡，返回码 ${r.status}；关键行：`);
    out.split('\n').filter((l) => /❌|Error|entries/.test(l)).slice(0, 6).forEach((l) => console.log('     ' + l.trim().slice(0, 140)));
    return null;
  }
  const made = Object.values(JSON.parse(readFileSync(TMP_CARD, 'utf8')).data.character_book.entries).map((e) => e.comment);
  const mc = cnt(made);
  const extra = Object.keys(mc).filter((k) => (mc[k] || 0) > (rc[k] || 0));
  const missing = Object.keys(rc).filter((k) => (mc[k] || 0) < (rc[k] || 0));
  console.log(`  [${label}] 册子 ${bookList.length} 条 → 产物 ${made.length} 条（真卡 ${realComments.length}）｜多 ${extra.length}、少 ${missing.length}`);
  if (extra.length) console.log('     多：' + extra.slice(0, 40).map((x) => x.replace(/━/g, '').trim()).join(' ｜ '));
  if (missing.length) console.log('     少：' + missing.slice(0, 40).map((x) => x.replace(/━/g, '').trim()).join(' ｜ '));
  return { made, extra, missing, list: bookList };
}

console.log('① 起始：把卡内 232 条原样喂回去');
let cur = realEntries.slice();
let res = runTemp(cur, 'round1');
if (!res) process.exit(2);

/* 迭代：把「多出来的标题」和「真卡里那批生成用的分区标记」从册子里剔掉 */
for (let round = 2; round <= 5 && res.extra.length; round++) {
  const dropTitles = new Set(res.extra.filter((t) => realComments.includes(t)));
  // 分区标记（真卡里那份，构建会自己再生成一份）
  for (const t of realComments) if (/^━+/.test(t) && /【卡·运行规则】/.test(t)) dropTitles.add(t);
  cur = cur.filter((e) => !dropTitles.has(e.comment));
  console.log(`② round${round}：再剔 ${dropTitles.size} 个标题`);
  res = runTemp(cur, 'round' + round);
  if (!res) process.exit(2);
}
const done = res.extra.length === 0 && res.missing.length === 0;
console.log(done ? '\n✅ 收敛：构造出的卡与真卡 comment 表**完全一致**（' + res.made.length + ' 条）' : '\n⚠️ 还没完全一致，见上');

if (done && FINAL) {
  writeFileSync(FINAL_BOOK, JSON.stringify(toBook(cur), null, 2), 'utf8');
  console.log('\n③ 册子已落盘：' + FINAL_BOOK + '（' + cur.length + ' 条）');
  let b = readFileSync(D + '_build_card.js', 'utf8');
  const patched = b.replace(`'仙姝墮-世界书.json'`, `'仙姝墮-世界书.json'`);
  if (patched === b) { console.log('   ⚠️ _build_card.js 第 12 行替换没命中'); } else {
    copyFileSync(D + '_build_card.js', D + '_build_card.js.before-reverse');
    writeFileSync(D + '_build_card.js', patched, 'utf8');
    console.log('   ✅ _build_card.js 已指向 `仙姝墮-世界书.json`（原文存 `_build_card.js.before-reverse`）');
  }
  for (const f of [TMP_BOOK, TMP_BUILD, TMP_CARD]) { try { unlinkSync(f); } catch { /* ignore */ } }
  console.log('   临时文件已清');
}
for (const f of [TMP_BOOK, TMP_BUILD]) { try { unlinkSync(f); } catch { /* ignore */ } }
