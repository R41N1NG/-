/**
 * P21_patch_nodragon.mjs —— 按主人令：删掉所有「九幽玄阴穴需要龙气」的表述（v2）
 * ─────────────────────────────────────────────────────────────────────────────
 * 处理原则：**只删"龙气是九幽玄阴穴的条件／依赖／必须"这一类的文字**；不编新句 ——
 *   凡是整句都是"必须龙气才成"的，就**整句删除**（一阶段锁语留空串），不拿别的说法顶替。
 * 涉及的源（按构建链）：
 *   ① `卡片脚本/_src/名器图鉴数据.json`：brief 的「唯有至阳龙气方能引动其深层造化」；
 *      stages.1.desc 的「触发条件是元阴初破、至阳龙气贯体」；stages.1.lock 的整句朱批。
 *   ② 写这个 JSON 的两个工具（`tools/_update_clean_briefs.js`、`tools/_inject_relic_annotations.js`）。
 *   ③ 面板产物与其模板（`卡片脚本/状态栏面板.js`、`卡片脚本/_src/状态栏面板.模板.js`）的同三处。
 *   ④ 卡内【名器·阶段】条源 `src/mingqi-db.js`：一阶段 desc 的「至阳龙气贯体」。
 *   ⑤ 台账字段描述 `卡片脚本/状态机.js` 与 `卡片脚本/GM修改器.js` 各两处。
 *   ⑥ `references/仙姝墮-世界书.json` 里【名器】九幽玄阴穴 正文的两处。
 * 不动：龙角/龙鳞/冰龙虚影等意象、"龙气逆流上头"（现象）、天龙皇朝龙气体系、九皇子、
 *       《极乐龙体诀》「专克九幽玄阴脉」、太上守郡符的"外邪（龙气）"、九幽玄阴脉的共鸣句。
 */
import fs from 'node:fs';

const LOCK_句 = '「极乐引·玄阴篇」朱批：万载玄冰封其户，非至阳真龙之息贯顶，不能破其极寒。';
const BRIEF_句 = '唯有至阳龙气方能引动其深层造化。';
const STAGE1_引 = '触发条件是元阴初破、至阳龙气贯体。';

const edits = [
  // ① 名器图鉴真源
  ['卡片脚本/_src/名器图鉴数据.json', BRIEF_句, '', '图鉴真源·brief 删「唯有至阳龙气方能引动…」'],
  ['卡片脚本/_src/名器图鉴数据.json', STAGE1_引, '触发条件是元阴初破。', '图鉴真源·一阶段 desc'],
  ['卡片脚本/_src/名器图鉴数据.json', LOCK_句, '', '图鉴真源·一阶段锁语整句删（留空串）'],
  // ② 两个工具
  ['tools/_update_clean_briefs.js', BRIEF_句, '', '工具·brief 同步'],
  ['tools/_inject_relic_annotations.js', `    1: '${LOCK_句}',\n`, '', '工具·删掉一阶段锁语那一行（不再注入）'],
  // ③ 面板产物与模板
  ['卡片脚本/状态栏面板.js', BRIEF_句, '', '面板产物·brief'],
  ['卡片脚本/状态栏面板.js', STAGE1_引, '触发条件是元阴初破。', '面板产物·一阶段 desc'],
  ['卡片脚本/状态栏面板.js', `"lock":"${LOCK_句}"`, '"lock":""', '面板产物·一阶段锁语置空'],
  ['卡片脚本/_src/状态栏面板.模板.js', BRIEF_句, '', '面板模板·brief'],
  ['卡片脚本/_src/状态栏面板.模板.js', STAGE1_引, '触发条件是元阴初破。', '面板模板·一阶段 desc'],
  ['卡片脚本/_src/状态栏面板.模板.js', `"lock":"${LOCK_句}"`, '"lock":""', '面板模板·一阶段锁语置空'],
  // ④ 卡内【名器·阶段】条源
  ['src/mingqi-db.js', STAGE1_引, '触发条件是元阴初破。', 'mingqi-db·一阶段 desc'],
  // ⑤ 台账字段描述
  ['卡片脚本/状态机.js', '元阴初破、龙气贯体时成形', '元阴初破时成形', '状态机·成形字段 desc'],
  ['卡片脚本/状态机.js', '元阴初破、龙气贯体的那一刻', '元阴初破的那一刻', '状态机·处女丧失字段 desc'],
  ['卡片脚本/GM修改器.js', '元阴初破、龙气贯体时成形', '元阴初破时成形', 'GM 字段表·成形 desc'],
  ['卡片脚本/GM修改器.js', '元阴初破、龙气贯体的那一刻', '元阴初破的那一刻', 'GM 字段表·处女丧失 desc'],
  // ⑥ 世界书底稿该条
  ['references/仙姝墮-世界书.json', '元阴初破、龙气贯体时花宫深处凝出虚幻冰莲花苞', '元阴初破时花宫深处凝出虚幻冰莲花苞', '世界书·觉醒阶次'],
  ['references/仙姝墮-世界书.json', '、身覆龙鳞，须依赖同源龙气方能引爆', '、身覆龙鳞', '世界书·删「须依赖同源龙气方能引爆」'],
];

const 报告 = { 改动: [], 未命中: [], 明细: [] };
const byFile = new Map();
for (const e of edits) { if (!byFile.has(e[0])) byFile.set(e[0], []); byFile.get(e[0]).push(e); }

for (const [file, list] of byFile) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch (err) { 报告.未命中.push({ 文件: file, 原因: '读不到：' + err.message }); continue; }
  const before = src;
  for (const [f, 旧, 新, 说明] of list) {
    const n = src.split(旧).length - 1;
    if (n === 0) { 报告.未命中.push({ 文件: f, 说明, 旧串: 旧.slice(0, 46) }); 报告.明细.push({ 文件: f, 说明, 命中: 0 }); continue; }
    src = src.split(旧).join(新);
    报告.改动.push({ 文件: f, 说明, 处数: n });
    报告.明细.push({ 文件: f, 说明, 命中: n });
  }
  if (src !== before) fs.writeFileSync(file, src, 'utf8');
}

/* JSON 合法性复检（改的是 JSON 真源） */
const 复检 = {};
for (const f of ['卡片脚本/_src/名器图鉴数据.json', 'references/仙姝墮-世界书.json']) {
  try { JSON.parse(fs.readFileSync(f, 'utf8')); 复检[f] = 'JSON 合法 ✓'; }
  catch (e) { 复检[f] = 'JSON **非法**：' + e.message; }
}
报告.JSON复检 = 复检;

fs.writeFileSync('E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/18s_删龙气补丁报告.json', JSON.stringify(报告, null, 2), 'utf8');
console.log('改动 ' + 报告.改动.length + ' 条：');
for (const c of 报告.改动) console.log('  ✔ ' + c.文件 + ' — ' + c.说明 + '（' + c.处数 + ' 处）');
if (报告.未命中.length) { console.log('未命中 ' + 报告.未命中.length + ' 条：'); for (const m of 报告.未命中) console.log('  ？ ' + JSON.stringify(m)); }
console.log(JSON.stringify(复检, null, 1));
