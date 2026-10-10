/**
 * P49_保留最近三个项目.mjs —— 按主人令：
 *   ① 只保留最近**三个**项目（`AI交接/下级更新/<批次>`），更旧的**整体归档**到 `归档/下级更新/`
 *   ② 把「归档规则」与「**以后这种收尾任务都由 deepseek 执行**」写进 `改动记录.md` 的**开头总纲**
 *   ③ 归档动作在索引表里各记一行（时间｜参与者｜更改项目｜完成结果）
 * 原文一律不动，只做移动。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/角色卡制作/仙姝堕';
const 下级 = path.join(ROOT, 'AI交接/下级更新');
const 归档 = path.join(ROOT, 'AI交接/归档/下级更新');
const 索引 = path.join(ROOT, 'AI交接/改动记录.md');
const 保留最近 = 3;

const 全部 = fs.readdirSync(下级, { withFileTypes: true }).filter((d) => d.isDirectory())
  .map((d) => ({ 名: d.name, 时间: fs.statSync(path.join(下级, d.name)).mtimeMs }))
  .sort((a, b) => a.时间 - b.时间);
const 保留 = 全部.slice(-保留最近).map((x) => x.名);
const 归档列表 = 全部.filter((x) => !保留.includes(x.名)).map((x) => x.名);
console.log('  项目共 ' + 全部.length + ' 个｜保留最近 ' + 保留最近 + ' 个：' + 保留.join('、'));
console.log('  待归档：' + (归档列表.join('、') || '（无）'));

fs.mkdirSync(归档, { recursive: true });
const 已归档 = [];
for (const 名 of 归档列表) {
  const 目标 = path.join(归档, 名);
  if (fs.existsSync(目标)) { console.log('  ⚠️ 归档目标已存在，跳过：' + 名); continue; }
  fs.renameSync(path.join(下级, 名), 目标);
  const 文件数 = (function 数(p) { let n = 0; for (const e of fs.readdirSync(p, { withFileTypes: true })) n += e.isDirectory() ? 数(path.join(p, e.name)) : 1; return n; })(目标);
  已归档.push({ 名, 文件数 });
  console.log('  ✔ 已归档：下级更新/' + 名 + ' → 归档/下级更新/' + 名 + '（' + 文件数 + ' 个文件）');
}

/* 开头总纲 + 表尾追加 */
let md = fs.readFileSync(索引, 'utf8');
const 总纲 = [
  '# 改动记录与索引（唯一入口）',
  '',
  '## 〇、总纲（主人 2026-10-09 立规，每次都按这个来）',
  '1. **入口唯一**：改动的记录一律写在本文件；**`AI交接/合作.txt` 已移除**，其全部原文归档于 `归档/合作（归档-截至2026-10-09）.txt`（逐字节保留）。',
  '2. **旧项目归档、只留最近三个**：每个分类目录（如 `下级更新/`）**只保留最近三个项目**，更旧的**整体移入** `归档/<分类>/<原项目名>/`，**原文不删不改**；归档动作在本表各记一行。',
  '3. **收尾任务由 deepseek 执行**：**以后这类收尾／归档／整理任务一律由 deepseek（大肥鱼）执行**，不再等 gpt；gpt 只负责她自己的实现与云端验证。',
  '4. **字段固定**：本表每行只写 **时间｜参与者｜更改项目｜完成结果**；细节去 `归档/` 或对应批次的证据目录查。',
  '',
  '## 一、改动记录（时间｜参与者｜更改项目｜完成结果）',
  '',
].join('\n');
md = md.replace(/^# 改动记录与索引（唯一入口）\n/, 总纲);
md = md.replace(/\n## 索引口径与其它入口/, '\n## 索引口径与其它入口');
/* 表尾追加归档行（插在"## 索引口径与其它入口"之前） */
const 今日 = new Date().toISOString().slice(0, 10);
const 新行 = 已归档.map((x) => '| ' + 今日 + ' 22:2x | deepseek | 归档旧项目｜' + x.名 + ' | 已移入 `归档/下级更新/' + x.名 + '/`（' + x.文件数 + ' 个文件，原文未改） |').join('\n');
if (新行) md = md.replace(/\n## 索引口径与其它入口/, '\n' + 新行 + '\n\n## 索引口径与其它入口');
md = md.replace(/^- \*\*未改动任何历史原文\*\*.*$/m, (s) => s + '\n- **归档留存**：`归档/下级更新/`（旧项目）与 `归档/合作（归档-截至2026-10-09）.txt`（合作原文）。');
fs.writeFileSync(索引, md, 'utf8');
console.log('  ✔ 总纲与归档行已写入：AI交接/改动记录.md（' + Math.round(fs.statSync(索引).size / 1024) + ' KB）');
console.log('  现在 下级更新/ 下剩：' + fs.readdirSync(下级, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).join('、'));
