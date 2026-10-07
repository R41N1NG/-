/**
 * _clean_cards.mjs —— 收摊：卡只留一张、孤儿聊天目录搬回来、卡的备份目录只留一个
 *
 * 用户 2026-09-27 定的规矩（铁律 20）：
 *   「以后生成新卡的时候，记得删掉旧卡，备份也只备份一个，更早的都删掉。」
 *
 * 依据（酒馆服务端源码，`src/endpoints/chats.js:443/467/562/840`）：
 *   聊天目录名 = **avatar 文件名去掉 .png** ⇒ 同名卡副本（`…1.png`／`…2.png`）各自带一个聊天目录，
 *   直接删掉副本会让那些聊天在界面上消失。所以先**把里面的 jsonl 搬回规范名的目录**，再删副本。
 *
 * 用法：node _clean_cards.mjs [--apply]
 */
import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const say = console.log;
const TAV = 'E:/tavern/SillyTavern/data/default-user';
const CHAR = TAV + '/characters';
const CHATS = TAV + '/chats';
const WORLDS = TAV + '/worlds';
const BOOK = 'E:/角色卡制作/仙姝堕';
const BKROOT = 'E:/火狐下载/_酒馆备份_20260922';

const CANON = '仙姝墮 · 一张跑全书.png';              // 规范卡名（唯一保留）
const KEEP_BK = '备份_最新';                          // 唯一保留的备份目录
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

let moved = 0, delCards = 0, delDirs = 0, delBk = 0;

/* ---------- 1) 同名卡：只留规范名 ---------- */
const cards = fs.readdirSync(CHAR).filter((f) => f.includes('仙姝') && f.endsWith('.png'));
say('=== 同名卡 ===');
for (const f of cards.sort()) say(`  ${f === CANON ? '保留' : '待删'}  ${f}`);
const canonChatDir = path.join(CHATS, CANON.replace('.png', ''));
for (const f of cards) {
  if (f === CANON) continue;
  const dir = path.join(CHATS, f.replace('.png', ''));
  if (fs.existsSync(dir)) {
    fs.mkdirSync(canonChatDir, { recursive: true });
    for (const file of fs.readdirSync(dir)) {
      const src = path.join(dir, file), dst = path.join(canonChatDir, file);
      if (fs.existsSync(dst)) { say(`  ⚠️ 目标已有同名聊天，跳过：${file}`); continue; }
      say(`  搬聊天 ${f.replace('.png', '')} / ${file} → ${CANON.replace('.png', '')}/`);
      moved++;
      if (APPLY) fs.renameSync(src, dst);
    }
    if (APPLY) { const rest = fs.readdirSync(dir); if (!rest.length) { fs.rmdirSync(dir); delDirs++; } }
  }
  delCards++;
  if (APPLY) fs.unlinkSync(path.join(CHAR, f));
}

/* ---------- 2) 备份目录：只留一个 ---------- */
say('\n=== 备份目录 ===');
const bkDirs = fs.readdirSync(BKROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const keepBk = path.join(BKROOT, KEEP_BK);
for (const d of bkDirs) {
  const full = path.join(BKROOT, d);
  const size = fs.readdirSync(full, { recursive: true }).length;
  if (d === KEEP_BK) { say(`  ${d}  ← 保留（本脚本要求的唯一备份目录）`); continue; }
  // 与卡无关的功能性小备份留着（交接说明 6.2 明确引用过），其余一律删
  const KEEP_FEATURE = ['阶段切换插件_删除前', '世界书阶段切换_删除前版本'];
  if (KEEP_FEATURE.includes(d)) { say(`  ${d}  ← 保留（功能性回退材料，非卡备份）`); continue; }
  say(`  删 ${d}/  （${size} 个文件）`);
  delBk++;
  if (APPLY) fs.rmSync(full, { recursive: true, force: true });
}
if (APPLY) {
  fs.mkdirSync(keepBk, { recursive: true });
  const put = [
    [CHAR + '/' + CANON, KEEP_BK + '/' + CANON],
    // ⚠️ 2026-10-01 主人令：**世界书一律以 PNG 角色卡为准，不再单独留备份、不再分前期/后期**
    //    （独立世界书由 `_push_card.mjs` 每次从卡内自动重建；三行旧保留项已删，防止污染）
    [BOOK + '/仙姝墮-角色卡（全书群像）.json', KEEP_BK + '/卡源文件.json'],
    [BOOK + '/卡片脚本/MVU状态机.js', KEEP_BK + '/MVU状态机.js'],
    [BOOK + '/卡片脚本/状态栏面板.js', KEEP_BK + '/状态栏面板.js'],
    // ⚠️ 词库是卡内那 61 条名器条目的**唯一真源**（`_build_card.js` 从它展开），必须一起备
    ['E:/火狐下载/酒馆插件-名器阶段注入/mingqi-db.js', KEEP_BK + '/名器词库_mingqi-db.js'],
  ];
  for (const [a, b] of put) { if (fs.existsSync(a)) fs.copyFileSync(a, path.join(BKROOT, b)); }
  say(`  → ${KEEP_BK}/ 已刷新（卡 ＋ 卡源文件 ＋ 两个卡内脚本 ＋ 名器词库；**世界书不备份**，以卡为准）`);
}

/* ---------- 3) 陈旧的 settings 快照 ---------- */
say('\n=== settings 快照（同一次排障产出的中间态，只留用户原始配置那一份） ===');
const KEEP_SETTINGS = 'settings_你的完整配置.json';
for (const f of fs.readdirSync(BKROOT, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name)) {
  if (!/^settings.*\.(json|bak|json\.bak)$/.test(f)) continue;
  if (f === KEEP_SETTINGS) { say(`  保留 ${f}`); continue; }
  const sz = fs.statSync(path.join(BKROOT, f)).size;
  say(`  删 ${f}（${(sz / 1048576).toFixed(1)} MB）`);
  delBk++;
  if (APPLY) fs.unlinkSync(path.join(BKROOT, f));
}

say(`\n合计：搬聊天 ${moved} 个｜删同名卡 ${delCards} 张｜删空的聊天目录 ${delDirs} 个｜删备份 ${delBk} 项`);
say(APPLY ? `✅ 已执行（时间戳 ${stamp}）` : '（预演。加 --apply 才动手。）');
