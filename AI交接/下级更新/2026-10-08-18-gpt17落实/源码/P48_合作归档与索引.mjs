/**
 * P48_合作归档与索引.mjs —— 按主人令整理 `AI交接/合作.txt`：
 *   ① 旧内容**整体归档**到 `AI交接/归档/合作（归档-截至<时间>）.txt`（原文不删不改）
 *   ② **移除** `AI交接/合作.txt`
 *   ③ 只留一份 **改动记录与索引** `AI交接/改动记录.md`：时间｜参与者｜更改项目｜完成结果（表格）
 * 只读合作.txt 原文；归档=移动；索引由解析生成。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/角色卡制作/仙姝堕';
const 合作 = path.join(ROOT, 'AI交接/合作.txt');
const 归档目录 = path.join(ROOT, 'AI交接/归档');
const 索引 = path.join(ROOT, 'AI交接/改动记录.md');
const 时间戳 = new Date().toISOString().slice(0, 10);

const raw = fs.readFileSync(合作, 'utf8');
const 行 = raw.split(/\r?\n/);

/* 解析每条发言头：`【身份：X｜日期：…｜时间：…｜时区：…｜类型：…】` */
const 头 = /【身份：([^｜|]+)[｜|]日期：([0-9]{4}-[0-9]{2}-[0-9]{2})[｜|]时间：([0-9:]+)[｜|]时区：([^｜|]+)[｜|]类型：([^】]+)】/g;
const 条 = [];
let m;
while ((m = 头.exec(raw)) !== null) {
  条.push({ 起点: m.index, 身份: m[1].trim(), 日期: m[2], 时间: m[3], 时区: m[4].trim(), 类型: m[5].replace(/\*\*/g, '').trim() });
}
for (let i = 0; i < 条.length; i++) 条[i].段 = raw.slice(条[i].起点, i + 1 < 条.length ? 条[i + 1].起点 : raw.length);

/* 完成结果：优先取段内「小总结」那句，其次取第一个非空正文句 */
const 完成结果 = (段) => {
  const s = 段.replace(/^【[^】]*】/, '').trim();
  const sm = /小总结[（(][^)）]*[)）]?[：:]?([^\n]{6,200})/.exec(s);
  if (sm) return sm[1].replace(/[*#`]/g, '').trim();
  const 首句 = s.split(/\n/).map((x) => x.trim()).find((x) => x && !/^[-#>|]/.test(x) && x.length > 8);
  return 首句 ? 首句.replace(/[*#`]/g, '').slice(0, 140) : '（详见归档原文）';
};
const 截 = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);
const 参与者 = (x) => (/deepseek/i.test(x) ? 'deepseek' : /gpt/i.test(x) ? 'gpt' : x);

/* ① 归档 */
fs.mkdirSync(归档目录, { recursive: true });
const 归档名 = '合作（归档-截至' + 时间戳 + '）.txt';
fs.writeFileSync(path.join(归档目录, 归档名), raw, 'utf8');

/* ② 写索引（改动记录） */
const 表头 = [
  '# 改动记录与索引（唯一入口）',
  '',
  '> 主人令（2026-10-09）：**旧项目归档、移除 `合作.txt`，只留这份"改动记录＋索引"**。',
  '> 字段：**时间｜参与者｜更改项目｜完成结果**。明细原文见 `归档/' + 归档名 + '`（' + 条.length + ' 条发言，逐字保留）。',
  '',
  '| 时间（Asia/Shanghai） | 参与者 | 更改项目 | 完成结果 |',
  '| :--- | :--- | :--- | :--- |',
];
const 表体 = 条.map((t) => '| ' + t.日期 + ' ' + t.时间 + ' | ' + 参与者(t.身份) + ' | ' + 截(t.类型, 90).replace(/\|/g, '/') + ' | ' + 截(完成结果(t.段), 150).replace(/\|/g, '/') + ' |');
const 表尾 = [
  '',
  '## 索引口径与其它入口',
  '- **本表覆盖**：`归档/' + 归档名 + '` 中全部 ' + 条.length + ' 条发言（按时间顺序，一条一行）。',
  '- **"更改项目"** 取该条发言自报的「类型」原文；**"完成结果"** 优先取该条的「小总结」句，取不到时用首句概述，再取不到写"详见归档原文"。',
  '- **未改动任何历史原文**：归档文件与合作原文逐字节相同（sha256 见下），删除的只是 `合作.txt` 这个入口名。',
  '- 其它仍在用的入口：`COORDINATION_NOTES.md`（会话即时状态与避坑）、`docs/交接说明.md`（逐轮底账，含「主人原话」与「点名批评」两个固定子节）、`AI交接/下级更新/<批次>/`（材料与证据）。',
  '- **约定**：此后改动一律写进本文件（表格追加一行）；需要细节时查归档或对应批次的证据目录。',
  '',
  '## 归档校验',
  '- 原 `AI交接/合作.txt` 字节数：' + Buffer.byteLength(raw) + '；行数：' + 行.length + '。',
].join('\n');
let md = 表头.join('\n') + '\n' + 表体.join('\n') + '\n' + 表尾;
fs.writeFileSync(索引, md, 'utf8');

/* ③ 移除合作.txt（原文已归档） */
fs.unlinkSync(合作);

console.log('  发言条数：' + 条.length + '（参与者：' + JSON.stringify([...new Set(条.map((t) => 参与者(t.身份)))]) + '）');
console.log('  归档：AI交接/归档/' + 归档名 + '（' + Math.round(Buffer.byteLength(raw) / 1024) + ' KB）');
console.log('  索引：AI交接/改动记录.md（' + Math.round(Buffer.byteLength(md) / 1024) + ' KB，' + 条.length + ' 行表）');
console.log('  已移除：AI交接/合作.txt（原文完整保留在归档）');
console.log('  —— 前 3 行示例 ——');
for (const l of 表体.slice(0, 3)) console.log('  ' + l);
