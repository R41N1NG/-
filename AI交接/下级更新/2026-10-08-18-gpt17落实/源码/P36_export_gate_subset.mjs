/**
 * P36_export_gate_subset.mjs —— 按 gpt 22 批要求导出「本次卡的阶段条子集（metadata ＋ 完整条件门）」，
 * 让她能在云端独立复算，不必再传全项目。
 * 另附：立绘**实际 CSS 尺寸**的可核数字（微卡立绘与灯箱），用于回答"720 宽到底清不清晰"。
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const CARD = '最新角色卡/仙姝堕.json';
const OUT = 'AI交接/下级更新/2026-10-08-18-gpt17落实/材料/24b_阶段条子集（metadata＋完整门）.json';
const raw = fs.readFileSync(CARD);
const card = JSON.parse(raw.toString('utf8'));

const 条 = [];
for (const e of card.data.character_book.entries) {
  if (!/^【名器·(阶段|简介)】/.test(e.comment || '')) continue;
  条.push({
    id: e.id, uid: e.uid ?? null, comment: e.comment,
    constant: e.constant === true, enabled: e.enabled !== false, disable: e.disable === true,
    keys: e.keys || [], secondaryKeys: e.secondaryKeys || e.keysecondary || null,
    selective: e.selective === true, selectiveLogic: e.selectiveLogic ?? null,
    order: e.order ?? null, position: e.position ?? null, depth: e.depth ?? null,
    preventRecursion: e.preventRecursion === true, excludeRecursion: e.excludeRecursion === true,
    字符数: (e.content || '').length,
    首行完整门: String(e.content || '').split(/\r?\n/)[0],
  });
}

const 世界书源 = JSON.parse(fs.readFileSync('references/仙姝墮-世界书.json', 'utf8'));
const 源列表 = Array.isArray(世界书源.entries) ? 世界书源.entries : Object.values(世界书源.entries || {});
const 名器源 = {};
for (const e of 源列表) {
  const m = /^【名器】(.+)$/.exec((e.comment || '').trim());
  if (m) 名器源[m[1]] = { uid: e.uid, constant: e.constant === true, enabled: e.enabled !== false, key: e.key || e.keys || null };
}

const 分组 = {};
for (const t of 条) {
  const m = /^【名器·(阶段)】([^、]+)、([一二三四])阶段/.exec(t.comment);
  if (m) { 分组[m[2]] = 分组[m[2]] || []; 分组[m[2]].push({ 阶段: m[3], id: t.id }); }
}

const out = {
  用途: 'gpt 22 批「下一步提交的最小证据」第 1 项：阶段条子集（仅 metadata 与完整条件门），供云端独立复算',
  卡: CARD,
  卡字节: raw.length,
  卡SHA256: crypto.createHash('sha256').update(raw).digest('hex'),
  条目数: card.data.character_book.entries.length,
  阶段条统计: Object.fromEntries(Object.entries(分组).map(([k, v]) => [k, v.length + ' 个阶段条' + (v.length === 4 ? '' : '（⚠️ 缺 ' + (4 - v.length) + ' 个）')])),
  阶段条总数: 条.filter((t) => /【名器·阶段】/.test(t.comment)).length,
  世界书真源对应: 名器源,
  明细: 条,
};
fs.mkdirSync(OUT.split('/').slice(0, -1).join('/'), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log('【阶段条子集导出】' + OUT);
console.log('  卡 SHA256 ' + out.卡SHA256 + '（' + raw.length + ' B）');
console.log('  阶段条总数 ' + out.阶段条总数 + '（13 件 × 4 = 52 才齐）');
for (const [k, v] of Object.entries(out.阶段条统计)) console.log('    ' + k.padEnd(8) + ' ' + v);

/* ── 立绘实际 CSS 尺寸（从面板源码里读，不猜）── */
const panel = fs.readFileSync('卡片脚本/状态栏面板.js', 'utf8');
const 抽取 = (标记, n = 3) => {
  const i = panel.indexOf(标记);
  if (i < 0) return null;
  return panel.slice(i, i + n * 220).split('\n').slice(0, n).join('\n    ');
};
console.log('\n【立绘实际 CSS 尺寸·从面板源码读】');
for (const [名, 标记] of [
  ['微卡立绘 <img.xds-pi> 样式', 'xds-pi'],
  ['灯箱大图样式', 'max-width:min(560px,94vw)'],
  ['灯箱容器/覆盖层', 'xsd-lightbox-modal'],
]) {
  const s = 抽取(标记);
  console.log('  · ' + 名 + '：\n    ' + (s ? s.replace(/\s+/g, ' ').slice(0, 300) : '（源码里找不到该标记）'));
}
const mPi = /xds-pi[^;]{0,200}?width:\s*(\d+)px/.exec(panel);
const mPi2 = /xds-pi[\s\S]{0,400}?height:\s*(\d+)px/.exec(panel);
console.log('\n  实测解析：微卡立绘 width=' + (mPi ? mPi[1] : '?') + 'px  height=' + (mPi2 ? mPi2[1] : '?') + 'px');
console.log('  灯箱上限：width min(560px, 94vw)／height 74vh（源码硬编码，见上）');
console.log('  ⇒ 设备像素需求（DPR=2）：微卡 ' + (mPi ? Number(mPi[1]) * 2 : '?') + ' 宽；灯箱 ' + 560 * 2 + ' 宽');
console.log('  ⇒ 本次新图内嵌大图 720 宽 vs 灯箱 DPR2 需求 1120 宽 ⇒ **720 不足 1:1，会放大约 1.56×**（如实记，不声称必然清晰）');
console.log('  ⇒ 本次新图内嵌小图 192 宽 vs 微卡 DPR2 需求 ' + (mPi ? Number(mPi[1]) * 2 : '?') + ' 宽 ⇒ ' + (mPi && Number(mPi[1]) * 2 <= 192 ? '足够' : '不足'));
console.log('  ⇒ 但灯箱链里**本地原图（994×1583）排在第二位**，若玩家本机图库有该文件，DPR2 下仍是下采样 ⇒ 真正 1:1 的路径是"本地原图"');
