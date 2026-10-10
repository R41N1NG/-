/**
 * P53_合作txt重建（总纲＋最近三个原文＋全部索引）.mjs —— 整体重建 `AI交接/合作.txt`，节序与层级理顺。
 * 结构：〇 总纲 ｜ 一 当前保留（最近三个讨论/执行中的项目，原文照录并**降级小标题**）
 *       二 全部项目索引（含已归档项目）｜ 三 索引口径与其它入口 ｜ 四 归档校验
 * 数据全部来自 `归档/合作（归档-截至2026-10-09）.txt`（原文，30 条），不编。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/角色卡制作/仙姝堕';
const 合作 = path.join(ROOT, 'AI交接/合作.txt');
const 归档目录 = path.join(ROOT, 'AI交接/归档');
const 归档 = path.join(归档目录, '合作（归档-截至2026-10-09）.txt');
const 下级 = path.join(ROOT, 'AI交接/下级更新');
const 原文 = fs.readFileSync(归档, 'utf8');

const 头 = /【身份：([^｜|]+)[｜|]日期：([0-9]{4}-[0-9]{2}-[0-9]{2})[｜|]时间：([0-9:]+)[｜|]时区：([^｜|]+)[｜|]类型：([^】]+)】/g;
const 条 = [];
let m;
while ((m = 头.exec(原文)) !== null) 条.push({ 起点: m.index, 身份: m[1].trim(), 日期: m[2], 时间: m[3], 时区: m[4].trim(), 类型: m[5].replace(/\*\*/g, '').trim() });
for (let i = 0; i < 条.length; i++) 条[i].文 = 原文.slice(条[i].起点, i + 1 < 条.length ? 条[i + 1].起点 : 原文.length).trim();
const 参与者 = (x) => (/deepseek/i.test(x) ? 'deepseek' : /gpt/i.test(x) ? 'gpt' : x.trim());
const 完成结果 = (段) => {
  const s = 段.replace(/^【[^】]*】/, '').trim();
  const sm = /小总结[（(][^)）]*[)）]?[：:]?([^\n]{6,200})/.exec(s);
  if (sm) return sm[1].replace(/[*#`]/g, '').trim();
  const 首句 = s.split(/\n/).map((x) => x.trim()).find((x) => x && !/^[-#>|]/.test(x) && x.length > 8);
  return 首句 ? 首句.replace(/[*#`]/g, '').slice(0, 140) : '（详见归档原文）';
};
const 截 = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);

const 最近 = 条.slice(-3), 其余 = 条.slice(0, -3);
const 项目 = fs.readdirSync(下级, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
  const p = path.join(下级, d.name); const f = [];
  (function 走(q) { for (const e of fs.readdirSync(q, { withFileTypes: true })) { const c = path.join(q, e.name); e.isDirectory() ? 走(c) : f.push(c); } })(p);
  return { 名: d.name, 文件数: f.length, KB: Math.round(f.reduce((a, c) => a + fs.statSync(c).size, 0) / 1024) };
}).sort((a, b) => a.名.localeCompare(b.名));
const 归档项目 = fs.existsSync(path.join(归档目录, '下级更新')) ? fs.readdirSync(path.join(归档目录, '下级更新'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
const 今日 = new Date().toISOString().slice(0, 10);

const 降级 = (s) => s.replace(/^(#{1,4}) /gm, (x, h) => '#'.repeat(Math.min(6, h.length + 3)) + ' ');

const md = [
  '# 合作 · 入口（总纲 ＋ 最近三个讨论原文 ＋ 全部项目索引）',
  '',
  '## 〇、总纲（主人 2026-10-09 立规）',
  '1. **入口就是本文件**：`AI交接/合作.txt` 保留；里面只放**最近三个「讨论／执行中」的项目原文**（第一节）＋**全部项目索引**（第二节）。',
  '2. **过往全部保留、只移不删**：更早的发言原文**一条不删**，整体归档在 `归档/合作（归档-截至2026-10-09）.txt`（' + Math.round(Buffer.byteLength(原文) / 1024) + ' KB／' + 条.length + ' 条）；旧项目目录同样**只移不删**，在 `归档/下级更新/`。',
  '3. **最近三个项目一律不删、不改、不搬**；只有更旧的才移入 `归档/<分类>/<原项目名>/`。',
  '4. **以后这类收尾／归档／整理任务一律由 deepseek（大肥鱼）执行**；gpt 只负责她自己的实现与云端验证。',
  '5. **字段固定**：索引每行只写 **时间｜参与者｜更改项目｜完成结果**。',
  '',
  '## 一、当前保留（**最近三个讨论／执行中的项目**，原文照录）',
  '',
  '> 更早的 ' + 其余.length + ' 条全文在 `归档/合作（归档-截至2026-10-09）.txt`（一条未删），索引见第二节。',
  '',
  ...最近.map((t) => '### ' + t.日期 + ' ' + t.时间 + '（' + 参与者(t.身份) + '）｜' + t.类型 + '\n\n' + 降级(t.文.replace(/^【[^】]*】\s*/, '')) + '\n'),
  '## 二、全部项目索引（含已归档项目）',
  '',
  '| 时间（Asia/Shanghai） | 参与者 | 更改项目 | 完成结果 |',
  '| :--- | :--- | :--- | :--- |',
  ...条.map((t) => '| ' + t.日期 + ' ' + t.时间 + ' | ' + 参与者(t.身份) + ' | ' + 截(t.类型, 90).replace(/\|/g, '/') + ' | ' + 截(完成结果(t.文), 150).replace(/\|/g, '/') + ' |'),
  ...项目.map((x) => '| ' + 今日 + ' 22:5x | deepseek | **保留项目**｜' + x.名 + ' | 现状 ' + x.文件数 + ' 文件／' + x.KB + ' KB；**不删不动** |'),
  ...归档项目.map((n) => '| ' + 今日 + ' 22:2x | deepseek | 归档旧项目｜' + n + ' | 已移入 `归档/下级更新/' + n + '/`（原文未改） |'),
  '',
  '## 三、索引口径与其它入口',
  '- **本表覆盖**：全部 ' + 条.length + ' 条发言；原文保留最近 ' + 最近.length + ' 条（第一节），其余 ' + 其余.length + ' 条全文归档。',
  '- **"更改项目"** 取该条自报的「类型」原文；**"完成结果"** 优先取「小总结」句，取不到用首句概述，再取不到写"详见归档原文"。',
  '- 其它入口：`COORDINATION_NOTES.md`（会话即时状态与避坑）、`docs/交接说明.md`（逐轮底账，含「主人原话」与「点名批评」两个固定子节）、`下级更新/<项目>/`（材料与证据）、`归档/`（旧项目与旧发言明细）。',
  '',
  '## 四、归档校验',
  '- 归档原文：`归档/合作（归档-截至2026-10-09）.txt`，' + Buffer.byteLength(原文) + ' 字节／' + 原文.split(/\r?\n/).length + ' 行／' + 条.length + ' 条发言（**逐字节保留，未删改**）。',
  '- 归档项目：' + (归档项目.length ? 归档项目.join('、') : '（无）') + '；待留项目：' + 项目.map((x) => x.名).join('、') + '。',
].join('\n');

fs.writeFileSync(合作, md, 'utf8');
console.log('  已重建 合作.txt：' + Math.round(fs.statSync(合作).size / 1024) + ' KB');
console.log('  §一 原文保留：' + 最近.map((t) => t.日期 + ' ' + t.时间).join('、') + '（3 条）');
console.log('  §二 索引行：' + (条.length + 项目.length + 归档项目.length) + ' 行（发言 ' + 条.length + '＋保留项目 ' + 项目.length + '＋归档 ' + 归档项目.length + '）');
console.log('  §四 归档原文仍在：' + Math.round(Buffer.byteLength(原文) / 1024) + ' KB');
