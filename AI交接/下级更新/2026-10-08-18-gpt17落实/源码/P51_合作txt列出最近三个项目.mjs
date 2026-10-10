/**
 * P51_合作txt列出最近三个项目.mjs —— 主人问"最近三个在哪儿呢"（合作.txt 里只看到归档行）：
 *   在 `AI交接/合作.txt` 里**明确列出当前保留的最近三个项目**：
 *     · 索引表各加一行（时间｜参与者｜更改项目｜完成结果）
 *     · 并单列一节「当前保留的最近三个项目（不删不动）」，写清各自内容与文件数
 * 摘要由**实际目录内容**生成（不编）。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/角色卡制作/仙姝堕';
const 下级 = path.join(ROOT, 'AI交接/下级更新');
const 合作 = path.join(ROOT, 'AI交接/合作.txt');

const 项目 = fs.readdirSync(下级, { withFileTypes: true }).filter((d) => d.isDirectory())
  .map((d) => {
    const p = path.join(下级, d.name);
    const 文件 = [];
    (function 走(q) { for (const e of fs.readdirSync(q, { withFileTypes: true })) { const c = path.join(q, e.name); e.isDirectory() ? 走(c) : 文件.push({ rel: path.relative(p, c).replace(/\\/g, '/'), size: fs.statSync(c).size }); } })(p);
    return { 名: d.name, 时间: fs.statSync(p).mtime, 文件 };
  })
  .sort((a, b) => a.时间 - b.时间)
  .slice(-3);

const 摘要 = (x) => {
  const 顶层 = [...new Set(x.文件.map((f) => f.rel.split('/')[0]))];
  const 样本 = x.文件.slice(0, 4).map((f) => f.rel.split('/').pop()).join('、');
  return { 顶层, 样本, 文件数: x.文件.length, KB: Math.round(x.文件.reduce((a, f) => a + f.size, 0) / 1024) };
};
const 今日 = new Date().toISOString().slice(0, 10);

let md = fs.readFileSync(合作, 'utf8');
const 保留行 = 项目.map((x) => {
  const s = 摘要(x);
  return '| ' + 今日 + ' 22:4x | deepseek | **保留项目**｜' + x.名 + ' | 现状：' + s.文件数 + ' 个文件／' + s.KB + ' KB；含 ' + s.顶层.slice(0, 5).join('、') + '（如 ' + s.样本 + '）；**不删不动** |';
}).join('\n');

/* 表尾插入保留行（在归档行之前），并加一节清单 */
if (!md.includes('**保留项目**')) {
  md = md.replace(/\n(\| 20[0-9-]+ 22:2x \| deepseek \| 归档旧项目)/, '\n' + 保留行 + '\n$1');
}
const 节 = [
  '',
  '## 二、当前保留的最近三个项目（**不删、不改、不搬**）',
  '',
  ...项目.map((x) => {
    const s = 摘要(x);
    return '- **`下级更新/' + x.名 + '/`** —— ' + s.文件数 + ' 个文件／' + s.KB + ' KB；顶层：' + s.顶层.slice(0, 6).join('、') + '；抽样：' + s.样本;
  }),
  '',
  '> 口径：每个分类目录只保留最近三个项目；**这三个项目一律不删不动**，只有更旧的才移入 `归档/<分类>/<原项目名>/`。',
].join('\n');
if (!md.includes('## 二、当前保留的最近三个项目')) {
  md = md.replace('\n## 索引口径与其它入口', 节 + '\n\n## 索引口径与其它入口');
}
fs.writeFileSync(合作, md, 'utf8');

console.log('  已写入 合作.txt（' + Math.round(fs.statSync(合作).size / 1024) + ' KB）');
for (const x of 项目) { const s = 摘要(x); console.log('  · ' + x.名 + '：' + s.文件数 + ' 文件／' + s.KB + ' KB｜顶层 ' + s.顶层.slice(0, 5).join('、')); }
