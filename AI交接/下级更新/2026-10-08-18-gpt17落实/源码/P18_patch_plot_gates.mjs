/**
 * P18_patch_plot_gates.mjs —— 给主线三条固定世界事件入口加「可信日期＋必要事实」外层门
 * （gpt 17 §5-1「固定事件 53/58/64 及其他入口硬门与真实后果前置」；口径出自 gpt 05 §3 表 + 04 §48）：
 *   · 53（源 uid32）【剧情】四 · 南域大劫：加 `仙盟历 >= 1578.08`；上界仍是 ¬南域大劫（启动入口不要求自身完成）。
 *   · 58（源 uid35）【剧情】七 · 兽潮血战：加 `仙盟历 >= 1579.01`；场景前置换成「真到过天溪」的
 *        两个事实（已抵达天溪 ∨ 受征召南下），**去掉段位兜底**；大劫事实保留。
 *   · 64（源 uid39）【剧情】十一 · 天溪城破：加 `仙盟历 >= 1579.03` ＋ 兽潮前置（天溪城兽潮 ∨ 兽潮血战）；
 *        场景前置用双姝回归 ∨ 已抵达天溪，**去掉段位兜底**。
 * 硬时间一律包在**整个 OR 之外**（硬门包住 OR）。幂等：已是新门则跳过；首行不匹配则中止。
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const WB = 'E:/角色卡制作/仙姝堕/references/仙姝墮-世界书.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/18g_主线硬门补丁报告.json';

const 目标 = [
  {
    uid: 32, 名字: '【剧情】四 · 南域大劫 · 天姝会成立（神诅与四殿）',
    新门: "@@if ((variables.stat_data?.身份 === '赵无忧' && (Number(variables.stat_data?.仙盟历) >= 1578.08) && (variables.stat_data?.known?.['进入幽寂谷'] === true || variables.stat_data?.known?.['玄机子胁迫过叶红缨'] === true || Number(variables.stat_data?.段位 ?? 1) >= 4)) && !(variables.stat_data?.known?.['南域大劫'] === true))",
    说明: '硬日期 ≥1578.08 包住整个 OR；段位 4 的支路仍在 OR 里，但已无法越过日期；上界仍是 ¬南域大劫（启动入口不要求自身完成）',
  },
  {
    uid: 35, 名字: '【剧情】七 · 兽潮血战 · 玄机子装伤脱身',
    新门: "@@if ((variables.stat_data?.身份 === '赵无忧' && (Number(variables.stat_data?.仙盟历) >= 1579.01) && (variables.stat_data?.known?.['已抵达天溪'] === true || variables.stat_data?.known?.['受征召南下'] === true) && !(variables.stat_data?.known?.['天溪城兽潮'] === true || variables.stat_data?.known?.['兽潮血战'] === true)) && (variables.stat_data?.known?.['南域大劫'] === true))",
    说明: '硬日期 ≥1579.01；场景前置改为「已抵达天溪 ∨ 受征召南下」（去掉段位兜底）；大劫事实保留；上界仍是兽潮未立',
  },
  {
    uid: 39, 名字: '【剧情】十一 · 天溪城破',
    新门: "@@if ((variables.stat_data?.身份 === '赵无忧' && (Number(variables.stat_data?.仙盟历) >= 1579.03) && (variables.stat_data?.known?.['双姝回归'] === true || variables.stat_data?.known?.['已抵达天溪'] === true) && !(variables.stat_data?.known?.['天溪城破'] === true)) && (variables.stat_data?.known?.['南域大劫'] === true) && (variables.stat_data?.known?.['天溪城兽潮'] === true || variables.stat_data?.known?.['兽潮血战'] === true))",
    说明: '硬日期 ≥1579.03；兽潮前置（天溪城兽潮 ∨ 兽潮血战）；场景前置用双姝回归 ∨ 已抵达天溪（去掉段位兜底）',
  },
];

const raw = fs.readFileSync(WB, 'utf8');
const j = JSON.parse(raw);
const isArr = Array.isArray(j.entries);
const list = isArr ? j.entries : Object.values(j.entries);
const before = crypto.createHash('sha256').update(Buffer.from(raw, 'utf8')).digest('hex');

const report = { 世界书: WB, 改前SHA: before, 条目改动: [] };
let changed = 0;

for (const t of 目标) {
  const e = list.find((x) => Number(x.uid) === t.uid);
  if (!e) { report.条目改动.push({ uid: t.uid, 结果: '未找到该 uid' }); continue; }
  const lines = String(e.content).split('\n');
  const 旧门 = lines[0];
  if (旧门 === t.新门) { report.条目改动.push({ uid: t.uid, 名字: e.comment, 结果: '已是新门（幂等跳过）' }); continue; }
  if (!/^@@if/.test(旧门)) { report.条目改动.push({ uid: t.uid, 名字: e.comment, 结果: '首行不是 @@if，中止不改', 旧门: 旧门.slice(0, 200) }); continue; }
  lines[0] = t.新门;
  e.content = lines.join('\n');
  changed++;
  report.条目改动.push({ uid: t.uid, 名字: e.comment, 结果: '已替换首行', 说明: t.说明, 旧门, 新门: t.新门 });
}

if (changed) {
  const out = isArr ? j : Object.assign({}, j, { entries: Object.fromEntries(list.map((e) => [e.uid, e])) });
  fs.writeFileSync(WB, JSON.stringify(out, null, 2), 'utf8');
}
const after = crypto.createHash('sha256').update(fs.readFileSync(WB)).digest('hex');
report.改后SHA = after;
report.改动条数 = changed;
fs.writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');

console.log('改动 ' + changed + ' 条；SHA ' + before.slice(0, 16) + ' → ' + after.slice(0, 16));
for (const r of report.条目改动) console.log(' · uid' + r.uid + ' ' + (r.名字 || '') + ' ⇒ ' + r.结果);
