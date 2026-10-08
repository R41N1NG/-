/**
 * P26_patch_diag_suspect.mjs —— 给面板诊断 diag() 加一行「自由字段待核」，
 * 让 C 方案（泛指战事只记账）在**面板上看得见**（主人令·选 C / gpt「日志留痕」）。
 * 同时改产物（`卡片脚本/状态栏面板.js`）与模板（`卡片脚本/_src/状态栏面板.模板.js`）。
 */
import fs from 'node:fs';

const 行 = '    `全页 pre[data-xds-src]: ${D.querySelectorAll(\'[data-xds-src]\').length} 个`,';
const 新行 = 行 + '\n' +
  '    `自由字段待核: ${(() => { try { const s = xsdStatData() || {}; const w = s.自由字段待核; if (!w) return \'无\'; const items = (w.项 || []); return items.length + \' 项（楼 \' + (w.楼 === null || w.楼 === undefined ? \'?\' : w.楼) + \'）：\' + items.map((x) => x.字段).join(\'、\'); } catch (e) { return \'?\'; } })()}`,  /* 主人令·选C：泛指战事只记账待核，面板可见 */';

const 目标 = ['卡片脚本/状态栏面板.js', '卡片脚本/_src/状态栏面板.模板.js'];
const 报告 = [];
for (const f of 目标) {
  const src = fs.readFileSync(f, 'utf8');
  if (src.includes('自由字段待核:')) { 报告.push({ 文件: f, 结果: '已存在（幂等跳过）' }); continue; }
  const n = src.split(行).length - 1;
  if (n !== 1) { 报告.push({ 文件: f, 结果: '锚点命中 ' + n + ' 次，未改' }); continue; }
  fs.writeFileSync(f, src.replace(行, 新行), 'utf8');
  报告.push({ 文件: f, 结果: '已加 diag 一行' });
}
console.log(JSON.stringify(报告, null, 1));
fs.writeFileSync('E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/19e_diag加待核行报告.json', JSON.stringify(报告, null, 2), 'utf8');
