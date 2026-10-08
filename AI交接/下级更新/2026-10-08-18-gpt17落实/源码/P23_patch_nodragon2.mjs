/**
 * P23_patch_nodragon2.mjs —— 补漏：`references/仙姝墮-世界书.json` 里【名器】九幽玄阴穴 正文的
 * 「## 四段觉醒＝四次换装」表格中还有两处"需要龙气"：
 *   · 「元阴初破、龙气贯体，花宫凝出…」⇒ 去掉"龙气贯体"
 *   · 「…龙气逆流上头；须依赖同源龙气方能引爆」⇒ 去掉"须依赖同源龙气方能引爆"（保留"龙气逆流上头"这一现象句）
 * 第一版补丁只命中了「觉醒阶次」那一段，漏了同条正文里的表格 —— 这是补漏，不是新范围。
 */
import fs from 'node:fs';

const F = 'references/仙姝墮-世界书.json';
const edits = [
  ['元阴初破、龙气贯体，花宫凝出', '元阴初破，花宫凝出', '表格·一阶段：去「龙气贯体」'],
  ['龙气逆流上头；须依赖同源龙气方能引爆', '龙气逆流上头', '表格·四阶段：删「须依赖同源龙气方能引爆」'],
];

const src0 = fs.readFileSync(F, 'utf8');
let src = src0;
const out = [];
for (const [旧, 新, 说明] of edits) {
  const n = src.split(旧).length - 1;
  out.push({ 说明, 命中: n });
  if (n) src = src.split(旧).join(新);
}
if (src !== src0) fs.writeFileSync(F, src, 'utf8');
let jsonOk = '✅';
try { JSON.parse(fs.readFileSync(F, 'utf8')); } catch (e) { jsonOk = '❌ ' + e.message; }
console.log('改动：' + JSON.stringify(out));
console.log('JSON 复检：' + jsonOk);
fs.writeFileSync('E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/18s2_删龙气补漏报告.json', JSON.stringify({ 文件: F, 明细: out, JSON复检: jsonOk }, null, 2), 'utf8');
