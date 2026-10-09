/**
 * P50_合作txt恢复为“总结与索引”.mjs —— 按主人更正：
 *   ① **`AI交接/合作.txt` 保留**（不删、不改名），内容＝**总结与索引**（时间｜参与者｜更改项目｜完成结果）
 *   ② 旧发言明细＝**归档**文件（`归档/合作（归档-截至2026-10-09）.txt`），不在合作.txt 内堆放
 *   ③ 删掉我擅自新建的 `改动记录.md`（入口名不该由我改）
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:/角色卡制作/仙姝堕';
const 合作 = path.join(ROOT, 'AI交接/合作.txt');
const 我的 = path.join(ROOT, 'AI交接/改动记录.md');
const 归档 = path.join(ROOT, 'AI交接/归档/合作（归档-截至2026-10-09）.txt');

let md = fs.readFileSync(我的, 'utf8');

/* 总纲第 1 条改回正确口径：合作.txt 保留、只放总结与索引 */
md = md.replace(
  /^1\. \*\*入口唯一\*\*：.*$/m,
  '1. **本文件＝总结与索引（入口名不变）**：`AI交接/合作.txt` **保留**，内容只放「总结＋索引（时间｜参与者｜更改项目｜完成结果）」；**旧发言明细整体归档**在 `归档/合作（归档-截至2026-10-09）.txt`（' + (fs.existsSync(归档) ? Math.round(fs.statSync(归档).size / 1024) + ' KB，30 条发言，逐字节保留' : '（归档文件缺失，待补）') + '）。'
);
/* 顶部标题保持"合作"，并注明本文件性质 */
md = md.replace(/^# 改动记录与索引（唯一入口）$/m, '# 合作 · 总结与索引（AI交接 入口）');
md = md.replace(/^- \*\*入口唯一\*\*.*$/m, '- **本表覆盖**：`归档/合作（归档-截至2026-10-09）.txt` 中全部发言（较早的按时间顺序一条一行）。');
md = md.replace(/其它仍在用的入口[\s\S]*?$/m, '其它仍在用的入口：`COORDINATION_NOTES.md`（会话即时状态与避坑）、`docs/交接说明.md`（逐轮底账，含「主人原话」与「点名批评」两个固定子节）、`下级更新/<最近三个项目>/`（材料与证据）、`归档/`（旧项目与旧发言明细）。\n');

fs.writeFileSync(合作, md, 'utf8');
if (fs.existsSync(我的)) fs.unlinkSync(我的);
console.log('  ✔ 已恢复并写入：AI交接/合作.txt（' + Math.round(fs.statSync(合作).size / 1024) + ' KB，＝总纲＋总结索引）');
console.log('  ✔ 已删除我擅自新建的：AI交接/改动记录.md');
console.log('  ✔ 旧明细归档仍在：' + (fs.existsSync(归档) ? '归档/合作（归档-截至2026-10-09）.txt（' + Math.round(fs.statSync(归档).size / 1024) + ' KB）' : '**缺失**'));
