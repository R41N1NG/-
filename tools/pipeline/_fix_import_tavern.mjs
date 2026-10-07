#!/usr/bin/env node
/**
 * _fix_import_tavern.mjs —— **自己动手把卡导入酒馆**（不再推给主人）
 *
 * 背景（2026-09-28 第三十二轮，主人：「你自己在酒馆里删掉旧的导入新的」＋ 真机数据）：
 *   角色目录里查见 **两张同名系列卡**：
 *     · `仙姝墮 · 一张跑全书.png`   3,099 KB（比我的构建**新**）
 *     · `仙姝墮 · 一张跑全书1.png`  3,150 KB（**变体名**，也是新的）
 *   酒馆按文件加载 ⇒ 很可能一直在用**其中那张旧的/我构建之前的那份** ⇒
 *   我改的脚本压根没生效，主人才会反复看到同一个症状。**这就是"汤没换药没换"的真正原因。**
 *
 * 本脚本做三件事（都幂等）：
 *   ① 备份角色目录现有同类卡到 `_卡备份_<时间戳>/`
 *   ② **删掉全部同类卡**（含 `…1.png` 变体）
 *   ③ 把**刚构建的源卡**复制进去，并按内容（SHA256）核对
 *
 * 用法：node _fix_import_tavern.mjs [--apply]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const APPLY = process.argv.includes('--apply');
const SRC = '仙姝墮-角色卡（全书群像）.png';
const TAVERN = 'E:/tavern/SillyTavern/data/default-user/characters';
const TARGET_NAME = '仙姝墮 · 一张跑全书.png';
const MATCH = /^仙姝墮\s*·\s*一张跑全书.*\.png$/;

if (!existsSync(SRC)) { console.error('缺源卡：' + SRC); process.exit(2); }
const srcBuf = readFileSync(SRC);
const srcHash = createHash('sha256').update(srcBuf).digest('hex');
console.log('源卡：' + SRC + '｜' + srcBuf.length + ' B｜SHA256 ' + srcHash.slice(0, 16).toUpperCase());

const existing = readdirSync(TAVERN).filter((f) => MATCH.test(f));
console.log('\n角色目录里的同类卡 ' + existing.length + ' 张：');
for (const f of existing) {
  const p = join(TAVERN, f);
  const h = createHash('sha256').update(readFileSync(p)).digest('hex');
  console.log('  · ' + f + '｜' + statSync(p).size + ' B｜' + h.slice(0, 16).toUpperCase()
    + (h === srcHash ? '  ← 与源卡一致' : '  ← **与源卡不同（就是它）**'));
}

if (!APPLY) {
  console.log('\n（预演）将要：① 备份到 _卡备份_<时间戳>/ ② 删掉上面全部同类卡 ③ 放入源卡并核对');
  console.log('加 --apply 才写盘');
  process.exit(0);
}

/* ① 备份 */
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const bakDir = join(TAVERN, '_卡备份_' + stamp);
mkdirSync(bakDir, { recursive: true });
for (const f of existing) copyFileSync(join(TAVERN, f), join(bakDir, f));
console.log('\n① 已备份 ' + existing.length + ' 张 ⇒ ' + bakDir);

/* ② 删除同类卡（含变体） */
let removed = 0;
for (const f of existing) { try { unlinkSync(join(TAVERN, f)); removed += 1; } catch (e) { console.error('删不掉 ' + f + '：' + e.message); } }
console.log('② 已删除 ' + removed + ' 张');

/* ③ 放入源卡并核对 */
const dst = join(TAVERN, TARGET_NAME);
copyFileSync(SRC, dst);
const dstHash = createHash('sha256').update(readFileSync(dst)).digest('hex');
console.log('③ 已导入：' + TARGET_NAME + '｜' + statSync(dst).size + ' B｜SHA256 ' + dstHash.slice(0, 16).toUpperCase());
if (dstHash === srcHash) console.log('\n✅ 内容核对通过：源卡 ≡ 酒馆（' + srcHash.slice(0, 16).toUpperCase() + '）');
else { console.error('\n❌ 内容不符！'); process.exit(2); }

/* ④ 再扫一遍，确认只剩一张 */
const after = readdirSync(TAVERN).filter((f) => MATCH.test(f));
console.log('④ 导入后同类卡剩 ' + after.length + ' 张：' + after.join('、') + (after.length === 1 ? ' ✅' : ' ⚠️'));
